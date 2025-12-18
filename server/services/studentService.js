import Student from "../models/studentSchema.js";
import Project from "../models/projectSchema.js";
import Request from "../models/requestSchema.js";
import MarkingSchema from "../models/markingSchema.js";
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
    return this.processStudentData(student);
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
    if (filters.department) query.department = filters.department;
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.semester) query.semester = filters.semester;
    if (filters.regNo) query.regNo = new RegExp(filters.regNo, "i");
    if (filters.name) query.name = new RegExp(filters.name, "i");

    const students = await Student.find(query).sort({ regNo: 1 }).lean();

    return students.map((student) => this.processStudentData(student));
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
      "department",
      "PAT",
    ];

    const validUpdates = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        validUpdates[field] = updates[field];
      }
    }

    // Validate school/department change
    if (updates.school || updates.department) {
      const student = await Student.findOne({ regNo });
      if (!student) {
        throw new Error("Student not found.");
      }

      const newSchool = updates.school || student.school;
      const newDepartment = updates.department || student.department;

      const markingSchema = await MarkingSchema.findOne({
        school: newSchool,
        department: newDepartment,
      });

      if (!markingSchema) {
        throw new Error(
          `No marking schema found for school: ${newSchool}, department: ${newDepartment}`,
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
      { new: true, runValidators: true },
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
        "Cannot delete student. Student is part of an active project.",
      );
    }

    // Mark as inactive instead of hard delete
    student.isActive = false;
    await student.save();

    // Cleanup related requests
    await Request.updateMany(
      { student: student._id },
      { $set: { status: "cancelled" } },
    );

    logger.info("student_deleted", {
      regNo,
      studentId: student._id,
      deletedBy: userId,
    });

    return true;
  }

  /**
   * Process student data (convert Maps to Objects)
   */
  static processStudentData(student) {
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

    return {
      _id: student._id,
      regNo: student.regNo,
      name: student.name,
      emailId: student.emailId,
      phoneNumber: student.phoneNumber,
      school: student.school,
      department: student.department,
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
      department: student.department,
      academicYear: student.academicYear,
    }).lean();

    if (!schema) {
      throw new Error(
        "Marking schema not found for student's academic context.",
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
    department,
    userId,
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
      department,
    });

    if (!markingSchema) {
      throw new Error(
        "Marking schema not found for this school and department. Please create marking schema first.",
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
          existing.department = department;
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
            department,
            reviews: reviewsMap,
            deadline: deadlineMap,
            PAT: false,
            requiresContribution: markingSchema.requiresContribution || false,
            contributionType: markingSchema.contributionType || "none",
            isActive: true,
          });

          await student.save();
          results.created++;

          logger.info("student_created_via_bulk", {
            regNo: studentData.regNo,
            createdBy: userId,
          });
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
