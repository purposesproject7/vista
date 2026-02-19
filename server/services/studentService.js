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
      }).lean();
      if (schema && schema.reviews) {
        schemaReviews = schema.reviews;
        reviewTypes = new Map();
        schema.reviews.forEach(r => {
          const rName = r.reviewName || r.name;
          if (rName) {
            reviewTypes.set(rName, r.facultyType);
          }
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
      .populate({
        path: "panel",
        select: "panelName members",
        populate: {
          path: "members.faculty",
          select: "name"
        }
      })
      .lean();

    // Add guide and panel details AND project info
    // Also attach teammates for the details modal
    let teammates = [];
    if (project && project.students) {
      const teammateDocs = await Student.find({
        _id: { $in: project.students },
        regNo: { $ne: regNo } // Exclude self
      }).select('name _id').lean();

      teammates = teammateDocs.map(t => ({ id: t._id, name: t.name }));
    }

    let panelMembers = "N/A";
    if (project?.panel?.members && project.panel.members.length > 0) {
      panelMembers = project.panel.members
        .map(m => m.faculty?.name)
        .filter(Boolean)
        .join(", ");
    } else if (project?.panel?.panelName) {
      panelMembers = project.panel.panelName;
    }

    return {
      ...processedStudent,
      guide: project?.guideFaculty?.name || "N/A",
      panelMember: panelMembers,
      projectTitle: project?.name || null,
      projectId: project?._id || null,
      teammates: teammates
    };
  }

  /**
   * Get student list (matches controller call)
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
    let schemaReviews = [];
    if (filters.school && filters.program && filters.academicYear) {
      try {
        const schema = await MarkingSchema.findOne({
          school: filters.school,
          program: filters.program,
          academicYear: filters.academicYear
        }).lean();
        if (schema && schema.reviews) {
          schemaReviews = schema.reviews;
          reviewTypes = new Map();
          schema.reviews.forEach(r => {
            const rName = r.reviewName || r.name;
            if (rName) {
              reviewTypes.set(rName, r.facultyType);
            }
          });
        }
      } catch (err) {
        logger.error("Error fetching schema for student list marks calculation", err);
      }
    }

    // Fetch students with populated marks
    const students = await Student.find(query)
      .sort({ regNo: 1 })
      .populate({
        path: 'guideMarks',
        select: 'reviewType totalMarks componentMarks isSubmitted facultyType'
      })
      .populate({
        path: 'panelMarks',
        select: 'reviewType totalMarks componentMarks isSubmitted facultyType'
      })
      .lean();

    // Get all student IDs
    const studentIds = students.map(s => s._id);

    // Find active projects for these students
    const projects = await Project.find({
      students: { $in: studentIds },
      status: "active"
    })
      .populate("guideFaculty", "name")
      .populate("guideFaculty", "name")
      .populate({
        path: "panel",
        select: "panelName members",
        populate: {
          path: "members.faculty",
          select: "name"
        }
      })
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

          let panelMembers = "N/A";
          if (project.panel?.members && project.panel.members.length > 0) {
            panelMembers = project.panel.members
              .map(m => m.faculty?.name)
              .filter(Boolean)
              .join(", ");
          } else if (project.panel?.panelName) {
            panelMembers = project.panel.panelName;
          }

          studentProjectMap[studentIdStr] = {
            guide: project.guideFaculty ? project.guideFaculty.name : "N/A",
            panelMember: panelMembers,
            projectTitle: project.name || null,
            projectId: project._id || null,
            teammates
          };
        });
      });
    }

    return students.map((student) => {
      const projectDetails = studentProjectMap[student._id.toString()] || {};
      return {
        ...this.processStudentData(student, reviewTypes, schemaReviews),
        guide: projectDetails.guide || "N/A",
        panelMember: projectDetails.panelMember || "N/A",
        projectTitle: projectDetails.projectTitle,
        teammates: projectDetails.teammates || [],
        projectId: projectDetails.projectId || null
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
            hasChanges = true;
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

    // Helper to calculate average of an array of numbers
    const calculateAverage = (arr) => {
      if (!arr || arr.length === 0) return 0;
      const sum = arr.reduce((a, b) => a + b, 0);
      return sum / arr.length;
    };

    // Iterate through schema reviews to ensure all configured reviews are represented
    if (schemaReviews && schemaReviews.length > 0) {
      schemaReviews.forEach(schemaReview => {
        const reviewName = schemaReview.reviewName || schemaReview.name || "Unknown";

        if (reviewName === "Unknown") {
          logger.warn("Found review in schema without reviewName:", schemaReview);
        }

        const facultyType = schemaReview.facultyType;

        // Find matching marks docs - CAN BE MULTIPLE FOR PANEL
        const matchingMarks = allMarks.filter(m => m.reviewType === reviewName);

        // Initialize review data
        const reviewData = {
          marks: {},
          total: 0,
          locked: false
        };

        let status = "pending";
        let issubmitted = false;

        if (matchingMarks.length > 0) {
          issubmitted = matchingMarks.some(m => m.isSubmitted);

          if (facultyType === 'panel') {
            // Filter only submitted marks for Panel
            const validPanelMarks = matchingMarks.filter(m => m.isSubmitted);

            if (validPanelMarks.length > 0) {
              // 1. Average Total Marks
              const totalScores = validPanelMarks.map(m => m.totalMarks || 0);
              reviewData.total = calculateAverage(totalScores);

              // 2. Average Component Marks
              const componentMap = {};

              validPanelMarks.forEach(markDoc => {
                if (markDoc.componentMarks) {
                  markDoc.componentMarks.forEach(comp => {
                    if (!componentMap[comp.componentName]) {
                      componentMap[comp.componentName] = [];
                    }
                    componentMap[comp.componentName].push(comp.componentTotal || comp.marks || 0);
                  });
                }
              });

              Object.keys(componentMap).forEach(compName => {
                reviewData.marks[compName] = calculateAverage(componentMap[compName]);
              });
            }
          } else {
            // Guide or others
            const marksDoc = matchingMarks[0];
            reviewData.total = marksDoc.totalMarks || 0;

            if (marksDoc.componentMarks) {
              marksDoc.componentMarks.forEach(comp => {
                reviewData.marks[comp.componentName] = comp.componentTotal || comp.marks || 0;
              });
            }
          }

          // Add to totals
          totalMarks += reviewData.total;
          if (facultyType === 'guide') guideMarks += reviewData.total;
          if (facultyType === 'panel') panelMarks += reviewData.total;

          if (issubmitted) status = "submitted";

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
      // Note: This fallback path might still duplicate assignments if not grouped.
      // Group by reviewType first
      const marksByReview = {};
      allMarks.forEach(m => {
        if (!marksByReview[m.reviewType]) marksByReview[m.reviewType] = [];
        marksByReview[m.reviewType].push(m);
      });

      Object.entries(marksByReview).forEach(([rName, docs]) => {
        const reviewData = {
          marks: {},
          total: 0
        };

        const facultyType = docs[0].facultyType; // Assume consistent
        const issubmitted = docs.some(m => m.isSubmitted);

        if (facultyType === 'panel') {
          // Filter only submitted marks for Panel
          const validPanelMarks = docs.filter(m => m.isSubmitted);

          if (validPanelMarks.length > 0) {
            // Average Total
            reviewData.total = calculateAverage(validPanelMarks.map(d => d.totalMarks || 0));

            // Average Components
            const componentMap = {};
            validPanelMarks.forEach(markDoc => {
              if (markDoc.componentMarks) {
                markDoc.componentMarks.forEach(comp => {
                  if (!componentMap[comp.componentName]) {
                    componentMap[comp.componentName] = [];
                  }
                  componentMap[comp.componentName].push(comp.componentTotal || comp.marks || 0);
                });
              }
            });
            Object.keys(componentMap).forEach(compName => {
              reviewData.marks[compName] = calculateAverage(componentMap[compName]);
            });
          }
        } else {
          const m = docs[0];
          reviewData.total = m.totalMarks || 0;
          if (m.componentMarks) {
            m.componentMarks.forEach(comp => {
              reviewData.marks[comp.componentName] = comp.componentTotal || comp.marks || 0;
            });
          }
        }

        totalMarks += reviewData.total;
        if (facultyType === 'guide') guideMarks += reviewData.total;
        if (facultyType === 'panel') panelMarks += reviewData.total;

        processedReviews[rName] = reviewData;

        let status = issubmitted ? "submitted" : "pending";
        // Check explicit approval from student.approvals map
        if (processedApprovals) {
          const approvalKey = Object.keys(processedApprovals).find(
            k => k.toLowerCase() === rName.toLowerCase()
          );

          if (approvalKey && processedApprovals[approvalKey]?.approved) {
            status = "approved";
            reviewData.locked = true;
          }
        }

        reviewStatuses.push({
          name: rName,
          status: status,
          marks: reviewData.marks,
          type: facultyType
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
      duplicates: [],
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
      const studentData = studentsData[i];
      let currentGuide = null;
      try {

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
          // Initialize reviews from marking schema - DEPRECATED for Reviews Map
          // But we keep object for structure if needed or just skip.
          // Since schema changed, 'reviews' field is gone.
          // We can remove it to avoid confusion or errors.

          // Initialize deadlines from marking schema
          // DEADLINE field IS also suspicious, likely removed or moved to Marks?
          // Student schema has 'approvals' but not 'deadline' map in explicit list I saw?
          // Wait, 'studentSchema.js' I viewed earlier didn't show deadline.
          // But let's assume it might still be part of some schema version.
          // I will strip the 'reviews: reviewsMap' part to be safe.

          // Create student
          const student = new Student({
            regNo: studentData.regNo,
            name: studentData.name,
            emailId: studentData.emailId,
            phoneNumber: studentData.phoneNumber || "",
            academicYear,
            school,
            program,
            // reviews: reviewsMap, // REMOVED
            // deadline: deadlineMap, // Keeping just in case but likely ignored
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
              currentGuide = faculty;
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
            }
          }

          if (!existing) {
            results.created++;
            logger.info("student_created_via_bulk", {
              regNo: studentData.regNo,
              createdBy: userId,
            });
          }
        }
      } catch (err) {
        if (err.code === 11000 || err.message.includes('E11000')) {
          results.duplicates.push({
            regNo: studentData.regNo,
            name: studentData.name,
            guideEmail: currentGuide?.emailId || "N/A",
            guideName: currentGuide?.name || "N/A",
            projectName: `Project - ${studentData.regNo}`,
            error: "Duplicate Project/Student Entry"
          });
          logger.warn("duplicate_entry_upload", { regNo: studentData.regNo, error: err.message });
        } else {
          results.errors++;
          results.details.push({
            row: i + 1,
            regNo: studentsData[i].regNo || "N/A",
            error: err.message,
          });
          logger.error("error_processing_student_row", { row: i + 1, error: err.message });
        }
      }
    }

    return results;
  }
}
