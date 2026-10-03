import Marks from "../models/marksSchema.js";
import Student from "../models/studentSchema.js";
import Faculty from "../models/facultySchema.js";
import Project from "../models/projectSchema.js";
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
      pptApproved,
      sdgGoal,
    } = data;

    // Determine faculty type
    const { facultyType, project: projectDoc } = await getFacultyTypeForProject(
      facultyId,
      project,
      reviewType
    );

    // Check for existing marks
    let existingMarks;
    if (facultyType === 'guide') {
      existingMarks = await Marks.findOne({
        student,
        project,
        reviewType,
        facultyType: 'guide',
      });
    } else {
      existingMarks = await Marks.findOne({
        student,
        project,
        reviewType,
        faculty: facultyId,
      });
    }

    if (existingMarks && existingMarks.isSubmitted && String(existingMarks.faculty) === String(facultyId)) {
      throw new Error(
        "Marks already submitted for this review. Use update endpoint."
      );
    }

    // Get student and faculty context
    const [studentDoc, facultyDoc, projectDocFull] = await Promise.all([
      Student.findById(student),
      Faculty.findById(facultyId),
      Project.findById(project)
    ]);

    if (!studentDoc || !facultyDoc || !projectDocFull) {
      throw new Error("Student, Faculty, or Project not found.");
    }

    // --- PPT Approval Check (Panel Only) ---
    if (facultyType === 'panel') {
      const pptApproval = projectDocFull.pptApprovals?.find(p => p.reviewType === reviewType);
      if (!pptApproval || !pptApproval.isApproved) {
        throw new Error(`PPT Approval Pending. Guide must approve the PPT before panel can enter marks.`);
      }
    }

    let { school, program } = extractPrimaryContext(facultyDoc);

    // Fallback to student context if faculty context is missing
    if (!school) school = studentDoc.school;
    if (!program) program = studentDoc.program;

    // if (!school || !program) {
    //   throw new Error(`Faculty profile incomplete: School or Program missing. (School: ${school}, Program: ${program})`);
    // }

    if (!studentDoc.academicYear) {
      throw new Error("Student profile incomplete: Academic Year missing.");
    }

    // Create or update marks
    let marks;
    if (existingMarks) {
      marks = existingMarks;
      marks.faculty = facultyId;
      marks.school = school;
      marks.program = program;
      marks.componentMarks = componentMarks;
      marks.totalMarks = totalMarks;
      marks.maxTotalMarks = maxTotalMarks;
      marks.remarks = remarks;
      marks.isSubmitted = true;
      marks.submittedAt = new Date();
    } else {
      marks = new Marks({
        student,
        project,
        reviewType,
        faculty: facultyId,
        facultyType,
        academicYear: studentDoc.academicYear,
        school,
        program,
        componentMarks,
        totalMarks,
        maxTotalMarks,
        remarks,
        isSubmitted: true,
        submittedAt: new Date(),
      });
    }

    try {
      await marks.save();
    } catch (err) {
      // Handle race condition where multiple requests are sent concurrently (e.g. frontend double click)
      if (err.message && (err.message.includes('Guide has already submitted marks') || err.code === 11000)) {
        const query = facultyType === 'guide' 
          ? { student, project, reviewType, facultyType: 'guide' }
          : { student, project, reviewType, faculty: facultyId };
        const existing = await Marks.findOne(query);
        if (existing && String(existing.faculty) === String(facultyId)) {
          // If the exact same mark was already saved by us concurrently, treat as success.
          logger.info("Race condition: duplicate marks submission ignored.", { student, project, facultyId });
          // Note: we don't update PAT or PPT approvals again since the concurrent request already did.
          return existing;
        }
      }
      throw err;
    }

    // Update student marks references and check PAT
    const updateField = facultyType === "guide" ? "guideMarks" : "panelMarks";
    
    const hasPat = await Marks.exists({ student, remarks: /\[PAT\]/i });

    await Student.findByIdAndUpdate(student, {
      $push: { [updateField]: marks._id },
      PAT: !!hasPat
    });

    // If guide is submitting, update PPT approval and SDG goal
    if (facultyType === 'guide') {
      let projectUpdated = false;
      if (pptApproved) {
        const existingApprovalIndex = projectDocFull.pptApprovals.findIndex(
          (a) => a.reviewType === reviewType
        );

        if (existingApprovalIndex > -1) {
          projectDocFull.pptApprovals[existingApprovalIndex].isApproved = true;
          projectDocFull.pptApprovals[existingApprovalIndex].approvedBy = facultyId;
          projectDocFull.pptApprovals[existingApprovalIndex].approvedAt = new Date();
        } else {
          projectDocFull.pptApprovals.push({
            reviewType: reviewType,
            isApproved: true,
            approvedBy: facultyId,
            approvedAt: new Date(),
          });
        }
        projectUpdated = true;
      }
      if (sdgGoal) {
        projectDocFull.sdgGoal = sdgGoal;
        projectUpdated = true;
      }
      if (projectUpdated) {
        await projectDocFull.save();
      }
    }

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
        "Marks not found or you don't have permission to update."
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

    // Recheck PAT global status for this student
    const hasPat = await Marks.exists({ student: marks.student, remarks: /\[PAT\]/i });
    await Student.findByIdAndUpdate(marks.student, { PAT: !!hasPat });

    // Update Project PPT approval and SDG goal if provided by guide
    if (marks.facultyType === 'guide' && (updates.pptApproved || updates.sdgGoal)) {
      const projectDoc = await Project.findById(marks.project);
      if (projectDoc) {
        let projectUpdated = false;
        if (updates.pptApproved) {
          const existingApprovalIndex = projectDoc.pptApprovals.findIndex(
            (a) => a.reviewType === marks.reviewType
          );

          if (existingApprovalIndex > -1) {
            projectDoc.pptApprovals[existingApprovalIndex].isApproved = true;
            projectDoc.pptApprovals[existingApprovalIndex].approvedBy = facultyId;
            projectDoc.pptApprovals[existingApprovalIndex].approvedAt = new Date();
          } else {
            projectDoc.pptApprovals.push({
              reviewType: marks.reviewType,
              isApproved: true,
              approvedBy: facultyId,
              approvedAt: new Date(),
            });
          }
          projectUpdated = true;
        }
        if (updates.sdgGoal) {
          projectDoc.sdgGoal = updates.sdgGoal;
          projectUpdated = true;
        }
        if (projectUpdated) {
          await projectDoc.save();
        }
      }
    }

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
    const query = { faculty: facultyId };

    // Sanitize filters
    if (filters.student) query.student = filters.student;
    if (filters.project) query.project = filters.project;
    if (filters.reviewType) query.reviewType = filters.reviewType;
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.school) query.school = filters.school;
    if (filters.program) query.program = filters.program;
    if (filters.isSubmitted !== undefined) query.isSubmitted = filters.isSubmitted;

    return await Marks.find(query)
      .populate("student", "name regNo emailId")
      .populate("project", "name")
      .sort({ submittedAt: -1 })
      .lean();
  }
}
