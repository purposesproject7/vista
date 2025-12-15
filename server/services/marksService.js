import Marks from "../models/marksSchema.js";
import Student from "../models/studentSchema.js";
import Faculty from "../models/facultySchema.js";
import {
  getFacultyTypeForProject,
  extractPrimaryContext,
} from "../utils/facultyHelpers.js";
import { logger } from "../utils/logger.js";

export class MarksService {
  /**
   * Submit marks for a student
   */
  static async submitMarks(facultyId, data) {
    const {
      student,
      project,
      reviewType,
      componentMarks,
      totalMarks,
      maxTotalMarks,
      remarks,
    } = data;

    // Determine faculty type
    const { facultyType, project: projectDoc } = await getFacultyTypeForProject(
      facultyId,
      project,
    );

    // Check for existing marks
    const existingMarks = await Marks.findOne({
      student,
      reviewType,
      faculty: facultyId,
    });

    if (existingMarks && existingMarks.isSubmitted) {
      throw new Error(
        "Marks already submitted for this review. Use update endpoint.",
      );
    }

    // Get student and faculty context
    const [studentDoc, facultyDoc] = await Promise.all([
      Student.findById(student),
      Faculty.findById(facultyId),
    ]);

    if (!studentDoc || !facultyDoc) {
      throw new Error("Student or faculty not found.");
    }

    const { school, department } = extractPrimaryContext(facultyDoc);

    // Create marks
    const marks = new Marks({
      student,
      project,
      reviewType,
      faculty: facultyId,
      facultyType,
      academicYear: studentDoc.academicYear,
      school,
      department,
      componentMarks,
      totalMarks,
      maxTotalMarks,
      remarks,
      isSubmitted: true,
      submittedAt: new Date(),
    });

    await marks.save();

    // Update student marks references
    const updateField = facultyType === "guide" ? "guideMarks" : "panelMarks";
    await Student.findByIdAndUpdate(student, {
      $push: { [updateField]: marks._id },
    });

    logger.info("marks_submitted", {
      marksId: marks._id,
      facultyId,
      studentId: student,
      projectId: project,
      reviewType,
      facultyType,
    });

    return marks;
  }

  /**
   * Update marks
   */
  static async updateMarks(marksId, facultyId, updates) {
    const marks = await Marks.findOne({
      _id: marksId,
      faculty: facultyId,
    });

    if (!marks) {
      throw new Error(
        "Marks not found or you don't have permission to update.",
      );
    }

    // Update allowed fields
    if (updates.componentMarks) marks.componentMarks = updates.componentMarks;
    if (updates.totalMarks !== undefined) marks.totalMarks = updates.totalMarks;
    if (updates.maxTotalMarks !== undefined)
      marks.maxTotalMarks = updates.maxTotalMarks;
    if (updates.remarks !== undefined) marks.remarks = updates.remarks;

    marks.isSubmitted = true;
    marks.submittedAt = new Date();

    await marks.save();

    logger.info("marks_updated", {
      marksId: marks._id,
      facultyId,
    });

    return marks;
  }

  /**
   * Get marks submitted by faculty
   */
  static async getMarksByFaculty(facultyId, filters = {}) {
    const query = { faculty: facultyId, ...filters };

    return await Marks.find(query)
      .populate("student", "name regNo emailId")
      .populate("project", "name")
      .sort({ submittedAt: -1 })
      .lean();
  }
}
