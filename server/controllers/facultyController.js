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
import MasterData from "../models/masterDataSchema.js";
import websocketService from "../services/websocketService.js";

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
 * Get master data
 */
export async function getMasterData(req, res) {
  try {
    const masterData = await MasterData.findOne();

    if (!masterData) {
      return res.status(404).json({
        success: false,
        message: "Master data not initialized.",
      });
    }

    res.status(200).json({
      success: true,
      data: masterData,
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

    const { school, program } = extractPrimaryContext(faculty);

    if (!school || !program) {
      return res.status(400).json({
        success: false,
        message: "Faculty school or program not set.",
      });
    }

    const { academicYear } = req.query;
    const query = { school, program };
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

    // Broadcast real-time update via WebSocket
    try {
      const updateData = {
        type: "mark_submitted",
        facultyId: req.user._id,
        projectId: req.body.projectId,
        studentId: req.body.studentId,
        marks: marks,
        timestamp: Date.now(),
      };

      // Broadcast to the specific faculty
      websocketService.broadcastToFaculty(
        req.user._id.toString(),
        "real_time_update",
        updateData,
      );

      logger.info("marks_websocket_broadcast", {
        facultyId: req.user._id,
        projectId: req.body.projectId,
      });
    } catch (wsError) {
      // WebSocket broadcast failed, but continue with response
      logger.warn("websocket_broadcast_failed", {
        error: wsError.message,
        facultyId: req.user._id,
      });
    }

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

    // Broadcast real-time update via WebSocket
    try {
      const updateData = {
        type: "mark_updated",
        facultyId: req.user._id,
        markId: id,
        marks: marks,
        timestamp: Date.now(),
      };

      // Broadcast to the specific faculty
      websocketService.broadcastToFaculty(
        req.user._id.toString(),
        "real_time_update",
        updateData,
      );

      logger.info("marks_update_websocket_broadcast", {
        facultyId: req.user._id,
        markId: id,
      });
    } catch (wsError) {
      logger.warn("websocket_broadcast_failed", {
        error: wsError.message,
        facultyId: req.user._id,
      });
    }

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
      school: studentDoc.school,
      program: studentDoc.program,
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
 * Get faculty reviews with filters for WebSocket
 */
export async function getFacultyReviews(req, res) {
  try {
    const facultyId = req.user._id;
    const { year, school, programme, type } = req.query;

    // Validate required filters
    if (!year || !school || !programme || !type) {
      return res.status(400).json({
        success: false,
        message: "All filters are required: year, school, programme, type",
      });
    }

    // Get faculty reviews based on filters and type
    let reviews = [];

    if (type === "guide") {
      // Get projects where faculty is the guide
      const projects = await Project.find({
        guideFaculty: facultyId,
        academicYear: year,
        school: school,
        program: programme,
      })
        .populate("students", "name regNo emailId")
        .populate("guideFaculty", "name employeeId")
        .lean();

      reviews = projects.map((project) => ({
        id: project._id,
        title: project.title,
        type: "guide",
        startDate: project.reviewDates?.guide?.startDate || new Date(),
        endDate:
          project.reviewDates?.guide?.endDate ||
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        teams: [
          {
            id: project._id,
            name: project.title,
            students: project.students,
            isMarked:
              project.students?.some((s) => s.guideMarks?.length > 0) || false,
          },
        ],
      }));
    } else if (type === "panel") {
      // Get projects where faculty is in the panel
      const panels = await Panel.find({
        "members.faculty": facultyId,
        academicYear: year,
        school: school,
        program: programme,
      })
        .populate({
          path: "projects",
          populate: {
            path: "students",
            select: "name regNo emailId",
          },
        })
        .lean();

      reviews = panels.flatMap(
        (panel) =>
          panel.projects?.map((project) => ({
            id: project._id,
            title: project.title,
            type: "panel",
            startDate: project.reviewDates?.panel?.startDate || new Date(),
            endDate:
              project.reviewDates?.panel?.endDate ||
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            teams: [
              {
                id: project._id,
                name: project.title,
                students: project.students,
                isMarked:
                  project.students?.some((s) => s.panelMarks?.length > 0) ||
                  false,
              },
            ],
          })) || [],
      );
    }

    // Add statistics
    const statistics = {
      total: reviews.length,
      active: reviews.filter(
        (r) =>
          new Date() >= new Date(r.startDate) &&
          new Date() <= new Date(r.endDate),
      ).length,
      completed: reviews.filter((r) => r.teams.every((t) => t.isMarked)).length,
      pending: reviews.filter((r) => !r.teams.every((t) => t.isMarked)).length,
    };

    res.status(200).json({
      success: true,
      data: {
        reviews,
        statistics,
        filters: { year, school, programme, type },
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    logger.error("get_faculty_reviews_error", {
      error: error.message,
      facultyId: req.user._id,
    });

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Broadcast system notification to faculty
 */
export async function broadcastNotification(req, res) {
  try {
    const { message, type, targetFaculties } = req.body;

    if (!message || !type) {
      return res.status(400).json({
        success: false,
        message: "Message and type are required",
      });
    }

    const notificationData = {
      type: "system_notification",
      message,
      notificationType: type,
      timestamp: Date.now(),
      from: "system",
    };

    if (targetFaculties && Array.isArray(targetFaculties)) {
      // Broadcast to specific faculties
      targetFaculties.forEach((facultyId) => {
        websocketService.broadcastToFaculty(
          facultyId,
          "notification",
          notificationData,
        );
      });
    } else {
      // Broadcast to all connected faculties
      websocketService.broadcastToAll("notification", notificationData);
    }

    logger.info("system_notification_broadcast", {
      type,
      targetCount: targetFaculties?.length || "all",
      from: req.user?._id || "system",
    });

    res.status(200).json({
      success: true,
      message: "Notification broadcasted successfully",
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
      "school program",
    );

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found.",
      });
    }

    const { schools, programs } = getFacultyAudience(faculty);
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
            { targetPrograms: { $size: 0 } },
            { targetPrograms: { $in: programs } },
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
