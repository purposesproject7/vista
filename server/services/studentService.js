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
   * Get filtered students list
   */
  static async getFilteredStudents(filters = {}) {
    const query = {};

    if (filters.school) query.school = filters.school;
    if (filters.department) query.department = filters.department;
    if (filters.specialization) query.specialization = filters.specialization;
    if (filters.academicYear) query.academicYear = filters.academicYear;

    const students = await Student.find(query).lean();

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
      "requiresContribution",
      "contributionType",
    ];

    const validUpdates = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        validUpdates[field] = updates[field];
      }
    }

    // Validate contribution type
    if (updates.contributionType) {
      const validTypes = [
        "none",
        "Patent Filed",
        "Journal Publication",
        "Book Chapter Contribution",
      ];

      if (!validTypes.includes(updates.contributionType)) {
        throw new Error(
          `Invalid contribution type. Must be one of: ${validTypes.join(", ")}`,
        );
      }
    }

    // If requiresContribution is false, force contributionType to 'none'
    if (updates.requiresContribution === false) {
      validUpdates.contributionType = "none";
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

    // Delete student
    await Student.findByIdAndDelete(student._id);

    // Cleanup related requests
    await Request.deleteMany({ student: student._id });

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
      guideMarks: student.guideMarks || [],
      panelMarks: student.panelMarks || [],
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
    }).lean();

    if (!schema) {
      throw new Error("Marking schema not found.");
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
      errors: 0,
      details: [],
    };

    // Get marking schema
    const markingSchema = await MarkingSchema.findOne({
      school,
      department,
    });

    if (!markingSchema) {
      throw new Error(
        "Marking schema not found for this school and department.",
      );
    }

    for (let i = 0; i < studentsData.length; i++) {
      try {
        const studentData = studentsData[i];

        // Check if student already exists
        const existing = await Student.findOne({ regNo: studentData.regNo });

        if (existing) {
          results.errors++;
          results.details.push({
            row: i + 1,
            regNo: studentData.regNo,
            error: "Student already exists.",
          });
          continue;
        }

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
          phoneNumber: studentData.phoneNumber,
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
      } catch (error) {
        results.errors++;
        results.details.push({
          row: i + 1,
          regNo: studentsData[i]?.regNo,
          error: error.message,
        });
      }
    }

    logger.info("students_uploaded", {
      created: results.created,
      errors: results.errors,
      uploadedBy: userId,
    });

    return results;
  }
}
