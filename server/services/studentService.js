import Student from "../models/studentSchema.js";
import Project from "../models/projectSchema.js";
import Request from "../models/requestSchema.js";
import MarkingSchema from "../models/markingSchema.js";
import Faculty from "../models/facultySchema.js";
import Marks from "../models/marksSchema.js";
import { logger } from "../utils/logger.js";

export class StudentService {
  /**
   * Get student by registration number
   */
  static async getStudentByRegNo(regNo) {
    const student = await Student.findOne({ regNo })
      .populate({
        path: 'guideMarks',
        select: 'reviewType totalMarks componentMarks isSubmitted facultyType'
      })
      .populate({
        path: 'panelMarks',
        select: 'reviewType totalMarks componentMarks isSubmitted facultyType'
      })
      .lean();

    if (!student) {
      return null;
    }

    // Fetch schema map for accurate review processing
    let reviewTypes = null;
    let schemaReviews = [];
    try {
      const schema = await MarkingSchema.findOne({
        school: student.school,
        program: student.program,
        academicYear: student.academicYear
      });
      if (schema && schema.reviews) {
        schemaReviews = schema.reviews;
        reviewTypes = new Map();
        schema.reviews.forEach(r => {
          reviewTypes.set(r.reviewName, r.facultyType);
        });
      }
    } catch (err) {
      logger.error("Error fetching schema for student details marks calculation", err);
    }

    // Process Maps to Objects
    const processedStudent = this.processStudentData(student, reviewTypes, schemaReviews);

    // Find active project for this student
    const project = await Project.findOne({
      students: student._id,
      status: "active"
    })
      .populate("guideFaculty", "name")
      .populate("panel", "panelName")
      .lean();

    // Add guide and panel details AND project info
    // Also attach teammates for the details modal
    let teammates = [];
    if (project && project.students) {
      // Need to fetch teammate names
      // We can just rely on the project.students if populated, but they are just IDs here?
      // Let's quickly fetch them or if we don't want an extra query, maybe we skip names?
      // The details modal expects teammates array with {name, id}.
      // Let's fetch the teammate docs to get names.
      const teammateDocs = await Student.find({
        _id: { $in: project.students },
        regNo: { $ne: regNo } // Exclude self
      }).select('name _id').lean();

      teammates = teammateDocs.map(t => ({ id: t._id, name: t.name }));
    }

    return {
      ...processedStudent,
      guide: project?.guideFaculty?.name || "N/A",
      panelMember: project?.panel?.panelName || "N/A",
      projectTitle: project?.name || null,
      teammates: teammates
    };
  }

  /**
   * ✅ RENAMED: Get student list (matches controller call)
   */
  static async getStudentList(filters = {}) {
    return await this.getFilteredStudents(filters);
  }

  /**
   * Get filtered students list
   */
  static async getFilteredStudents(filters = {}) {
    const query = { isActive: true };

    if (filters.school) query.school = filters.school;
    if (filters.program) query.program = filters.program;
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.regNo) query.regNo = new RegExp(filters.regNo, "i");
    if (filters.name) query.name = new RegExp(filters.name, "i");

    // Fetch schema map if context is available
    let reviewTypes = null;
    if (filters.school && filters.program && filters.academicYear) {
      try {
        const schema = await MarkingSchema.findOne({
          school: filters.school,
          program: filters.program,
          academicYear: filters.academicYear
        });
        if (schema && schema.reviews) {
          reviewTypes = new Map();
          schema.reviews.forEach(r => {
            reviewTypes.set(r.reviewName, r.facultyType);
          });
        }
      } catch (err) {
        logger.error("Error fetching schema for student list marks calculation", err);
      }
    }

    const students = await Student.find(query).sort({ regNo: 1 }).lean();

    // Get all student IDs
    const studentIds = students.map(s => s._id);

