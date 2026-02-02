import Student from "../models/studentSchema.js";
import Project from "../models/projectSchema.js";
import Request from "../models/requestSchema.js";
import MarkingSchema from "../models/markingSchema.js";
import Faculty from "../models/facultySchema.js";
import { logger } from "../utils/logger.js";

export class StudentService {
  /**
   * Get student by registration number
   */
  static async getStudentByRegNo(regNo) {
    const student = await Student.findOne({ regNo }).lean();

    if (!student) {
      return null;
    }

    // Process Maps to Objects
    const processedStudent = this.processStudentData(student);

    // Find active project for this student
    const project = await Project.findOne({
      students: student._id,
      status: "active"
    })
      .populate("guideFaculty", "name")
      .populate("panel", "panelName")
      .lean();

    // Add guide and panel details
    return {
      ...processedStudent,
      guide: project?.guideFaculty?.name || "N/A",
      panelMember: project?.panel?.panelName || "N/A",
      projectTitle: project?.name || null
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
    const student = await Student.findOne({ regNo });

    if (!student) {
      throw new Error("Student not found.");
    }

    // Update reviews Map
    if (reviewsData) {
      Object.entries(reviewsData).forEach(([reviewName, reviewData]) => {
        student.reviews.set(reviewName, reviewData);
      });
    }

    await student.save();

    logger.info("student_marks_updated", {
      regNo,
      updatedReviews: Object.keys(reviewsData || {}),
      updatedBy: userId,
    });

    return this.processStudentData(student.toObject());
  }

  /**
   * Process student data (convert Maps to Objects)
   * @param {Object} student - Student document
   * @param {Map} reviewTypes - Map of reviewName -> facultyType
   */
  static processStudentData(student, reviewTypes = null) {
    // Process reviews Map
    let processedReviews = {};
    if (student.reviews) {
      if (student.reviews instanceof Map) {
        processedReviews = Object.fromEntries(student.reviews);
      } else if (typeof student.reviews === "object") {
        processedReviews = { ...student.reviews };
      }
    }

    // Process deadline Map
    let processedDeadlines = {};
    if (student.deadline) {
      if (student.deadline instanceof Map) {
        processedDeadlines = Object.fromEntries(student.deadline);
      } else if (typeof student.deadline === "object") {
        processedDeadlines = { ...student.deadline };
      }
    }

    // Process approvals Map
    let processedApprovals = {};
    if (student.approvals) {
      if (student.approvals instanceof Map) {
        processedApprovals = Object.fromEntries(student.approvals);
      } else if (typeof student.approvals === "object") {
        processedApprovals = { ...student.approvals };
      }
    }

    // Calculate Marks Breakdown
    let totalMarks = 0;
    let guideMarks = 0;
    let panelMarks = 0;
    let reviewStatuses = [];

    Object.entries(processedReviews).forEach(([key, review]) => {
      // Calculate marks for this review
      let reviewTotal = 0;
      if (review.marks) {
        Object.values(review.marks).forEach((mark) => {
          reviewTotal += Number(mark) || 0;
        });
      }
      totalMarks += reviewTotal;

      // Add to specific bucket if reviewTypes map is provided
      if (reviewTypes && reviewTypes.has(key)) {
        const type = reviewTypes.get(key);
        if (type === 'guide') {
          guideMarks += reviewTotal;
        } else if (type === 'panel') {
          panelMarks += reviewTotal;
        } else if (type === 'both') {
          // If 'both', usually separate components, but without component-level mapping
          // we can't split easily. For now, maybe 50-50? 
          // Or just add to total and leave breakdown ambiguous?
          // Let's assume 'both' counts towards total but maybe not specifically guide/panel buckets?
          // OR, assume it's shared.
          // For simplicity in this fix, we won't add to guide/panel buckets to avoid double counting
          // or we could split it. Let's start with strict mapping.
        }
      } else {
        // Fallback or legacy logic if needed
        // Without schema, we can't know.
      }

      // Review Status
      let status = "pending";
      const hasMarks = review.marks && Object.values(review.marks).some(m => m > 0);

      if (review.locked) {
        status = "approved";
      } else if (hasMarks) {
        status = "submitted";
      } else {
        status = "pending";
      }

      reviewStatuses.push({
        name: key,
        status: status
      });
    });

    return {
      _id: student._id,
      regNo: student.regNo,
      name: student.name,
      emailId: student.emailId,
      phoneNumber: student.phoneNumber,
      school: student.school,
      program: student.program,
      academicYear: student.academicYear,
      reviews: processedReviews,
      deadline: processedDeadlines,
      approvals: processedApprovals,
      PAT: student.PAT || false,
      requiresContribution: student.requiresContribution || false,
      contributionType: student.contributionType || "none",
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
