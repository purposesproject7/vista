import mongoose from "mongoose";
import Project from "../models/projectSchema.js";
import Panel from "../models/panelSchema.js";
import Student from "../models/studentSchema.js";
import Faculty from "../models/facultySchema.js";
import ProjectCoordinator from "../models/projectCoordinatorSchema.js";
import ComponentLibrary from "../models/componentLibrarySchema.js";
import MarkingSchema from "../models/markingSchema.js";
import Marks from "../models/marksSchema.js";
import ProgramConfig from "../models/programConfigSchema.js";
import { logger } from "../utils/logger.js";
import MasterData from "../models/masterDataSchema.js";
import { FacultyService } from "../services/facultyService.js";
import { PanelService } from "../services/panelService.js";
import { StudentService } from "../services/studentService.js";
import { ProjectService } from "../services/projectService.js";
import { MarkingSchemaService } from "../services/markingSchemaService.js";
import { BroadcastService } from "../services/broadcastService.js";
import { RequestService } from "../services/requestService.js";
import { AccessRequestService } from "../services/accessRequestService.js";

// Faculty Management
export async function createFaculty(req, res) {
  try {
    const faculty = await FacultyService.createFaculty(req.body, req.user._id);

    res.status(201).json({
      success: true,
      message: "Faculty created successfully.",
      data: { _id: faculty._id, employeeId: faculty.employeeId },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getAllFaculty(req, res) {
  try {
    const faculties = await FacultyService.getFacultyList(req.query, {
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    });

    res.status(200).json({
      success: true,
      data: faculties,
      count: faculties.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function updateFaculty(req, res) {
  try {
    const { employeeId } = req.params;
    const faculty = await FacultyService.updateFaculty(
      employeeId,
      req.body,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: "Faculty updated successfully.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function deleteFaculty(req, res) {
  try {
    const { employeeId } = req.params;
    await FacultyService.deleteFaculty(employeeId, req.user._id);

    res.status(200).json({
      success: true,
      message: "Faculty deleted successfully.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// Panel Management (similar pattern)
export async function createPanelManually(req, res) {
  try {
    const panel = await PanelService.createPanel(req.body, req.user._id);

    res.status(201).json({
      success: true,
      message: "Panel created successfully.",
      data: panel,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getAllPanels(req, res) {
  try {
    const panels = await PanelService.getPanelList(req.query);

    res.status(200).json({
      success: true,
      data: panels,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// ===== MARKING SCHEMA =====

export async function getMarkingSchema(req, res) {
  try {
    const { academicYear, school, program } = req.query;
    const schema = await MarkingSchemaService.getMarkingSchema(
      academicYear,
      school,
      program
    );

    res.status(200).json({
      success: true,
      data: schema,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
}

export async function createOrUpdateMarkingSchema(req, res) {
  try {
    const schema = await MarkingSchemaService.createOrUpdateMarkingSchema(
      req.body,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: "Marking schema saved successfully.",
      data: schema,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function updateMarkingSchema(req, res) {
  try {
    const { id } = req.params;
    const schema = await MarkingSchema.findById(id);

    if (!schema) {
      return res.status(404).json({
        success: false,
        message: "Marking schema not found.",
      });
    }

    Object.assign(schema, req.body);
    await schema.save();

    logger.info("marking_schema_updated", {
      schemaId: id,
      updatedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Marking schema updated successfully.",
      data: schema,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// ===== FACULTY BULK & ADMIN CREATION =====

export async function createFacultyBulk(req, res) {
  try {
    const { facultyList } = req.body;

    if (!Array.isArray(facultyList) || facultyList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Faculty list must be a non-empty array.",
      });
    }

    const results = {
      created: 0,
      errors: 0,
      details: [],
    };

    for (let i = 0; i < facultyList.length; i++) {
      try {
        await FacultyService.createFaculty(facultyList[i], req.user._id);
        results.created++;
      } catch (error) {
        results.errors++;
        results.details.push({
          row: i + 1,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk creation complete: ${results.created} created, ${results.errors} errors.`,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function createAdmin(req, res) {
  try {
    const adminData = {
      ...req.body,
      role: "admin",
      specialization: [],
    };

    const admin = await FacultyService.createFaculty(adminData, req.user._id);

    res.status(201).json({
      success: true,
      message: "Admin created successfully.",
      data: { _id: admin._id, employeeId: admin.employeeId },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getFacultyDetailsBulk(req, res) {
  try {
    const { employeeIds } = req.body;

    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "employeeIds array is required",
      });
    }

    const faculty = await Faculty.find({
      employeeId: { $in: employeeIds },
      role: "faculty",
    }).select("name employeeId emailId school program specialization");

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

// ===== PANEL AUTO FUNCTIONS =====

export async function autoCreatePanels(req, res) {
  try {
    const { programs, school, academicYear, panelSize, facultyList } = req.body;

    const allResults = {
      created: 0,
      errors: 0,
      details: [],
    };

    // Iterate over each program and auto-create panels
    for (const program of programs) {
      const result = await PanelService.autoCreatePanels(
        academicYear,
        school,
        program,
        panelSize || 2,
        req.user._id,
        facultyList
      );

      allResults.created += result.panelsCreated || 0;
      allResults.errors += result.errors || 0;
      if (result.details) {
        allResults.details.push(...result.details);
      }
    }

    res.status(200).json({
      success: true,
      message: `Auto-creation complete: ${allResults.created} panels created, ${allResults.errors} errors.`,
      data: allResults,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function bulkCreatePanels(req, res) {
  try {
    const { panels } = req.body;

    if (!Array.isArray(panels) || panels.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Panels array is required and cannot be empty.",
      });
    }

    const results = {
      created: 0,
      errors: 0,
      details: [],
    };

    for (let i = 0; i < panels.length; i++) {
      try {
        const panelData = {
          ...panels[i],
          memberEmployeeIds:
            panels[i].memberEmployeeIds || panels[i].facultyEmployeeIds,
        };
        await PanelService.createPanel(panelData, req.user._id);
        results.created++;
      } catch (error) {
        results.errors++;
        results.details.push({
          index: i,
          panelName: panels[i].panelName,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk creation complete: ${results.created} created, ${results.errors} errors.`,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getPanelSummary(req, res) {
  try {
    const { academicYear, school, program } = req.query;

    // Get all panels
    const panels = await Panel.find({
      academicYear,
      school,
      program,
      isActive: true,
    }).populate("members.faculty", "name employeeId");

    // Get project counts
    const totalProjects = await Project.countDocuments({
      academicYear,
      school,
      program,
    });

    const assignedProjects = await Project.countDocuments({
      academicYear,
      school,
      program,
      panel: { $ne: null },
    });

    const totalPanels = panels.length;

    // Calculate unique faculty involved in panels
    const facultySet = new Set();
    panels.forEach((p) => {
      p.members.forEach((m) => {
        if (m.faculty) facultySet.add(m.faculty._id.toString());
      });
    });

    const avgFacultyPerPanel =
      totalPanels > 0
        ? (
          panels.reduce((sum, p) => sum + p.members.length, 0) / totalPanels
        ).toFixed(1)
        : 0;

    const avgProjectsPerPanel =
      totalPanels > 0 ? (assignedProjects / totalPanels).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalPanels,
        totalFaculty: facultySet.size,
        totalProjects,
        assignedProjects,
        avgFacultyPerPanel,
        avgProjectsPerPanel,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function autoAssignPanelsToProjects(req, res) {
  try {
    const { academicYear, school, program } = req.body;

    const results = await PanelService.autoAssignPanels(
      academicYear,
      school,
      program,
      0, // buffer
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: `Auto-assignment complete: ${results.projectsAssigned} projects assigned, ${results.errors} errors.`,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function deletePanel(req, res) {
  try {
    const { id } = req.params;
    await PanelService.deletePanel(id, req.user._id);

    res.status(200).json({
      success: true,
      message: "Panel deleted successfully.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// ===== REQUESTS =====

export async function getAllRequests(req, res) {
  try {
    const requests = await RequestService.getAllRequests(req.query);

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function updateRequestStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, remarks, newDeadline } = req.body;

    const request = await RequestService.updateRequestStatus(
      id,
      status,
      req.user._id,
      { remarks, newDeadline }
    );

    res.status(200).json({
      success: true,
      message: `Request ${status} successfully.`,
      data: request,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// ===== ACCESS REQUESTS (Project Coordinators) =====

export async function getAllAccessRequests(req, res) {
  try {
    const requests = await AccessRequestService.getAllAccessRequests(req.query);

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function updateAccessRequestStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, reason, grantStartTime, grantEndTime } = req.body;

    const request = await AccessRequestService.updateAccessRequestStatus(
      id,
      status,
      req.user._id,
      { reason, grantStartTime, grantEndTime }
    );

    // If approved, automatically enable the permission for the coordinator
    if (status === "approved" && request) {
      const coordinator = await ProjectCoordinator.findOne({
        faculty: request.requestedBy,
        school: request.school,
        program: request.program,
        isActive: true,
      });

      if (coordinator) {
        // Ensure the permissions object for this feature exists
        const currentPerms = coordinator.permissions[request.featureName] || {};

        // Calculate new deadline:
        // 1. Use provided grantEndTime if available
        // 2. Else use existing deadline IF it is in the future
        // 3. Else default to 7 days from now
        let newDeadline = grantEndTime ? new Date(grantEndTime) : null;

        if (!newDeadline) {
          const currentDeadline = currentPerms.deadline ? new Date(currentPerms.deadline) : null;
          if (currentDeadline && currentDeadline > new Date()) {
            newDeadline = currentDeadline;
          } else {
            newDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          }
        }

        coordinator.permissions[request.featureName] = {
          enabled: true,
          deadline: newDeadline,
        };

        // Mark modified since permissions is a nested object/mixed type sometimes
        coordinator.markModified("permissions");
        await coordinator.save();

        logger.info("coordinator_permission_auto_enabled", {
          coordinatorId: coordinator._id,
          feature: request.featureName,
          deadline: grantEndTime,
        });
      } else {
        logger.warn("coordinator_not_found_for_request_approval", {
          facultyId: request.requestedBy,
          requestId: id,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Access request ${status} successfully.`,
      data: request,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// ===== BROADCASTS =====

export async function getBroadcastMessages(req, res) {
  try {
    const broadcasts = await BroadcastService.getBroadcasts(req.query);

    res.status(200).json({
      success: true,
      data: broadcasts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function createBroadcastMessage(req, res) {
  try {
    const broadcast = await BroadcastService.createBroadcast(
      req.body,
      req.user
    );

    res.status(201).json({
      success: true,
      message: "Broadcast created successfully.",
      data: broadcast,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function updateBroadcastMessage(req, res) {
  try {
    const { id } = req.params;
    const broadcast = await BroadcastService.updateBroadcast(
      id,
      req.body,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: "Broadcast updated successfully.",
      data: broadcast,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function deleteBroadcastMessage(req, res) {
  try {
    const { id } = req.params;
    await BroadcastService.deleteBroadcast(id, req.user._id);

    res.status(200).json({
      success: true,
      message: "Broadcast deleted successfully.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// ===== PROJECT REPORTS =====

export async function getAllProjects(req, res) {
  try {
    const projects = await ProjectService.getProjectList(req.query);

    res.status(200).json({
      success: true,
      data: projects,
      count: projects.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getAllGuideWithProjects(req, res) {
  try {
    const data = await ProjectService.getGuideProjects(req.query);

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

export async function getAllPanelsWithProjects(req, res) {
  try {
    const data = await ProjectService.getPanelProjects(req.query);

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

export async function markAsBestProject(req, res) {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    project.bestProject = !project.bestProject;
    await project.save();

    logger.info("project_marked_best", {
      projectId: id,
      bestProject: project.bestProject,
      updatedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: `Project ${project.bestProject ? "marked" : "unmarked"
        } as best project.`,
      data: { bestProject: project.bestProject },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Create project (admin)
 */
export async function createProject(req, res) {
  try {
    const {
      name,
      students,
      guideFacultyEmpId,
      school,
      program,
      academicYear,
      type,
      specialization,
      description,
    } = req.body;

    const projectData = {
      name,
      students, // Service expects students array
      guideFacultyEmpId, // Service expects guideFacultyEmpId
      school,
      program,
      academicYear,
      type,
      specialization,
      description,
    };

    const project = await ProjectService.createProject(
      projectData,
      req.user._id
    );

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Bulk create projects (admin)
 */
export async function bulkCreateProjects(req, res) {
  try {
    const { projects } = req.body;

    if (!Array.isArray(projects) || projects.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Projects array is required and cannot be empty",
      });
    }

    // Transform to match service expectation if needed, or pass as is
    // Assuming service expects array of project objects with same structure as createProject
    const result = await ProjectService.bulkCreateProjects(
      projects,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: `Bulk creation completed. Created: ${result.created}, Errors: ${result.errors.length}`,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// ===== STUDENT MANAGEMENT =====

/**
 * Get all students (admin)
 */
export async function getAllStudents(req, res) {
  try {
    const filters = {
      academicYear: req.query.academicYear,
      school: req.query.school,
      program: req.query.program,
      specialization: req.query.specialization,
      regNo: req.query.regNo,
      name: req.query.name,
    };

    const students = await StudentService.getStudentList(filters);

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Get student by registration number (admin)
 */
export async function getStudentByRegNo(req, res) {
  try {
    const student = await StudentService.getStudentByRegNo(req.params.regNo);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Create individual student (admin)
 */
export async function createStudent(req, res) {
  try {
    const { regNo, name, emailId, phoneNumber, guideEmpId, school, program, academicYear } =
      req.body;

    // Check if student already exists
    const existing = await StudentService.getStudentByRegNo(regNo);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Student with registration number ${regNo} already exists`,
      });
    }

    // Use bulk upload with single student
    const result = await StudentService.uploadStudents(
      [{ regNo, name, emailId, phoneNumber, guideEmpId }],
      academicYear,
      school,
      program,
      req.user._id
    );

    if (result.created === 1) {
      const student = await StudentService.getStudentByRegNo(regNo);

      res.status(201).json({
        success: true,
        message: "Student created successfully",
        data: student,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.details[0]?.error || "Failed to create student",
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Bulk upload students (admin)
 */
export async function bulkUploadStudents(req, res) {
  try {
    const { students, academicYear, school, program } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: "students array is required and cannot be empty",
      });
    }

    const result = await StudentService.uploadStudents(
      students,
      academicYear,
      school,
      program,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: `Bulk upload completed. Created: ${result.created}, Updated: ${result.updated}, Errors: ${result.errors}`,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Update student (admin)
 */
export async function updateStudent(req, res) {
  try {
    const student = await StudentService.updateStudent(
      req.params.regNo,
      req.body,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: student,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Delete student (admin)
 */
export async function deleteStudent(req, res) {
  try {
    await StudentService.deleteStudent(req.params.regNo, req.user._id);

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// ===== PROJECT COORDINATOR MANAGEMENT =====
// (Add these based on your ProjectCoordinator schema requirements)

export async function getProjectCoordinators(req, res) {
  try {
    const { academicYear, school, program } = req.query;

    const coordinators = await ProjectCoordinator.find({
      academicYear,
      school,
      program,
      isActive: true,
    })
      .populate("faculty", "name employeeId emailId")
      .lean();

    res.status(200).json({
      success: true,
      data: coordinators,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function assignProjectCoordinator(req, res) {
  try {
    const { facultyId, academicYear, school, program, isPrimary, permissions } =
      req.body;

    // Verify faculty exists
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    // Check if already exists
    const existing = await ProjectCoordinator.findOne({
      faculty: facultyId,
      academicYear,
      school,
      program,
      isActive: true,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          "This faculty is already a project coordinator for this context.",
      });
    }

    // Fetch global deadlines
    const programConfig = await ProgramConfig.findOne({
      academicYear,
      school,
      program,
    });

    if (!programConfig) {
      return res.status(404).json({
        success: false,
        message: "Program configuration not found. Please create it first.",
      });
    }

    // Build deadline mapping
    const globalDeadlines = {};
    if (programConfig.featureLocks) {
      programConfig.featureLocks.forEach((lock) => {
        globalDeadlines[lock.featureName] = lock.deadline;
      });
    }

    // Default permissions with global deadlines
    const defaultPermissions = {
      student_management: {
        enabled: true,
        deadline: globalDeadlines.student_management,
      },
      faculty_management: {
        enabled: true,
        deadline: globalDeadlines.faculty_management,
      },
      project_management: {
        enabled: true,
        deadline: globalDeadlines.project_management,
      },
      panel_management: {
        enabled: true,
        deadline: globalDeadlines.panel_management,
      },
    };

    // Override defaults with provided permissions if any
    const finalPermissions = permissions
      ? { ...defaultPermissions, ...permissions }
      : defaultPermissions;

    // If primary, unset others
    if (isPrimary) {
      await ProjectCoordinator.updateMany(
        { academicYear, school, program, isPrimary: true },
        { $set: { isPrimary: false } }
      );
    }

    // Create coordinator assignment
    const coordinator = new ProjectCoordinator({
      faculty: facultyId,
      academicYear,
      school,
      program,
      isPrimary: isPrimary || false,
      permissions: finalPermissions,
      isActive: true,
    });

    await coordinator.save();

    // Set flag on faculty
    faculty.isProjectCoordinator = true;
    await faculty.save();

    // Populate response
    await coordinator.populate("faculty", "name emailId employeeId");

    logger.info("project_coordinator_assigned", {
      coordinatorId: coordinator._id,
      facultyId,
      academicYear,
      school,
      program,
      isPrimary,
      assignedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Project coordinator assigned successfully.",
      data: coordinator,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Helper: Merge permissions
function mergePermissions(defaultPerms, customPerms) {
  const merged = { ...defaultPerms };

  for (const [key, value] of Object.entries(customPerms)) {
    if (merged[key]) {
      merged[key] = {
        enabled:
          value.enabled !== undefined ? value.enabled : merged[key].enabled,
        deadline:
          value.deadline !== undefined ? value.deadline : merged[key].deadline,
      };
    }
  }

  return merged;
}

export async function updateProjectCoordinator(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const coordinator = await ProjectCoordinator.findById(id);
    if (!coordinator) {
      return res.status(404).json({
        success: false,
        message: "Project coordinator not found.",
      });
    }

    // If changing to primary, unset others
    if (updates.isPrimary === true && !coordinator.isPrimary) {
      await ProjectCoordinator.updateMany(
        {
          academicYear: coordinator.academicYear,
          school: coordinator.school,
          program: coordinator.program,
          isPrimary: true,
          _id: { $ne: id },
        },
        { $set: { isPrimary: false } }
      );
    }

    Object.assign(coordinator, updates);
    await coordinator.save();

    logger.info("project_coordinator_updated", {
      coordinatorId: id,
      updatedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Project coordinator updated successfully.",
      data: coordinator,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function updateCoordinatorPermissions(req, res) {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    const coordinator = await ProjectCoordinator.findById(id);
    if (!coordinator) {
      return res.status(404).json({
        success: false,
        message: "Project coordinator not found.",
      });
    }

    coordinator.permissions = { ...coordinator.permissions, ...permissions };
    await coordinator.save();

    logger.info("coordinator_permissions_updated", {
      coordinatorId: id,
      updatedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Permissions updated successfully.",
      data: coordinator,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function removeProjectCoordinator(req, res) {
  try {
    const { id } = req.params;

    const coordinator = await ProjectCoordinator.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!coordinator) {
      return res.status(404).json({
        success: false,
        message: "Project coordinator not found.",
      });
    }

    logger.info("project_coordinator_removed", {
      coordinatorId: id,
      removedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Project coordinator removed successfully.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// ===== COMPONENT LIBRARY ===== (Referenced in routes but not implemented)
export async function getComponentLibrary(req, res) {
  try {
    const { academicYear, school, program } = req.query;

    const library = await ComponentLibrary.findOne({
      academicYear,
      school,
      program,
    }).lean();

    if (!library) {
      return res.status(404).json({
        success: false,
        message: "Component library not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: library,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function createComponentLibrary(req, res) {
  try {
    const { academicYear, school, program, components } = req.body;

    const existing = await ComponentLibrary.findOne({
      academicYear,
      school,
      program,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Component library already exists for this context.",
      });
    }

    const library = new ComponentLibrary({
      academicYear,
      school,
      program,
      components,
    });

    await library.save();

    logger.info("component_library_created", {
      libraryId: library._id,
      academicYear,
      school,
      program,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Component library created successfully.",
      data: library,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function updateComponentLibrary(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const library = await ComponentLibrary.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!library) {
      return res.status(404).json({
        success: false,
        message: "Component library not found.",
      });
    }

    logger.info("component_library_updated", {
      libraryId: id,
      updatedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Component library updated successfully.",
      data: library,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// ===== REPORTS ===== (Referenced in routes but not implemented)
export async function getOverviewReport(req, res) {
  try {
    const { academicYear, school, program } = req.query;

    const [
      totalProjects,
      activeProjects,
      totalStudents,
      totalFaculty,
      totalPanels,
      completedProjects,
    ] = await Promise.all([
      Project.countDocuments({ academicYear, school, program }),
      Project.countDocuments({
        academicYear,
        school,
        program,
        status: "active",
      }),
      Student.countDocuments({
        academicYear,
        school,
        program,
        isActive: true,
      }),
      Faculty.countDocuments({
        school: { $in: [school] },
        program: { $in: [program] },
      }),
      Panel.countDocuments({
        academicYear,
        school,
        program,
        isActive: true,
      }),
      Project.countDocuments({
        academicYear,
        school,
        program,
        status: "completed",
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        projects: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects,
        },
        students: totalStudents,
        faculty: totalFaculty,
        panels: totalPanels,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getProjectsReport(req, res) {
  try {
    const { academicYear, school, program } = req.query;

    const projects = await Project.find({ academicYear, school, program })
      .populate("students", "regNo name emailId")
      .populate("guideFaculty", "name employeeId emailId")
      .populate("panel", "panelName venue")
      .populate({
        path: "students",
        populate: [
          { path: "guideMarks", select: "reviewType totalMarks isSubmitted" },
          { path: "panelMarks", select: "reviewType totalMarks isSubmitted" },
        ],
      })
      .lean();

    res.status(200).json({
      success: true,
      data: projects,
      count: projects.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getMarksReport(req, res) {
  try {
    const { academicYear, school, program, reviewType, projectId } = req.query;

    const query = { academicYear, school, program };
    if (reviewType) query.reviewType = reviewType;
    if (projectId) query.project = projectId;

    console.log("getMarksReport - Query params:", req.query);
    console.log("getMarksReport - Constructed Query:", query);

    // Debug: Check if marks exist for this project without other filters
    if (projectId) {
      const allProjectMarks = await Marks.countDocuments({ project: projectId });
      console.log(`Debug: Total marks for project ${projectId} (ignoring other filters): ${allProjectMarks}`);
    }

    const marks = await Marks.find(query)
      .populate("student", "regNo name")
      .populate("faculty", "name employeeId")
      .populate("project", "name")
      .sort({ student: 1, reviewType: 1 })
      .lean();

    // Group by student
    const byStudent = {};
    marks.forEach((mark) => {
      const studentId = mark.student._id.toString();
      if (!byStudent[studentId]) {
        byStudent[studentId] = {
          student: mark.student,
          project: mark.project,
          marks: [],
        };
      }
      byStudent[studentId].marks.push({
        reviewType: mark.reviewType,
        facultyType: mark.facultyType,
        faculty: mark.faculty,
        totalMarks: mark.totalMarks,
        maxTotalMarks: mark.maxTotalMarks,
        isSubmitted: mark.isSubmitted,
      });
    });

    res.status(200).json({
      success: true,
      data: Object.values(byStudent),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getFacultyWorkloadReport(req, res) {
  try {
    const { academicYear, school, program } = req.query;

    const faculties = await Faculty.find({
      school: { $in: [school] },
      program: { $in: [program] },
      role: "faculty",
    })
      .select("name employeeId emailId")
      .lean();

    const workload = await Promise.all(
      faculties.map(async (faculty) => {
        const [guidedProjects, panelMemberships, marksSubmitted, marksPending] =
          await Promise.all([
            Project.countDocuments({ academicYear, guideFaculty: faculty._id }),
            Panel.countDocuments({
              academicYear,
              "members.faculty": faculty._id,
              isActive: true,
            }),
            Marks.countDocuments({
              academicYear,
              faculty: faculty._id,
              isSubmitted: true,
            }),
            Marks.countDocuments({
              academicYear,
              faculty: faculty._id,
              isSubmitted: false,
            }),
          ]);

        return {
          faculty,
          guidedProjects,
          panelMemberships,
          marks: {
            submitted: marksSubmitted,
            pending: marksPending,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      data: workload,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getStudentPerformanceReport(req, res) {
  try {
    const { academicYear, school, program } = req.query;

    const students = await Student.find({
      academicYear,
      school,
      program,
      isActive: true,
    })
      .populate("guideMarks")
      .populate("panelMarks")
      .lean();

    const performance = students.map((student) => {
      const allMarks = [
        ...(student.guideMarks || []),
        ...(student.panelMarks || []),
      ];

      const totalMarks = allMarks.reduce(
        (sum, m) => sum + (m.totalMarks || 0),
        0
      );
      const maxMarks = allMarks.reduce(
        (sum, m) => sum + (m.maxTotalMarks || 0),
        0
      );
      const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;

      const submittedCount = allMarks.filter((m) => m.isSubmitted).length;
      const totalCount = allMarks.length;

      return {
        student: {
          _id: student._id,
          regNo: student.regNo,
          name: student.name,
          emailId: student.emailId,
        },
        totalMarks,
        maxMarks,
        percentage: percentage.toFixed(2),
        marksProgress: `${submittedCount}/${totalCount}`,
      };
    });

    res.status(200).json({
      success: true,
      data: performance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// ===== PANEL ASSIGNMENT ===== (Already have assignPanelToProject, but need wrapper)
export async function assignPanelToProject(req, res) {
  try {
    const { panelId, projectId, ignoreSpecialization } = req.body;

    // Fetch project and panel to validate specialization
    const [project, panel] = await Promise.all([
      Project.findById(projectId),
      Panel.findById(panelId),
    ]);

    if (!project) throw new Error("Project not found.");
    if (!panel) throw new Error("Panel not found.");

    // Validate specialization match
    if (
      panel.specializations &&
      panel.specializations.length > 0 &&
      !panel.specializations.includes(project.specialization) &&
      !ignoreSpecialization
    ) {
      return res.status(400).json({
        success: false,
        message: `Specialization mismatch blocked. Panel specializes in [${panel.specializations.join(
          ", "
        )}], but project requires ${project.specialization}.`,
      });
    }

    const result = await PanelService.assignPanelToProject(
      panelId,
      projectId,
      req.user._id,
      ignoreSpecialization // Pass as skipValidation
    );

    res.status(200).json({
      success: true,
      message: "Panel assigned to project successfully.",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// ===== UPDATE PANEL ===== (Missing wrapper)
export async function updatePanel(req, res) {
  try {
    const { id } = req.params;

    const panel = await PanelService.updatePanel(id, req.body, req.user._id);

    res.status(200).json({
      success: true,
      message: "Panel updated successfully.",
      data: panel,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// ===== MASTER DATA =====

/**
 * Bulk create master data (schools, departments, academic years)
 */
export async function createMasterDataBulk(req, res) {
  try {
    const { schools, programs, academicYears } = req.body;

    const masterData = await getOrCreateMasterData();

    const results = {
      schools: { created: 0, skipped: 0, errors: [] },
      programs: { created: 0, skipped: 0, errors: [] },
      academicYears: { created: 0, skipped: 0, errors: [] },
    };

    // Process schools
    if (Array.isArray(schools)) {
      for (const school of schools) {
        try {
          const exists = masterData.schools.find(
            (s) => s.code === school.code || s.name === school.name
          );

          if (exists) {
            results.schools.skipped++;
            logger.warn("school_skipped_duplicate", {
              name: school.name,
              code: school.code,
            });
          } else {
            masterData.schools.push({
              name: school.name,
              code: school.code,
            });
            results.schools.created++;
          }
        } catch (error) {
          results.schools.errors.push({
            school: school.name,
            error: error.message,
          });
        }
      }
    }

    // Process programs (supports 'programs' or legacy 'departments' input)
    const programsInput = req.body.programs;

    if (Array.isArray(programsInput)) {
      for (const prog of programsInput) {
        try {
          // Verify school exists
          const schoolExists = masterData.schools.find(
            (s) => s.code === prog.school
          );

          if (!schoolExists) {
            results.programs.errors.push({
              program: prog.name,
              error: `School '${prog.school}' not found`,
            });
            continue;
          }

          const exists = masterData.programs.find(
            (p) =>
              (p.code === prog.code || p.name === prog.name) &&
              p.school === prog.school
          );

          if (exists) {
            results.programs.skipped++;
            logger.warn("program_skipped_duplicate", {
              name: prog.name,
              code: prog.code,
              school: prog.school,
            });
          } else {
            masterData.programs.push({
              name: prog.name,
              code: prog.code,
              school: prog.school,
              specializations: prog.specializations || [],
            });
            results.programs.created++;
          }
        } catch (error) {
          results.programs.errors.push({
            program: prog.name,
            error: error.message,
          });
        }
      }
    }

    // Process academic years
    if (Array.isArray(academicYears)) {
      for (const ay of academicYears) {
        try {
          const exists = masterData.academicYears.find(
            (year) => year.year === ay.year
          );

          if (exists) {
            results.academicYears.skipped++;
            logger.warn("academic_year_skipped_duplicate", {
              year: ay.year,
            });
          } else {
            masterData.academicYears.push({
              year: ay.year,
              isActive: ay.isActive !== undefined ? ay.isActive : true,
            });
            results.academicYears.created++;
          }
        } catch (error) {
          results.academicYears.errors.push({
            year: ay.year,
            error: error.message,
          });
        }
      }
    }

    // Save all at once
    await masterData.save();

    logger.info("master_data_bulk_created", {
      results,
      createdBy: req.user._id,
    });

    const totalCreated =
      results.schools.created +
      results.programs.created +
      results.academicYears.created;

    const totalSkipped =
      results.schools.skipped +
      results.programs.skipped +
      results.academicYears.skipped;

    const totalErrors =
      results.schools.errors.length +
      results.programs.errors.length +
      results.academicYears.errors.length;

    res.status(201).json({
      success: true,
      message: `Master data created: ${totalCreated} created, ${totalSkipped} skipped, ${totalErrors} errors.`,
      data: results,
    });
  } catch (error) {
    logger.error("create_master_data_bulk_error", {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Error creating master data.",
      error: error.message,
    });
  }
}

/**
 * Get or create master data
 */
async function getOrCreateMasterData() {
  let masterData = await MasterData.findOne();

  if (!masterData) {
    masterData = new MasterData({
      schools: [],
      programs: [],
      academicYears: [],
    });
    await masterData.save();
    logger.info("master_data_initialized", {
      message: "Master data collection created",
    });
  }

  return masterData;
}

/**
 * Get master data
 */
export async function getMasterData(req, res) {
  try {
    const masterData = await getOrCreateMasterData();

    res.status(200).json({
      success: true,
      data: masterData,
    });
  } catch (error) {
    logger.error("get_master_data_error", {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Error retrieving master data.",
    });
  }
}

/**
 * Create school
 */
export async function createSchool(req, res) {
  try {
    const { name, code } = req.body;

    const masterData = await getOrCreateMasterData();

    // Check if school already exists
    const exists = masterData.schools.find(
      (s) => s.code === code || s.name === name
    );

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "School with this name or code already exists.",
      });
    }

    // Add school
    masterData.schools.push({ name, code });
    await masterData.save();

    logger.info("school_created", {
      name,
      code,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "School created successfully.",
      data: { name, code },
    });
  } catch (error) {
    logger.error("create_school_error", {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Error creating school.",
    });
  }
}

/**
 * Update school
 */
export async function updateSchool(req, res) {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    const masterData = await getOrCreateMasterData();

    const school = masterData.schools.id(id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School not found.",
      });
    }

    // Check for duplicates (excluding current school)
    const duplicate = masterData.schools.find(
      (s) => s._id.toString() !== id && (s.code === code || s.name === name)
    );

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "School with this name or code already exists.",
      });
    }

    school.name = name;
    school.code = code;
    await masterData.save();

    logger.info("school_updated", {
      schoolId: id,
      name,
      code,
      updatedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "School updated successfully.",
      data: school,
    });
  } catch (error) {
    logger.error("update_school_error", {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: "Error updating school. " + error.message,
    });
  }
}

/**
 * Delete school
 */
export async function deleteSchool(req, res) {
  try {
    const { id } = req.params;

    const masterData = await getOrCreateMasterData();

    const schoolIndex = masterData.schools.findIndex(
      (s) => s._id.toString() === id
    );

    if (schoolIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "School not found.",
      });
    }

    // Optional: Check if school is in use (by Faculty, Student, Project, etc.)
    // For now, we'll allow deletion but log it. Real implementation should probably prevent it.
    // However, user just wants "fix delete", so we will implement basic deletion.

    const schoolName = masterData.schools[schoolIndex].name;
    masterData.schools.pull(id);
    await masterData.save();

    logger.info("school_deleted", {
      schoolId: id,
      schoolName,
      deletedBy: req.user?._id,
    });

    res.status(200).json({
      success: true,
      message: "School deleted successfully.",
    });
  } catch (error) {
    logger.error("delete_school_error", {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: "Error deleting school.",
    });
  }
}

/**
 * Create department (Program)
 */
export async function createProgram(req, res) {
  try {
    const { name, code, school } = req.body;

    const masterData = await getOrCreateMasterData();

    // Check if school exists
    const schoolExists = masterData.schools.find((s) => s.code === school);

    if (!schoolExists) {
      return res.status(404).json({
        success: false,
        message: "School not found. Please create the school first.",
      });
    }

    // Check if program already exists
    const exists = masterData.programs.find(
      (p) => (p.code === code || p.name === name) && p.school === school
    );

    if (exists) {
      return res.status(409).json({
        success: false,
        message:
          "Program with this name or code already exists in this school.",
      });
    }

    // Add program
    masterData.programs.push({
      name,
      code,
      school,
      specializations: req.body.specializations || [],
    });
    await masterData.save();

    logger.info("program_created", {
      name,
      code,
      school,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Program created successfully.",
      data: {
        name,
        code,
        school,
        specializations: req.body.specializations || [],
      },
    });
  } catch (error) {
    logger.error("create_program_error", {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Error creating program.",
    });
  }
}

/**
 * Update department (Program)
 */
export async function updateProgram(req, res) {
  try {
    const { id } = req.params;
    const { name, code, school, specializations } = req.body;

    const masterData = await getOrCreateMasterData();

    const program = masterData.programs.id(id);

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found.",
      });
    }

    // Check if school exists
    const schoolExists = masterData.schools.find((s) => s.code === school);

    if (!schoolExists) {
      return res.status(404).json({
        success: false,
        message: "School not found.",
      });
    }

    // Check for duplicates
    const duplicate = masterData.programs.find(
      (p) =>
        p._id.toString() !== id &&
        (p.code === code || p.name === name) &&
        p.school === school
    );

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message:
          "Program with this name or code already exists in this school.",
      });
    }

    program.name = name;
    program.code = code;
    program.school = school;
    if (specializations) program.specializations = specializations;
    await masterData.save();

    logger.info("program_updated", {
      programId: id,
      name,
      code,
      school,
      updatedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Program updated successfully.",
      data: program,
    });
  } catch (error) {
    logger.error("update_program_error", {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Error updating program.",
    });
  }
}

/**
 * Create academic year
 */
export async function createAcademicYear(req, res) {
  try {
    const { year } = req.body;

    const masterData = await getOrCreateMasterData();

    // Check if academic year already exists
    const exists = masterData.academicYears.find((ay) => ay.year === year);

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Academic year already exists.",
      });
    }

    // Add academic year
    masterData.academicYears.push({ year });
    await masterData.save();

    logger.info("academic_year_created", {
      year,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Academic year created successfully.",
      data: { year },
    });
  } catch (error) {
    logger.error("create_academic_year_error", {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Error creating academic year.",
    });
  }
}

/**
 * Update academic year
 */
export async function updateAcademicYear(req, res) {
  try {
    const { id } = req.params;
    const { year, isActive } = req.body;

    const masterData = await getOrCreateMasterData();

    const academicYear = masterData.academicYears.id(id);

    if (!academicYear) {
      return res.status(404).json({
        success: false,
        message: "Academic year not found.",
      });
    }

    // Handle soft delete
    if (isActive !== undefined) {
      academicYear.isActive = isActive;
      await masterData.save();

      logger.info("academic_year_deleted", {
        yearId: id,
        deletedBy: req.user._id,
      });

      return res.status(200).json({
        success: true,
        message: "Academic year deleted successfully.",
        data: academicYear,
      });
    }

    // Handle update
    if (!year) {
      return res.status(400).json({
        success: false,
        message: "Year field is required for update.",
      });
    }

    // Check for duplicates (excluding current year)
    const duplicate = masterData.academicYears.find(
      (ay) =>
        ay._id.toString() !== id && ay.year === year && ay.isActive !== false
    );

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Academic year already exists.",
      });
    }

    academicYear.year = year;
    await masterData.save();

    logger.info("academic_year_updated", {
      yearId: id,
      year,
      updatedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Academic year updated successfully.",
      data: academicYear,
    });
  } catch (error) {
    logger.error("update_academic_year_error", {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: "Error updating academic year.",
    });
  }
}

// ===== PROGRAM CONFIG =====

export async function getProgramConfig(req, res) {
  try {
    const { academicYear, school, program } = req.query;

    const config = await ProgramConfig.findOne({
      academicYear,
      school,
      program,
    }).lean();

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Program config not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function createProgramConfig(req, res) {
  try {
    const {
      academicYear,
      school,
      program,
      maxTeamSize,
      minTeamSize,

      maxPanelSize,
      minPanelSize,
      featureLocks,
    } = req.body;

    // Check if already exists
    const existing = await ProgramConfig.findOne({
      academicYear,
      school,
      program,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Program config already exists for this context.",
      });
    }

    const config = new ProgramConfig({
      academicYear,
      school,
      program,
      maxTeamSize: maxTeamSize || 4,
      minTeamSize: minTeamSize || 1,

      maxPanelSize: maxPanelSize || 5,
      minPanelSize: minPanelSize || 3,
      featureLocks:
        featureLocks ||
        [
          "student_management",
          "faculty_management",
          "project_management",
          "panel_management",
        ].map((feature) => ({
          featureName: feature,
          deadline: new Date(),
          isLocked: false,
        })),
    });

    await config.save();

    logger.info("program_config_created", {
      configId: config._id,
      academicYear,
      school,
      program,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Program config created successfully.",
      data: config,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function updateProgramConfig(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const config = await ProgramConfig.findById(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Program config not found.",
      });
    }

    // Apply updates
    Object.keys(updates).forEach((key) => {
      config[key] = updates[key];
    });

    await config.save();

    logger.info("program_config_updated", {
      configId: config._id,
      updatedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Program config updated successfully.",
      data: config,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function updateFeatureLock(req, res) {
  try {
    const { id } = req.params;
    const { featureName, deadline, isLocked } = req.body;

    const config = await ProgramConfig.findById(id);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Program config not found.",
      });
    }

    // Find or create feature lock
    let featureLock = config.featureLocks.find(
      (fl) => fl.featureName === featureName
    );

    if (featureLock) {
      if (deadline !== undefined) featureLock.deadline = deadline;
      if (isLocked !== undefined) featureLock.isLocked = isLocked;
    } else {
      config.featureLocks.push({
        featureName,
        deadline: deadline || null,
        isLocked: isLocked || false,
      });
    }

    await config.save();

    // Propagate deadline update to all project coordinators in this program
    if (deadline !== undefined) {
      // Direct mapping since featureName matches permission key
      const updateFields = {};
      updateFields[`permissions.${featureName}.deadline`] = deadline;

      await ProjectCoordinator.updateMany(
        {
          academicYear: config.academicYear,
          school: config.school,
          program: config.program,
          isActive: true,
        },
        {
          $set: updateFields,
        }
      );

      logger.info("coordinator_deadlines_propagated", {
        featureName,
        deadline,
        school: config.school,
        program: config.program,
      });
    }

    logger.info("feature_lock_updated", {
      configId: id,
      featureName,
      updatedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Feature lock updated successfully.",
      data: config,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}
