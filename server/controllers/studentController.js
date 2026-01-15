import Student from "../models/studentSchema.js";
import Project from "../models/projectSchema.js";
import MarkingSchema from "../models/markingSchema.js";
import BroadcastMessage from "../models/broadcastMessageSchema.js";
import { StudentService } from "../services/studentService.js";
import { logger } from "../utils/logger.js";

/**
 * Get student profile
 */
export async function getProfile(req, res) {
  try {
    const { regNo } = req.params;

    const student = await StudentService.getStudentByRegNo(regNo);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching student profile.",
    });
  }
}

/**
 * Get student's project
 */
export async function getProject(req, res) {
  try {
    const { regNo } = req.params;

    const student = await Student.findOne({ regNo }).select("_id");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const project = await Project.findOne({ students: student._id })
      .populate("students", "name regNo emailId")
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
        message: "No project found for this student.",
      });
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching student project.",
    });
  }
}

/**
 * Get student marks
 */
export async function getMarks(req, res) {
  try {
    const { regNo } = req.params;

    const student = await Student.findOne({ regNo })
      .populate("guideMarks")
      .populate("panelMarks")
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    // Process reviews Map
    let processedReviews = {};
    if (student.reviews) {
      if (student.reviews instanceof Map) {
        processedReviews = Object.fromEntries(student.reviews);
      } else if (typeof student.reviews === "object") {
        processedReviews = { ...student.reviews };
      }
    }

    res.status(200).json({
      success: true,
      data: {
        regNo: student.regNo,
        name: student.name,
        reviews: processedReviews,
        guideMarks: student.guideMarks || [],
        panelMarks: student.panelMarks || [],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching student marks.",
    });
  }
}

/**
 * Get student approvals
 */
export async function getApprovals(req, res) {
  try {
    const { regNo } = req.params;

    const student = await Student.findOne({ regNo }).lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
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

    res.status(200).json({
      success: true,
      data: {
        regNo: student.regNo,
        name: student.name,
        approvals: processedApprovals,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching student approvals.",
    });
  }
}

/**
 * Get broadcast messages for students
 */
export async function getBroadcasts(req, res) {
  try {
    const { school, program } = req.query;

    if (!school || !program) {
      return res.status(400).json({
        success: false,
        message: "School and program are required.",
      });
    }

    const now = new Date();

    const broadcasts = await BroadcastMessage.find({
      isActive: true,
      expiresAt: { $gt: now },
      $and: [
        {
          $or: [{ targetSchools: { $size: 0 } }, { targetSchools: school }],
        },
        {
          $or: [{ targetPrograms: { $size: 0 } }, { targetPrograms: program }],
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
      message: "Error fetching broadcasts.",
    });
  }
}