    // Find active projects for these students
    const projects = await Project.find({
      students: { $in: studentIds },
      status: "active"
    })
      .populate("guideFaculty", "name")
      .populate("panel", "panelName") // Populating panel name
      .lean();

    // Create a map of studentId -> project details
    const studentProjectMap = {};
    if (projects) {
      projects.forEach(project => {
        if (!project.students) return;
        project.students.forEach(sId => {
          if (!sId) return;
          const studentIdStr = sId.toString();
          // Get teammates (exclude self)
          const teammates = project.students
            .filter(id => id && id.toString() !== studentIdStr)
            .map(id => {
              const teammate = students.find(s => s._id.toString() === id.toString());
              return teammate ? { id: teammate._id, name: teammate.name } : null;
            })
            .filter(Boolean);

          studentProjectMap[studentIdStr] = {
            guide: project.guideFaculty ? project.guideFaculty.name : "N/A",
            panelMember: project.panel ? project.panel.panelName : "N/A",
            projectTitle: project.name || null,
            teammates
          };
        });
      });
    }

    return students.map((student) => {
      const projectDetails = studentProjectMap[student._id.toString()] || {};
      return {
        ...this.processStudentData(student, reviewTypes),
        guide: projectDetails.guide || "N/A",
        panelMember: projectDetails.panelMember || "N/A",
        projectTitle: projectDetails.projectTitle,
        teammates: projectDetails.teammates || []
      };
    });
  }

  /**
   * Update student details
   */
  static async updateStudent(regNo, updates, userId) {
    const allowedFields = [
      "name",
      "emailId",
      "phoneNumber",
      "school",
      "program",
      "PAT",
    ];

    const validUpdates = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        validUpdates[field] = updates[field];
      }
    }

    // Validate school/program change
    if (updates.school || updates.program) {
      const student = await Student.findOne({ regNo });
      if (!student) {
        throw new Error("Student not found.");
      }

      const newSchool = updates.school || student.school;
      const newProgram = updates.program || student.program;

      const markingSchema = await MarkingSchema.findOne({
        school: newSchool,
        program: newProgram,
      });

      if (!markingSchema) {
        throw new Error(
          `No marking schema found for school: ${newSchool}, program: ${newProgram}`
        );
      }

      // Inherit contribution settings from schema if not explicitly provided
      if (
        updates.requiresContribution === undefined &&
        updates.contributionType === undefined
      ) {
        validUpdates.requiresContribution =
          markingSchema.requiresContribution || false;
        validUpdates.contributionType =
          markingSchema.contributionType || "none";
      }
    }

    if (Object.keys(validUpdates).length === 0) {
      throw new Error("No valid fields to update.");
    }

    const updatedStudent = await Student.findOneAndUpdate(
      { regNo },
      { $set: validUpdates },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      throw new Error("Student not found.");
    }

    logger.info("student_updated", {
      regNo,
      updatedFields: Object.keys(validUpdates),
      updatedBy: userId,
    });

    return updatedStudent;
  }

  /**
   * Delete student
   */
  static async deleteStudent(regNo, userId) {
    const student = await Student.findOne({ regNo });

    if (!student) {
      throw new Error("Student not found.");
    }

    // Check if student is part of any active project
    const project = await Project.findOne({
      students: student._id,
      status: "active",
    });

    if (project) {
      throw new Error(
        "Cannot delete student. Student is part of an active project."
      );
    }

    // Mark as inactive instead of hard delete
    student.isActive = false;
    await student.save();

    // Cleanup related requests
    await Request.updateMany(
      { student: student._id },
      { $set: { status: "cancelled" } }
    );

    logger.info("student_deleted", {
      regNo,
      studentId: student._id,
      deletedBy: userId,
    });

    return true;
  }

  /**
   * Update student marks (ADMIN001 only)
   */
  static async updateStudentMarks(regNo, reviewsData, userId) {
    const student = await Student.findOne({ regNo })
      .populate({
        path: 'guideMarks',
        select: 'reviewType totalMarks componentMarks isSubmitted facultyType'
      })
      .populate({
        path: 'panelMarks',
        select: 'reviewType totalMarks componentMarks isSubmitted facultyType'
      });

    if (!student) {
      throw new Error("Student not found.");
    }

    // Collect all existing marks documents
    const allMarks = [
      ...(student.guideMarks || []),
      ...(student.panelMarks || [])
    ];

    const updatedReviews = [];

    // Update Marks documents
    if (reviewsData) {
      for (const [reviewName, reviewData] of Object.entries(reviewsData)) {
        // Find matching marks doc
        const marksDoc = allMarks.find(m => m.reviewType === reviewName);

        if (marksDoc) {
          let hasChanges = false;
          let newTotal = 0;

          // Update components
          if (reviewData.marks && marksDoc.componentMarks) {
            marksDoc.componentMarks.forEach(comp => {
              if (reviewData.marks[comp.componentName] !== undefined) {
                const newVal = Number(reviewData.marks[comp.componentName]);
                if (!isNaN(newVal)) {
                  comp.marks = newVal;
                  comp.componentTotal = newVal; // Assuming componentTotal equals marks for simple components
                  hasChanges = true;
                }
              }
              newTotal += (comp.componentTotal || comp.marks || 0);
            });

            // If there's a discrepancy in total vs components loop, check if client sent a total?
            // Usually we assume components sum up to total.
            marksDoc.totalMarks = newTotal;
            marksDoc.isSubmitted = true; // Mark as submitted if edited by admin
          }

          if (hasChanges) {
            await marksDoc.save();
            updatedReviews.push(reviewName);
          }
        } else {
          logger.warn(`Skipping marks update for ${reviewName}: Marks document not found for student ${regNo}`);
        }
      }
    }

    logger.info("student_marks_updated", {
      regNo,
      updatedReviews,
      updatedBy: userId,
    });

    // Return fresh data mainly for UI update
    return this.processStudentData(student.toObject());
  }

  /**
   * Process student data (convert Maps to Objects)
   * @param {Object} student - Student document
   * @param {Map} reviewTypes - Map of reviewName -> facultyType
   * @param {Array} schemaReviews - Array of reviews from schema
   */
  static processStudentData(student, reviewTypes = null, schemaReviews = []) {
    // Process approvals Map
    let processedApprovals = {};
    if (student.approvals) {
      if (student.approvals instanceof Map) {
        processedApprovals = Object.fromEntries(student.approvals);
      } else if (typeof student.approvals === "object") {
        processedApprovals = { ...student.approvals };
      }
    }

    // Construct reviews object from guideMarks and panelMarks
    let processedReviews = {};
    let totalMarks = 0;
    let guideMarks = 0;
    let panelMarks = 0;
    let reviewStatuses = [];

    // Collect all marks documents
    const allMarks = [
      ...(student.guideMarks || []),
      ...(student.panelMarks || [])
    ];

    // Iterate through schema reviews to ensure all configured reviews are represented
    if (schemaReviews && schemaReviews.length > 0) {
      schemaReviews.forEach(schemaReview => {
        const reviewName = schemaReview.reviewName;
        const facultyType = schemaReview.facultyType;

        // Find matching marks doc
        const marksDoc = allMarks.find(m => m.reviewType === reviewName);

        // Initialize review data
        const reviewData = {
          marks: {},
          total: 0,
          locked: false // Will check from approvals later if needed
        };

        if (marksDoc) {
          reviewData.total = marksDoc.totalMarks || 0;

          if (marksDoc.componentMarks) {
            marksDoc.componentMarks.forEach(comp => {
              reviewData.marks[comp.componentName] = comp.componentTotal || comp.marks || 0;
            });
          }

          // Add to totals
          totalMarks += reviewData.total;
          if (facultyType === 'guide') guideMarks += reviewData.total;
          if (facultyType === 'panel') panelMarks += reviewData.total;
        }

        // Determine status
        let status = "pending";

        // Check submission status from Marks doc
        if (marksDoc && marksDoc.isSubmitted) {
          status = "submitted";
        }

        // Check explicit approval from student.approvals map
        if (processedApprovals) {
          const approvalKey = Object.keys(processedApprovals).find(
            k => k.toLowerCase() === reviewName.toLowerCase()
          );

          if (approvalKey && processedApprovals[approvalKey]?.approved) {
            status = "approved";
            reviewData.locked = true;
          }
        }

        reviewStatuses.push({
          name: reviewName,
          status: status,
          marks: reviewData.marks, // Include marks for frontend calculations
          type: facultyType
        });

        processedReviews[reviewName] = reviewData;
      });
    } else {
      // Fallback if no schema (or legacy data): iterate available marks
      allMarks.forEach(mark => {
        const reviewData = {
          marks: {},
          total: mark.totalMarks || 0
        };

        if (mark.componentMarks) {
          mark.componentMarks.forEach(comp => {
            reviewData.marks[comp.componentName] = comp.componentTotal || comp.marks || 0;
          });
        }

        totalMarks += reviewData.total;
        if (mark.facultyType === 'guide') guideMarks += reviewData.total;
        if (mark.facultyType === 'panel') panelMarks += reviewData.total;

        processedReviews[mark.reviewType] = reviewData;

        let status = mark.isSubmitted ? "submitted" : "pending";
        // Check explicit approval from student.approvals map
        if (processedApprovals) {
          const approvalKey = Object.keys(processedApprovals).find(
            k => k.toLowerCase() === mark.reviewType.toLowerCase()
          );

          if (approvalKey && processedApprovals[approvalKey]?.approved) {
            status = "approved";
            reviewData.locked = true;
          }
        }

        reviewStatuses.push({
          name: mark.reviewType,
          status: status,
          marks: reviewData.marks,
          type: mark.facultyType
        });
      });
    }

    // Check PPT status specifically if needed for the badge
    // The "PPT Approval" badge logic in frontend checks reviewStatuses.
    // If we have a review named 'PPT' or similar, it will show up.

    return {
      _id: student._id,
      regNo: student.regNo,
      name: student.name,
      emailId: student.emailId,
      phoneNumber: student.phoneNumber,
      school: student.school,
      program: student.program,
      academicYear: student.academicYear,
      reviews: processedReviews, // Now constructed from Marks docs
      approvals: processedApprovals,
      PAT: student.PAT || false,
      isActive: student.isActive,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
      totalMarks,
      marks: {
        total: totalMarks,
        guide: guideMarks,
        panel: panelMarks
      },
      reviewStatuses
    };
  }

  /**
   * Get marking schema for student's school/department
   */
  static async getMarkingSchemaForStudent(regNo) {
    const student = await Student.findOne({ regNo });

    if (!student) {
      throw new Error("Student not found.");
    }

    const schema = await MarkingSchema.findOne({
      school: student.school,
      program: student.program,
      academicYear: student.academicYear,
    }).lean();

    if (!schema) {
      throw new Error(
        "Marking schema not found for student's academic context."
      );
    }

    return schema;
  }

  /**
   * Bulk upload students
   */
  static async uploadStudents(
    studentsData,
    academicYear,
    school,
    program,
    userId
  ) {
    const results = {
      created: 0,
      updated: 0,
      errors: 0,
      details: [],
    };

    // Get marking schema
    const markingSchema = await MarkingSchema.findOne({
      academicYear,
      school,
      program,
    });

    if (!markingSchema) {
      throw new Error(
        "Marking schema not found for this school and program. Please create marking schema first."
      );
    }

    for (let i = 0; i < studentsData.length; i++) {
      try {
        const studentData = studentsData[i];

        if (!studentData.regNo || !studentData.name || !studentData.emailId) {
          results.errors++;
          results.details.push({
            row: i + 1,
            regNo: studentData.regNo || "N/A",
            error: "Missing required fields: regNo, name, or emailId",
          });
          continue;
        }

        // Check if student already exists
        const existing = await Student.findOne({ regNo: studentData.regNo });

        if (existing) {
          // Update existing student
          existing.name = studentData.name;
          existing.emailId = studentData.emailId;
          existing.phoneNumber =
            studentData.phoneNumber || existing.phoneNumber;
          existing.school = school;
          existing.program = program;
          existing.academicYear = academicYear;

          await existing.save();
          results.updated++;

          logger.info("student_updated_via_bulk", {
            regNo: studentData.regNo,
            updatedBy: userId,
          });
        } else {
          // Initialize reviews from marking schema
          const reviewsMap = new Map();
          markingSchema.reviews.forEach((review) => {
            const marks = {};
            if (Array.isArray(review.components)) {
              review.components.forEach((comp) => {
                marks[comp.name] = 0;
              });
            }

            reviewsMap.set(review.reviewName, {
              marks,
              comments: "",
              attendance: { value: false, locked: false },
              locked: false,
            });
          });

          // Initialize deadlines from marking schema
          const deadlineMap = new Map();
          markingSchema.reviews.forEach((review) => {
            if (review.deadline?.from && review.deadline?.to) {
              deadlineMap.set(review.reviewName, {
                from: review.deadline.from,
                to: review.deadline.to,
              });
            }
          });

          // Create student
          const student = new Student({
            regNo: studentData.regNo,
            name: studentData.name,
            emailId: studentData.emailId,
            phoneNumber: studentData.phoneNumber || "",
            academicYear,
            school,
            program,
            reviews: reviewsMap,
            deadline: deadlineMap,
            PAT: false,
            requiresContribution: markingSchema.requiresContribution || false,
            contributionType: markingSchema.contributionType || "none",
            isActive: true,
          });

          await student.save();

          // Handle Guide Assignment if guideEmpId provided
          if (studentData.guideEmpId) {
            const faculty = await Faculty.findOne({ employeeId: studentData.guideEmpId });

            if (faculty) {
              // Check if project already exists for this student
              const existingProject = await Project.findOne({
                students: existing ? existing._id : student._id,
                status: "active"
              });

              if (!existingProject) {
                const newProject = new Project({
                  name: `Project - ${studentData.regNo}`,
                  students: [existing ? existing._id : student._id],
                  guideFaculty: faculty._id,
                  academicYear,
                  school,
                  program,
                  specialization: faculty.specialization || "General",
                  type: "software", // Default
                  teamSize: 1,
                  status: "active"
                });
                await newProject.save();
                logger.info("project_created_with_guide", { regNo: studentData.regNo, guide: faculty.employeeId });
              }
            } else {
              // warning: guide not found, but student created.
              logger.warn("guide_not_found_on_student_upload", { regNo: studentData.regNo, guideEmpId: studentData.guideEmpId });
              // We could add a note to results.details? 
            }
          }

          if (!existing) { // increment only if new, existing flow was updated above
            results.created++;

            logger.info("student_created_via_bulk", {
              regNo: studentData.regNo,
              createdBy: userId,
            });
          }
        }

      } catch (error) {
        results.errors++;
        results.details.push({
          row: i + 1,
          regNo: studentsData[i]?.regNo || "N/A",
          error: error.message,
        });
      }
    }

    logger.info("students_bulk_upload_completed", {
      created: results.created,
      updated: results.updated,
      errors: results.errors,
      uploadedBy: userId,
    });

    return results;
  }

  /**
   * Get student by ID
   */
  static async getStudentById(studentId) {
    const student = await Student.findById(studentId).lean();

    if (!student) {
      throw new Error("Student not found.");
    }

    return this.processStudentData(student);
  }
}
