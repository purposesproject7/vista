import mongoose from "mongoose";
import Project from "../models/projectSchema.js";
import Panel from "../models/panelSchema.js";
import Student from "../models/studentSchema.js";
import Faculty from "../models/facultySchema.js";
import ProjectCoordinator from "../models/projectCoordinatorSchema.js";
import ComponentLibrary from "../models/componentLibrarySchema.js";
import MarkingSchema from "../models/markingSchema.js";
import Marks from "../models/marksSchema.js";
import DepartmentConfig from "../models/departmentConfigSchema.js";
import { logger } from "../utils/logger.js";
import MasterData from "../models/masterDataSchema.js";
import { FacultyService } from "../services/facultyService.js";
import { PanelService } from "../services/panelService.js";
import { StudentService } from "../services/studentService.js";
import { ProjectService } from "../services/projectService.js";
import { MarkingSchemaService } from "../services/markingSchemaService.js";
import { BroadcastService } from "../services/broadcastService.js";
import { RequestService } from "../services/requestService.js";

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
      req.user._id,
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
    const { academicYear, school, department } = req.query;
    const schema = await MarkingSchemaService.getMarkingSchema(
      academicYear,
      school,
      department,
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
      req.user._id,
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

// ===== PANEL AUTO FUNCTIONS =====

export async function autoCreatePanels(req, res) {
  try {
    const { departments, school, academicYear, panelSize } = req.body;

    const results = await PanelService.autoCreatePanels(
      departments,
      school,
      academicYear,
      panelSize || 2,
      req.user._id,
    );

    res.status(200).json({
      success: true,
      message: `Auto-creation complete: ${results.created} panels created, ${results.errors} errors.`,
      data: results,
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
    const { academicYear, school, department } = req.body;

    const results = await PanelService.autoAssignPanelsToProjects(
      academicYear,
      school,
      department,
      req.user._id,
    );

    res.status(200).json({
      success: true,
      message: `Auto-assignment complete: ${results.assigned} projects assigned, ${results.errors} errors.`,
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
      { remarks, newDeadline },
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
      req.user,
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
      req.user._id,
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
      message: `Project ${project.bestProject ? "marked" : "unmarked"} as best project.`,
      data: { bestProject: project.bestProject },
    });
  } catch (error) {
    res.status(500).json({
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
      department: req.query.department,
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
    const {
      regNo,
      name,
      emailId,
      phoneNumber,
      school,
      department,
      academicYear,
    } = req.body;

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
      [{ regNo, name, emailId, phoneNumber }],
      academicYear,
      school,
      department,
      req.user._id,
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
    const { students, academicYear, school, department } = req.body;

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
      department,
      req.user._id,
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
      req.user._id,
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
    const { academicYear, school, department } = req.query;

    const coordinators = await ProjectCoordinator.find({
      academicYear,
      school,
      department,
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
    const {
      facultyId,
      academicYear,
      school,
      department,
      isPrimary,
      permissions,
    } = req.body;

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
      department,
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
    const departmentConfig = await DepartmentConfig.findOne({
      academicYear,
      school,
      department,
    });

    if (!departmentConfig) {
      return res.status(404).json({
        success: false,
        message: "Department configuration not found. Please create it first.",
      });
    }

    // Build deadline mapping
    const globalDeadlines = {};
    departmentConfig.featureLocks.forEach((lock) => {
      globalDeadlines[lock.featureName] = lock.deadline;
    });

    // Default permissions with global deadlines
    const defaultPermissions = {
      canEdit: { enabled: true },
      canView: { enabled: true },
      canCreateFaculty: {
        enabled: true,
        deadline: globalDeadlines.faculty_creation,
      },
      canEditFaculty: { enabled: isPrimary || false },
      canDeleteFaculty: { enabled: isPrimary || false },

      canCreatePanels: {
        enabled: true,
        deadline: globalDeadlines.panel_creation,
      },
      canEditPanels: { enabled: isPrimary || false },
      canDeletePanels: { enabled: isPrimary || false },
      canAssignPanels: {
        enabled: true,
        deadline: globalDeadlines.panel_assignment,
      },
      canReassignPanels: { enabled: isPrimary || false },

      canUploadStudents: {
        enabled: true,
        deadline: globalDeadlines.student_upload,
      },
      canModifyStudents: {
        enabled: true,
        deadline: globalDeadlines.student_modification,
      },
      canDeleteStudents: { enabled: isPrimary || false },

      canCreateProjects: {
        enabled: true,
        deadline: globalDeadlines.project_creation,
      },
      canEditProjects: { enabled: isPrimary || false },
      canDeleteProjects: { enabled: isPrimary || false },

      canAssignGuides: {
        enabled: true,
        deadline: globalDeadlines.guide_assignment,
      },
      canReassignGuides: {
        enabled: isPrimary || false,
        deadline: globalDeadlines.guide_reassignment,
      },
      canMergeTeams: {
        enabled: isPrimary || false,
        deadline: globalDeadlines.team_merging,
      },
      canSplitTeams: {
        enabled: isPrimary || false,
        deadline: globalDeadlines.team_splitting,
      },
      canEditMarkingSchema: {
        enabled: isPrimary || false,
        deadline: globalDeadlines.marking_schema_edit,
      },
      canManageRequests: { enabled: isPrimary || false },
      canCreateBroadcasts: { enabled: true },
      canEditBroadcasts: { enabled: isPrimary || false },
      canDeleteBroadcasts: { enabled: isPrimary || false },
    };

    // Merge custom permissions if provided
    const finalPermissions = permissions
      ? mergePermissions(defaultPermissions, permissions)
      : defaultPermissions;

    // If primary, unset others
    if (isPrimary) {
      await ProjectCoordinator.updateMany(
        { academicYear, school, department, isPrimary: true },
        { $set: { isPrimary: false } },
      );
    }

    // Create coordinator assignment
    const coordinator = new ProjectCoordinator({
      faculty: facultyId,
      academicYear,
      school,
      department,
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
      department,
      isPrimary,
      assignedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Project coordinator assigned successfully.",
      data: coordinator,
    });
  } catch (error) {
    logger.error("assign_project_coordinator_error", {
      error: error.message,
      stack: error.stack,
    });

    res.status(400).json({
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
          department: coordinator.department,
          isPrimary: true,
          _id: { $ne: id },
        },
        { $set: { isPrimary: false } },
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
      { new: true },
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
    const { academicYear, school, department } = req.query;

    const library = await ComponentLibrary.findOne({
      academicYear,
      school,
      department,
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
    const { academicYear, school, department, components } = req.body;

    const existing = await ComponentLibrary.findOne({
      academicYear,
      school,
      department,
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
      department,
      components,
    });

    await library.save();

    logger.info("component_library_created", {
      libraryId: library._id,
      academicYear,
      school,
      department,
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
      { new: true, runValidators: true },
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
    const { academicYear, school, department } = req.query;

    const [
      totalProjects,
      activeProjects,
      totalStudents,
      totalFaculty,
      totalPanels,
      completedProjects,
    ] = await Promise.all([
      Project.countDocuments({ academicYear, school, department }),
      Project.countDocuments({
        academicYear,
        school,
        department,
        status: "active",
      }),
      Student.countDocuments({
        academicYear,
        school,
        department,
        isActive: true,
      }),
      Faculty.countDocuments({
        school: { $in: [school] },
        department: { $in: [department] },
      }),
      Panel.countDocuments({
        academicYear,
        school,
        department,
        isActive: true,
      }),
      Project.countDocuments({
        academicYear,
        school,
        department,
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
    const { academicYear, school, department } = req.query;

    const projects = await Project.find({ academicYear, school, department })
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
    const { academicYear, school, department, reviewType } = req.query;

    const query = { academicYear, school, department };
    if (reviewType) query.reviewType = reviewType;

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
    const { academicYear, school, department } = req.query;

    const faculties = await Faculty.find({
      school: { $in: [school] },
      department: { $in: [department] },
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
      }),
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
    const { academicYear, school, department } = req.query;

    const students = await Student.find({
      academicYear,
      school,
      department,
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
        0,
      );
      const maxMarks = allMarks.reduce(
        (sum, m) => sum + (m.maxTotalMarks || 0),
        0,
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
    const { panelId, projectId } = req.body;

    const result = await PanelService.assignPanelToProject(
      panelId,
      projectId,
      req.user._id,
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
    const { schools, departments, academicYears } = req.body;

    const masterData = await getOrCreateMasterData();

    const results = {
      schools: { created: 0, skipped: 0, errors: [] },
      departments: { created: 0, skipped: 0, errors: [] },
      academicYears: { created: 0, skipped: 0, errors: [] },
    };

    // Process schools
    if (Array.isArray(schools)) {
      for (const school of schools) {
        try {
          const exists = masterData.schools.find(
            (s) => s.code === school.code || s.name === school.name,
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

    // Process departments
    if (Array.isArray(departments)) {
      for (const dept of departments) {
        try {
          // Verify school exists
          const schoolExists = masterData.schools.find(
            (s) => s.code === dept.school,
          );

          if (!schoolExists) {
            results.departments.errors.push({
              department: dept.name,
              error: `School '${dept.school}' not found`,
            });
            continue;
          }

          const exists = masterData.departments.find(
            (d) =>
              (d.code === dept.code || d.name === dept.name) &&
              d.school === dept.school,
          );

          if (exists) {
            results.departments.skipped++;
            logger.warn("department_skipped_duplicate", {
              name: dept.name,
              code: dept.code,
              school: dept.school,
            });
          } else {
            masterData.departments.push({
              name: dept.name,
              code: dept.code,
              school: dept.school,
            });
            results.departments.created++;
          }
        } catch (error) {
          results.departments.errors.push({
            department: dept.name,
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
            (year) => year.year === ay.year,
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
      results.departments.created +
      results.academicYears.created;

    const totalSkipped =
      results.schools.skipped +
      results.departments.skipped +
      results.academicYears.skipped;

    const totalErrors =
      results.schools.errors.length +
      results.departments.errors.length +
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
      departments: [],
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
      (s) => s.code === code || s.name === name,
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
      (s) => s._id.toString() !== id && (s.code === code || s.name === name),
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
    });

    res.status(500).json({
      success: false,
      message: "Error updating school.",
    });
  }
}

/**
 * Create department
 */
export async function createDepartment(req, res) {
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

    // Check if department already exists
    const exists = masterData.departments.find(
      (d) => (d.code === code || d.name === name) && d.school === school,
    );

    if (exists) {
      return res.status(409).json({
        success: false,
        message:
          "Department with this name or code already exists in this school.",
      });
    }

    // Add department
    masterData.departments.push({ name, code, school });
    await masterData.save();

    logger.info("department_created", {
      name,
      code,
      school,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Department created successfully.",
      data: { name, code, school },
    });
  } catch (error) {
    logger.error("create_department_error", {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Error creating department.",
    });
  }
}

/**
 * Update department
 */
export async function updateDepartment(req, res) {
  try {
    const { id } = req.params;
    const { name, code, school } = req.body;

    const masterData = await getOrCreateMasterData();

    const department = masterData.departments.id(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
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
    const duplicate = masterData.departments.find(
      (d) =>
        d._id.toString() !== id &&
        (d.code === code || d.name === name) &&
        d.school === school,
    );

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message:
          "Department with this name or code already exists in this school.",
      });
    }

    department.name = name;
    department.code = code;
    department.school = school;
    await masterData.save();

    logger.info("department_updated", {
      departmentId: id,
      name,
      code,
      school,
      updatedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Department updated successfully.",
      data: department,
    });
  } catch (error) {
    logger.error("update_department_error", {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Error updating department.",
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

// ===== DEPARTMENT CONFIG =====

export async function getDepartmentConfig(req, res) {
  try {
    const { academicYear, school, department } = req.query;

    const config = await DepartmentConfig
      .findOne({
        academicYear,
        school,
        department,
      })
      .lean();

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Department config not found.",
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

export async function createDepartmentConfig(req, res) {
  try {
    const {
      academicYear,
      school,
      department,
      maxTeamSize,
      minTeamSize,
      maxPanelSize,
      minPanelSize,
      featureLocks,
    } = req.body;

    // Check if already exists
    const existing = await DepartmentConfig.findOne({
      academicYear,
      school,
      department,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Department config already exists for this context.",
      });
    }

    const config = new DepartmentConfig({
      academicYear,
      school,
      department,
      maxTeamSize: maxTeamSize || 4,
      minTeamSize: minTeamSize || 1,
      maxPanelSize: maxPanelSize || 5,
      minPanelSize: minPanelSize || 3,
      featureLocks: featureLocks || [],
    });

    await config.save();

    logger.info("department_config_created", {
      configId: config._id,
      academicYear,
      school,
      department,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Department config created successfully.",
      data: config,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function updateDepartmentConfig(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const config = await DepartmentConfig.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Department config not found.",
      });
    }

    logger.info("department_config_updated", {
      configId: id,
      updatedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Department config updated successfully.",
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

    const config = await DepartmentConfig.findById(id);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Department config not found.",
      });
    }

    // Find or create feature lock
    let featureLock = config.featureLocks.find(
      (fl) => fl.featureName === featureName,
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

    // Propagate deadline update to all project coordinators in this department
    if (deadline !== undefined) {
      const permissionMap = {
        faculty_creation: "canCreateFaculty",
        panel_creation: "canCreatePanels",
        student_upload: "canUploadStudents",
        student_modification: "canModifyStudents",
        project_creation: "canCreateProjects",
        marking_schema_edit: "canEditMarkingSchema",
        guide_assignment: "canAssignGuides",
        panel_assignment: "canAssignPanels",
        guide_reassignment: "canReassignGuides",
        team_merging: "canMergeTeams",
        team_splitting: "canSplitTeams",
      };

      const permissionField = permissionMap[featureName];

      if (permissionField) {
        await ProjectCoordinator.updateMany(
          {
            academicYear: config.academicYear,
            school: config.school,
            department: config.department,
            isActive: true,
          },
          {
            $set: {
              [`permissions.${permissionField}.deadline`]: deadline,
            },
          },
        );

        logger.info("coordinator_deadlines_propagated", {
          featureName,
          permissionField,
          deadline,
          school: config.school,
          department: config.department,
        });
      }
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
