import Student from "../models/studentSchema.js";
import Project from "../models/projectSchema.js";
import { logger } from "../utils/logger.js";

export class ApprovalService {
  /**
   * Approve PPT submission
   */
  static async approvePPT(facultyId, studentId, reviewType) {
    const student = await Student.findById(studentId);

    if (!student) {
      throw new Error("Student not found.");
    }

    // Get student's project to verify guide
    const project = await Project.findOne({ students: studentId });

    if (!project || project.guideFaculty?.toString() !== facultyId.toString()) {
      throw new Error("Only the guide can approve PPT.");
    }

    // Update approvals
    if (!student.approvals) {
      student.approvals = new Map();
    }

    const approval = student.approvals.get(reviewType) || {};
    approval.ppt = {
      approved: true,
      approvedAt: new Date(),
      locked: true,
    };
    student.approvals.set(reviewType, approval);

    await student.save();

    logger.info("ppt_approved", {
      studentId,
      reviewType,
      approvedBy: facultyId,
    });

    return student;
  }

  /**
   * Approve draft submission
   */
  static async approveDraft(facultyId, studentId, reviewType) {
    const student = await Student.findById(studentId);

    if (!student) {
      throw new Error("Student not found.");
    }

    // Get student's project to verify guide
    const project = await Project.findOne({ students: studentId });

    if (!project || project.guideFaculty?.toString() !== facultyId.toString()) {
      throw new Error("Only the guide can approve draft.");
    }

    // Update approvals
    if (!student.approvals) {
      student.approvals = new Map();
    }

    const approval = student.approvals.get(reviewType) || {};
    approval.draft = {
      approved: true,
      approvedAt: new Date(),
      locked: true,
    };
    student.approvals.set(reviewType, approval);

    await student.save();

    logger.info("draft_approved", {
      studentId,
      reviewType,
      approvedBy: facultyId,
    });

    return student;
  }
}
