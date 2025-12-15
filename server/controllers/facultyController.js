import Faculty from "../models/facultySchema.js";
import Project from "../models/projectSchema.js";
import Panel from "../models/panelSchema.js";
import Student from "../models/studentSchema.js";
import MarkingSchema from "../models/markingSchema.js";
import BroadcastMessage from "../models/broadcastMessageSchema.js";
import Request from "../models/requestSchema.js";
import { ProjectService } from "../services/projectService.js";
import { MarksService } from "../services/marksService.js";
import { ApprovalService } from "../services/approvalService.js";
import {
  extractPrimaryContext,
  getFacultyTypeForProject,
  getFacultyAudience,
} from "../utils/facultyHelpers.js";
import { logger } from "../utils/logger.js";

/**
 * Get faculty profile
 */
export async function getProfile(req, res) {
  try {
    const faculty = await Faculty.findById(req.user._id).select("-password");

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: faculty,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Update faculty profile
 */
export async function updateProfile(req, res) {
  try {
    const updates = req.body;

    // Don't allow updating sensitive fields
    delete updates.password;
    delete updates.role;
    delete updates.employeeId;
    delete updates.emailId;

    const faculty = await Faculty.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true },
    ).select("-password");

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found.",
      });
    }

    logger.info("faculty_profile_updated", {
      facultyId: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: faculty,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Get marking schema
 */
export async function getMarkingSchema(req, res) {
  try {
    const faculty = await Faculty.findById(req.user._id);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found.",
      });
    }

    const { school, department } = extractPrimaryContext(faculty);

    if (!school || !department) {
      return res.status(400).json({
        success: false,
        message: "Faculty school or department not set.",
      });
    }

    const { academicYear } = req.query;
    const query = { school, department };
    if (academicYear) query.academicYear = academicYear;

    const schema = await MarkingSchema.findOne(query).lean();

    if (!schema) {
      return res.status(404).json({
        success: false,
        message: "No marking schema found.",
      });
    }

    res.status(200).json({
      success: true,
      data: schema,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Get assigned projects
 */
export async function getAssignedProjects(req, res) {
  try {
    const data = await ProjectService.getFacultyProjects(req.user._id);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Get project details
 */
export async function getProjectDetails(req, res) {
  try {
    const { id } = req.params;
    const facultyId = req.user._id;

    const project = await Project.findById(id)
      .populate(
        "students",
        "name regNo emailId guideMarks panelMarks approvals",
      )
      .populate("guideFaculty", "name employeeId emailId")
      .populate({
        path: "panel",
        populate: {
          path: "members.faculty",
          select: "name employeeId",
        },
      })
      .lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    // Verify access
    const isGuide =
      project.guideFaculty?._id.toString() === facultyId.toString();
    const isPanelMember = project.panel?.members?.some(
      (m) => m.faculty._id.toString() === facultyId.toString(),
    );

    if (!isGuide && !isPanelMember) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Get assigned students
 */
export async function getAssignedStudents(req, res) {
  try {
    const students = await ProjectService.getFacultyStudents(req.user._id);

    res.status(200).json({
      success: true,
      data: students,
      count: students.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Submit marks
 */
export async function submitMarks(req, res) {
  try {
    const marks = await MarksService.submitMarks(req.user._id, req.body);

    res.status(201).json({
      success: true,
      message: "Marks submitted successfully.",
      data: marks,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Update marks
 */
export async function updateMarks(req, res) {
  try {
    const { id } = req.params;
    const marks = await MarksService.updateMarks(id, req.user._id, req.body);

    res.status(200).json({
      success: true,
      message: "Marks updated successfully.",
      data: marks,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Get submitted marks
 */
export async function getSubmittedMarks(req, res) {
  try {
    const marks = await MarksService.getMarksByFaculty(req.user._id, req.query);

    res.status(200).json({
      success: true,
      data: marks,
      count: marks.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Approve PPT
 */
export async function approvePPT(req, res) {
  try {
    const { studentId, reviewType } = req.body;
    await ApprovalService.approvePPT(req.user._id, studentId, reviewType);

    res.status(200).json({
      success: true,
      message: "PPT approved successfully.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Approve draft
 */
export async function approveDraft(req, res) {
  try {
    const { studentId, reviewType } = req.body;
    await ApprovalService.approveDraft(req.user._id, studentId, reviewType);

    res.status(200).json({
      success: true,
      message: "Draft approved successfully.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Create request
 */
export async function createRequest(req, res) {
  try {
    const { student, project, reviewType, requestType, reason } = req.body;
    const facultyId = req.user._id;

    const { facultyType } = await getFacultyTypeForProject(facultyId, project);

    const [studentDoc] = await Promise.all([Student.findById(student)]);

    if (!studentDoc) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const request = new Request({
      faculty: facultyId,
      facultyType,
      student,
      project,
      academicYear: studentDoc.academicYear,
      reviewType,
      requestType,
      reason,
      status: "pending",
    });

    await request.save();

    logger.info("request_created", {
      requestId: request._id,
      facultyId,
      requestType,
    });

    res.status(201).json({
      success: true,
      message: "Request created successfully.",
      data: request,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Get assigned panels
 */
export async function getAssignedPanels(req, res) {
  try {
    const panels = await Panel.find({
      "members.faculty": req.user._id,
      isActive: true,
    })
      .populate("members.faculty", "name employeeId emailId")
      .lean();

    res.status(200).json({
      success: true,
      data: panels,
      count: panels.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Get broadcasts
 */
export async function getBroadcasts(req, res) {
  try {
    const faculty = await Faculty.findById(req.user._id).select(
      "school department",
    );

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found.",
      });
    }

    const { schools, departments } = getFacultyAudience(faculty);
    const now = new Date();

    const broadcasts = await BroadcastMessage.find({
      isActive: true,
      expiresAt: { $gt: now },
      $and: [
        {
          $or: [
            { targetSchools: { $size: 0 } },
            { targetSchools: { $in: schools } },
          ],
        },
        {
          $or: [
            { targetDepartments: { $size: 0 } },
            { targetDepartments: { $in: departments } },
          ],
        },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      data: broadcasts,
      count: broadcasts.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
