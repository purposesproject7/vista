import mongoose from "mongoose";
import { FacultyService } from "../services/facultyService.js";
import { PanelService } from "../services/panelService.js";
import { StudentService } from "../services/studentService.js";
import { ProjectService } from "../services/projectService.js";
import { MarkingSchemaService } from "../services/markingSchemaService.js";
import Faculty from "../models/facultySchema.js";
import Student from "../models/studentSchema.js";
import Project from "../models/projectSchema.js";
import Panel from "../models/panelSchema.js";
import MarkingSchema from "../models/markingSchema.js";
import ComponentLibrary from "../models/componentLibrarySchema.js";
import DepartmentConfig from "../models/departmentConfigSchema.js";
import Request from "../models/requestSchema.js";
import BroadcastMessage from "../models/broadcastMessageSchema.js";
import { logger } from "../utils/logger.js";

/**
 * Helper: Get coordinator context filter
 */
function getCoordinatorContext(req) {
  return {
    academicYear: req.coordinator.academicYear,
    school: req.coordinator.school,
    department: req.coordinator.department,
  };
}

/**
 * Helper: Verify context ownership
 */
function verifyContext(item, coordinator) {
  // If item has an academicYear field, it must match
  if (item.academicYear && item.academicYear !== coordinator.academicYear) {
    return false;
  }

  return (
    item.school === coordinator.school &&
    item.department === coordinator.department
  );
}

// ==================== Profile & Permissions ====================

export async function getProfile(req, res) {
  try {
    const coordinator = await ProjectCoordinator.findById(req.coordinator._id)
      .populate("faculty", "name emailId employeeId")
      .lean();

    res.status(200).json({
      success: true,
      data: coordinator,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getPermissions(req, res) {
  try {
    res.status(200).json({
      success: true,
      data: {
        permissions: req.coordinator.permissions,
        isPrimary: req.coordinator.isPrimary,
        canEdit: req.coordinator.isPrimary, // Only primary can edit
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// ==================== Faculty Management ====================

export async function createFaculty(req, res) {
  try {
    const context = getCoordinatorContext(req);

    // Ensure faculty is created in coordinator's context
    req.body.academicYear = context.academicYear;
    req.body.school = context.school;
    req.body.department = context.department;

    const faculty = await FacultyService.createFaculty(req.body, req.user._id);

    logger.info("faculty_created_by_coordinator", {
      facultyId: faculty._id,
      createdBy: req.user._id,
      coordinatorId: req.coordinator._id,
    });

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

export async function getFacultyList(req, res) {
  try {
    const context = getCoordinatorContext(req);
    const filters = { ...req.query, ...context };

    const faculties = await Faculty.find(filters)
      .select("-password")
      .sort({ name: 1 })
      .lean();

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
    if (!req.coordinator.isPrimary) {
      return res.status(403).json({
        success: false,
        message: "Only primary coordinator can edit faculty.",
      });
    }

    const { employeeId } = req.params;
    const faculty = await Faculty.findOne({ employeeId });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found.",
      });
    }

    // Verify context
    if (!verifyContext(faculty, req.coordinator)) {
      return res.status(403).json({
        success: false,
        message: "Faculty not in your department.",
      });
    }

    Object.assign(faculty, req.body);
    await faculty.save();

    logger.info("faculty_updated_by_coordinator", {
      facultyId: faculty._id,
      updatedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Faculty updated successfully.",
      data: faculty,
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
    if (!req.coordinator.isPrimary) {
      return res.status(403).json({
        success: false,
        message: "Only primary coordinator can delete faculty.",
      });
    }

    const { employeeId } = req.params;
    const faculty = await Faculty.findOne({ employeeId });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found.",
      });
    }

    // Verify context
    if (!verifyContext(faculty, req.coordinator)) {
      return res.status(403).json({
        success: false,
        message: "Faculty not in your department.",
      });
    }

    // Check if faculty is guide for any active projects
    const projectCount = await Project.countDocuments({
      guideFaculty: faculty._id,
      status: "active",
    });

    if (projectCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete faculty. They are guide for ${projectCount} active projects.`,
      });
    }

    await Faculty.findByIdAndDelete(faculty._id);

    logger.info("faculty_deleted_by_coordinator", {
      facultyId: faculty._id,
      deletedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Faculty deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// ==================== Student Management ====================

/**
 * Get student list (project coordinator)
 */
export async function getStudentList(req, res) {
  try {
    const coordinator = req.coordinator; // From requireProjectCoordinator middleware

    const filters = {
      academicYear: coordinator.academicYear,
      school: coordinator.school,
      department: coordinator.department,
      regNo: req.query.regNo,
      name: req.query.name,
      specialization: req.query.specialization,
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
 * Get student by registration number (project coordinator)
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

    // Verify student belongs to coordinator's department
    const coordinator = req.coordinator;
    if (
      student.school !== coordinator.school ||
      student.department !== coordinator.department ||
      student.academicYear !== coordinator.academicYear
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view students from your department",
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
 * Create individual student (project coordinator)
 */
export async function createStudent(req, res) {
  try {
    const coordinator = req.coordinator;
    const { regNo, name, emailId, phoneNumber } = req.body;

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
      coordinator.academicYear,
      coordinator.school,
      coordinator.department,
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
 * Bulk upload students (project coordinator)
 */
export async function uploadStudents(req, res) {
  try {
    const coordinator = req.coordinator;
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: "students array is required and cannot be empty",
      });
    }

    const result = await StudentService.uploadStudents(
      students,
      coordinator.academicYear,
      coordinator.school,
      coordinator.department,
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
 * Update student (project coordinator)
 */
export async function updateStudent(req, res) {
  try {
    if (!req.coordinator.isPrimary) {
      return res.status(403).json({
        success: false,
        message: "Only primary coordinator can update students.",
      });
    }

    const coordinator = req.coordinator;
    const student = await StudentService.getStudentByRegNo(req.params.regNo);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Verify student belongs to coordinator's department
    if (
      student.school !== coordinator.school ||
      student.department !== coordinator.department ||
      student.academicYear !== coordinator.academicYear
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only update students from your department",
      });
    }

    const updatedStudent = await StudentService.updateStudent(
      req.params.regNo,
      req.body,
      req.user._id,
    );

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: updatedStudent,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Delete student (project coordinator)
 */
export async function deleteStudent(req, res) {
  try {
    if (!req.coordinator.isPrimary) {
      return res.status(403).json({
        success: false,
        message: "Only primary coordinator can delete students.",
      });
    }

    const coordinator = req.coordinator;
    const student = await StudentService.getStudentByRegNo(req.params.regNo);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Verify student belongs to coordinator's department
    if (
      student.school !== coordinator.school ||
      student.department !== coordinator.department ||
      student.academicYear !== coordinator.academicYear
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only delete students from your department",
      });
    }

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

// ==================== Project Management ====================

export async function getProjectList(req, res) {
  try {
    const context = getCoordinatorContext(req);
    const filters = { ...req.query, ...context };

    const projects = await ProjectService.getProjectList(filters);

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

export async function createProject(req, res) {
  try {
    const context = getCoordinatorContext(req);

    // Apply context
    req.body.academicYear = context.academicYear;
    req.body.school = context.school;
    req.body.department = context.department;

    // Validate guide faculty exists and belongs to same dept
    const guide = await Faculty.findOne({
      employeeId: req.body.guideFacultyEmpId,
    });

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: "Guide faculty not found.",
      });
    }

    if (!verifyContext(guide, req.coordinator)) {
      return res.status(400).json({
        success: false,
        message: "Guide faculty must be from the same department.",
      });
    }

    // Validate specialization match
    /*
    if (guide.specialization !== req.body.specialization) {
      return res.status(400).json({
        success: false,
        message: `Specialization mismatch. Guide specializes in ${guide.specialization}, but project requires ${req.body.specialization}.`,
      });
    }
    */

    const project = await ProjectService.createProject(req.body, req.user._id);

    logger.info("project_created_by_coordinator", {
      projectId: project._id,
      coordinatorId: req.coordinator._id,
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully.",
      data: {
        projectId: project._id,
        name: project.name,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function createProjectsBulk(req, res) {
  try {
    const context = getCoordinatorContext(req);
    const { projects } = req.body;

    if (!Array.isArray(projects) || projects.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of projects.",
      });
    }

    // Enrich projects with context
    const enrichedProjects = projects.map((p) => ({
      ...p,
      academicYear: context.academicYear,
      school: context.school,
      department: context.department,
    }));

    const results = await ProjectService.createProjectsBulk(
      enrichedProjects,
      req.user._id,
    );

    logger.info("bulk_projects_created_by_coordinator", {
      count: results.created,
      coordinatorId: req.coordinator._id,
    });

    res.status(200).json({
      success: true,
      message: `Bulk creation completed. Created: ${results.created}, Failed: ${results.failed}`,
      data: results,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function updateProject(req, res) {
  try {
    if (!req.coordinator.isPrimary) {
      return res.status(403).json({
        success: false,
        message: "Only primary coordinator can edit projects.",
      });
    }

    const { id } = req.params;
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    if (!verifyContext(project, req.coordinator)) {
      return res.status(403).json({
        success: false,
        message: "Project not in your department.",
      });
    }

    Object.assign(project, req.body);
    await project.save();

    res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      data: project,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function deleteProject(req, res) {
  try {
    if (!req.coordinator.isPrimary) {
      return res.status(403).json({
        success: false,
        message: "Only primary coordinator can delete projects.",
      });
    }

    const { id } = req.params;
    await ProjectService.deleteProject(id, req.user._id);

    res.status(200).json({
      success: true,
      message: "Project deleted successfully.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// ==================== Guide Assignment ====================

export async function assignGuide(req, res) {
  try {
    if (!req.coordinator.isPrimary) {
      return res.status(403).json({
        success: false,
        message: "Only primary coordinator can assign guides.",
      });
    }

    const { projectId } = req.params;
    const { guideFacultyEmpId } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    if (!verifyContext(project, req.coordinator)) {
      return res.status(403).json({
        success: false,
        message: "Project not in your department.",
      });
    }

    // Validate guide faculty
    const guide = await Faculty.findOne({ employeeId: guideFacultyEmpId });

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: "Guide faculty not found in database.",
      });
    }

    if (!verifyContext(guide, req.coordinator)) {
      return res.status(400).json({
        success: false,
        message: "Guide must be from the same department.",
      });
    }

    // Validate specialization match
    /*
    if (guide.specialization !== project.specialization) {
      return res.status(400).json({
        success: false,
        message: `Specialization mismatch blocked. Guide specializes in ${guide.specialization}, but project requires ${project.specialization}.`,
      });
    }
    */

    // Check max projects per guide
    const config = await DepartmentConfig.findOne(getCoordinatorContext(req));
    if (config?.maxProjectsPerGuide) {
      const projectCount = await Project.countDocuments({
        guideFaculty: guide._id,
        status: "active",
      });

      if (projectCount >= config.maxProjectsPerGuide) {
        return res.status(400).json({
          success: false,
          message: `Guide already has maximum ${config.maxProjectsPerGuide} projects assigned.`,
        });
      }
    }

    project.guideFaculty = guide._id;
    await project.save();

    logger.info("guide_assigned_by_coordinator", {
      projectId,
      guideFacultyId: guide._id,
      coordinatorId: req.coordinator._id,
    });

    res.status(200).json({
      success: true,
      message: "Guide assigned successfully.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function reassignGuide(req, res) {
  try {
    if (!req.coordinator.isPrimary) {
      return res.status(403).json({
        success: false,
        message: "Only primary coordinator can reassign guides.",
      });
    }

    const { projectId } = req.params;
    const { newGuideFacultyEmpId, reason } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    if (!verifyContext(project, req.coordinator)) {
      return res.status(403).json({
        success: false,
        message: "Project not in your department.",
      });
    }

    // Validate new guide
    const newGuide = await Faculty.findOne({
      employeeId: newGuideFacultyEmpId,
    });

    if (!newGuide) {
      return res.status(404).json({
        success: false,
        message: "New guide faculty not found in database.",
      });
    }

    if (!verifyContext(newGuide, req.coordinator)) {
      return res.status(400).json({
        success: false,
        message: "New guide must be from the same department.",
      });
    }

    // Validate specialization match
    /*
    if (newGuide.specialization !== project.specialization) {
      return res.status(400).json({
        success: false,
        message: `Specialization mismatch blocked. New guide specializes in ${newGuide.specialization}, but project requires ${project.specialization}.`,
      });
    }
    */

    const oldGuideFacultyId = project.guideFaculty;

    // Mark current project as inactive
    project.status = "inactive";
    project.history = project.history || [];
    project.history.push({
      action: "guide_reassigned",
      previousGuideFaculty: oldGuideFacultyId,
      newGuideFaculty: newGuide._id,
      reason,
      performedBy: req.user._id,
      performedAt: new Date(),
    });
    await project.save();

    // Create new active project
    const newProject = new Project({
      ...project.toObject(),
      _id: new mongoose.Types.ObjectId(),
      guideFaculty: newGuide._id,
      status: "active",
      previousProjectId: project._id,
      history: [
        {
          action: "created_from_reassignment",
          previousProject: project._id,
          previousGuide: oldGuideFacultyId,
          currentGuide: newGuide._id,
          reason,
          performedBy: req.user._id,
          performedAt: new Date(),
        },
      ],
    });

    await newProject.save();

    logger.info("guide_reassigned_by_coordinator", {
      oldProjectId: projectId,
      newProjectId: newProject._id,
      oldGuide: oldGuideFacultyId,
      newGuide: newGuide._id,
      coordinatorId: req.coordinator._id,
    });

    res.status(200).json({
      success: true,
      message:
        "Guide reassigned successfully. Old project marked inactive, new project created.",
      data: {
        oldProjectId: project._id,
        newProjectId: newProject._id,
        newGuideName: newGuide.name,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// ==================== Panel Management ====================

export async function createPanel(req, res) {
  try {
    const context = getCoordinatorContext(req);
    const { memberEmployeeIds, venue, dateTime } = req.body;

    // Validate all panel members exist and belong to dept
    const members = await Faculty.find({
      employeeId: { $in: memberEmployeeIds },
    });

    if (members.length !== memberEmployeeIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more faculty members not found in database.",
      });
    }

    // Verify all members are from same dept
    const invalidMembers = members.filter(
      (m) => !verifyContext(m, req.coordinator),
    );
    if (invalidMembers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "All panel members must be from the same department.",
        invalidMembers: invalidMembers.map((m) => m.employeeId),
      });
    }

    req.body.academicYear = context.academicYear;
    req.body.school = context.school;
    req.body.department = context.department;

    const panel = await PanelService.createPanel(req.body, req.user._id);

    logger.info("panel_created_by_coordinator", {
      panelId: panel._id,
      coordinatorId: req.coordinator._id,
    });

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

export async function autoCreatePanels(req, res) {
  try {
    const context = getCoordinatorContext(req);
    const { panelSize } = req.body;

    const result = await PanelService.autoCreatePanels(
      context.academicYear,
      context.school,
      context.department,
      panelSize || null,
      req.user._id,
    );

    res.status(200).json({
      success: true,
      message: `Auto-created ${result.panelsCreated} panels.`,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getPanelList(req, res) {
  try {
    const context = getCoordinatorContext(req);
    const filters = { ...req.query, ...context };

    const panels = await PanelService.getPanelList(filters);

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

export async function updatePanelMembers(req, res) {
  try {
    if (!req.coordinator.isPrimary) {
      return res.status(403).json({
        success: false,
        message: "Only primary coordinator can edit panels.",
      });
    }

    const { id } = req.params;
    const { memberEmployeeIds } = req.body;

    const panel = await Panel.findById(id);
    if (!panel) {
      return res.status(404).json({
        success: false,
        message: "Panel not found.",
      });
    }

    if (!verifyContext(panel, req.coordinator)) {
      return res.status(403).json({
        success: false,
        message: "Panel not in your department.",
      });
    }

    // Validate new members
    const members = await Faculty.find({
      employeeId: { $in: memberEmployeeIds },
    });

    if (members.length !== memberEmployeeIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more faculty members not found in database.",
      });
    }

    const invalidMembers = members.filter(
      (m) => !verifyContext(m, req.coordinator),
    );
    if (invalidMembers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "All panel members must be from the same department.",
      });
    }

    // Update panel members (not creating new panel)
    panel.members = members.map((m) => ({
      faculty: m._id,
    }));

    panel.history = panel.history || [];
    panel.history.push({
      action: "members_updated",
      performedBy: req.user._id,
      performedAt: new Date(),
    });

    await panel.save();

    logger.info("panel_members_updated_by_coordinator", {
      panelId: id,
      coordinatorId: req.coordinator._id,
    });

    res.status(200).json({
      success: true,
      message: "Panel members updated successfully.",
      data: panel,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function deletePanel(req, res) {
  try {
    if (!req.coordinator.isPrimary) {
      return res.status(403).json({
        success: false,
        message: "Only primary coordinator can delete panels.",
      });
    }

    const { id } = req.params;
    const panel = await Panel.findById(id);

    if (!panel) {
      return res.status(404).json({
        success: false,
        message: "Panel not found.",
      });
    }

    if (!verifyContext(panel, req.coordinator)) {
      return res.status(403).json({
        success: false,
        message: "Panel not in your department.",
      });
    }

    // Check if panel assigned to any projects
    const projectCount = await Project.countDocuments({ panel: id });
    if (projectCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete panel. It is assigned to ${projectCount} projects.`,
      });
    }

    await Panel.findByIdAndDelete(id);

    logger.info("panel_deleted_by_coordinator", {
      panelId: id,
      coordinatorId: req.coordinator._id,
    });

    res.status(200).json({
      success: true,
      message: "Panel deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// ==================== Panel Assignment ====================

export async function assignPanel(req, res) {
  try {
    if (!req.coordinator.isPrimary) {
      return res.status(403).json({
        success: false,
        message: "Only primary coordinator can assign panels.",
      });
    }

    const { projectId, panelId } = req.body;

    // 1. Verify existence and context ownership
    const [project, panel] = await Promise.all([
      Project.findById(projectId),
      Panel.findById(panelId),
    ]);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    if (!panel) {
      return res.status(404).json({
        success: false,
        message: "Panel not found.",
      });
    }

    if (
      !verifyContext(project, req.coordinator) ||
      !verifyContext(panel, req.coordinator)
    ) {
      return res.status(403).json({
        success: false,
        message: "Project and panel must be in your department.",
      });
    }

    // Validate specialization match
    if (
      panel.specializations &&
      panel.specializations.length > 0 &&
      !panel.specializations.includes(project.specialization)
    ) {
      return res.status(400).json({
        success: false,
        message: `Specialization mismatch blocked. Panel specializes in [${panel.specializations.join(", ")}], but project requires ${project.specialization}.`,
      });
    }

    // 2. Use service to perform assignment (handles capacity, counts, etc.)
    await PanelService.assignPanelToProject(panelId, projectId, req.user._id);

    res.status(200).json({
      success: true,
      message: "Panel assigned to project successfully.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function assignReviewPanel(req, res) {
  try {
    const { projectId, reviewType, panelId, memberEmployeeIds } = req.body;
    const context = getCoordinatorContext(req);

    let targetPanelId = panelId;

    // Case 1: Create Temp Panel (Change Faculty)
    if (memberEmployeeIds && memberEmployeeIds.length > 0) {
      const newPanel = await PanelService.createPanel(
        {
          memberEmployeeIds,
          academicYear: context.academicYear,
          school: context.school,
          department: context.department,
          venue: "TBD (Review Panel)",
          specializations: [], // Temp panel
          type: "temporary",
        },
        req.user._id,
      );
      targetPanelId = newPanel._id;
    } else if (!targetPanelId) {
      return res.status(400).json({
        success: false,
        message:
          "Either panelId or memberEmployeeIds must be provided for review panel assignment.",
      });
    }

    const [project, panel] = await Promise.all([
      Project.findById(projectId),
      Panel.findById(targetPanelId),
    ]);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    if (!panel) {
      return res.status(404).json({
        success: false,
        message: "Panel not found.",
      });
    }

    if (
      !verifyContext(project, req.coordinator) ||
      !verifyContext(panel, req.coordinator)
    ) {
      return res.status(403).json({
        success: false,
        message: "Project and panel must be in your department.",
      });
    }

    // Specialization check skipped for manual review panel assignment as per requirement
    /*
    if (
      panel.specializations &&
      panel.specializations.length > 0 &&
      !panel.specializations.includes(project.specialization)
    ) {
      return res.status(400).json({
        success: false,
        message: `Specialization mismatch blocked. Panel specializes in [${panel.specializations.join(", ")}], but project requires ${project.specialization}.`,
      });
    }
    */

    // Validate review type exists in marking schema
    const schema = await MarkingSchema.findOne(getCoordinatorContext(req));
    const validReview = schema?.reviews.find(
      (r) => r.reviewName === reviewType,
    );

    if (!validReview) {
      return res.status(400).json({
        success: false,
        message: `Invalid review type: ${reviewType}`,
        validReviews: schema?.reviews.map((r) => r.reviewName) || [],
      });
    }

    // Update or add review panel
    project.reviewPanels = project.reviewPanels || [];
    const existingIdx = project.reviewPanels.findIndex(
      (rp) => rp.reviewType === reviewType,
    );

    if (existingIdx >= 0) {
      project.reviewPanels[existingIdx].panel = targetPanelId;
      project.reviewPanels[existingIdx].assignedBy = req.user._id;
      project.reviewPanels[existingIdx].assignedAt = new Date();
    } else {
      project.reviewPanels.push({
        reviewType,
        panel: targetPanelId,
        assignedBy: req.user._id,
        assignedAt: new Date(),
      });
    }

    await project.save();

    logger.info("review_panel_assigned_by_coordinator", {
      projectId,
      reviewType,
      panelId: targetPanelId,
      coordinatorId: req.coordinator._id,
    });

    res.status(200).json({
      success: true,
      message: `Panel assigned to ${reviewType} successfully.`,
      data: { projectId, reviewType, panelId: targetPanelId },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function autoAssignPanels(req, res) {
  try {
    const context = getCoordinatorContext(req);
    const { buffer } = req.body;

    const result = await PanelService.autoAssignPanels(
      context.academicYear,
      context.school,
      context.department,
      buffer || 0,
      req.user._id,
    );

    res.status(200).json({
      success: true,
      message: `Auto-assigned panels to ${result.projectsAssigned} projects.`,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function reassignPanel(req, res) {
  try {
    const { projectId, panelId, memberEmployeeIds, reason } = req.body;
    const context = getCoordinatorContext(req);

    if (!projectId) {
      return res
        .status(400)
        .json({ success: false, message: "Project ID is required." });
    }
    if (!reason) {
      return res
        .status(400)
        .json({ success: false, message: "Reason is required." });
    }

    let targetPanelId = panelId;

    // Case 1: Create Temp Panel (Change Faculty)
    if (memberEmployeeIds && memberEmployeeIds.length > 0) {
      // Create a new panel
      const newPanel = await PanelService.createPanel(
        {
          memberEmployeeIds,
          academicYear: context.academicYear,
          school: context.school,
          department: context.department,
          venue: "TBD (Reassignment)",
          specializations: [], // Temp panel, skip strict specialization
          type: "temporary",
        },
        req.user._id,
      );

      targetPanelId = newPanel._id;
    }
    // Case 2: Existing Panel
    else if (!targetPanelId) {
      return res.status(400).json({
        success: false,
        message:
          "Either panelId (for existing panel) or memberEmployeeIds (for new panel) must be provided.",
      });
    }

    // Perform reassignment
    // We skip specialization check for both cases as per requirement
    await PanelService.reassignProjectToPanel(
      projectId,
      targetPanelId,
      reason,
      req.user._id,
      true, // skipSpecializationCheck
    );

    res.status(200).json({
      success: true,
      message: "Panel reassigned successfully.",
      data: { projectId, newPanelId: targetPanelId },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// ==================== Team Operations ====================

export async function mergeTeams(req, res) {
  try {
    if (!req.coordinator.isPrimary) {
      return res.status(403).json({
        success: false,
        message: "Only primary coordinator can merge teams.",
      });
    }

    const { projectId1, projectId2, reason } = req.body;

    const [project1, project2] = await Promise.all([
      Project.findById(projectId1).populate("students"),
      Project.findById(projectId2).populate("students"),
    ]);

    if (!project1 || !project2) {
      return res.status(404).json({
        success: false,
        message: "One or both projects not found.",
      });
    }

    if (
      !verifyContext(project1, req.coordinator) ||
      !verifyContext(project2, req.coordinator)
    ) {
      return res.status(403).json({
        success: false,
        message: "Both projects must be in your department.",
      });
    }

    // Check team size limits
    const config = await DepartmentConfig.findOne(getCoordinatorContext(req));
    const mergedSize = project1.students.length + project2.students.length;

    if (config && mergedSize > config.maxTeamSize) {
      return res.status(400).json({
        success: false,
        message: `Merged team size (${mergedSize}) exceeds maximum (${config.maxTeamSize}).`,
      });
    }

    // Merge students
    project1.students.push(...project2.students);
    project1.teamSize = mergedSize;
    project1.history = project1.history || [];
    project1.history.push({
      action: "team_merged",
      mergedWithProject: project2._id,
      reason,
      performedBy: req.user._id,
      performedAt: new Date(),
    });

    // Deactivate project2
    project2.status = "inactive";
    project2.history = project2.history || [];
    project2.history.push({
      action: "merged_into_another_project",
      mergedIntoProject: project1._id,
      reason,
      performedBy: req.user._id,
      performedAt: new Date(),
    });

    await Promise.all([project1.save(), project2.save()]);

    logger.info("teams_merged_by_coordinator", {
      project1: projectId1,
      project2: projectId2,
      newTeamSize: mergedSize,
      coordinatorId: req.coordinator._id,
    });

    res.status(200).json({
      success: true,
      message: "Teams merged successfully.",
      data: {
        mergedProjectId: project1._id,
        inactiveProjectId: project2._id,
        newTeamSize: mergedSize,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function splitTeam(req, res) {
  try {
    if (!req.coordinator.isPrimary) {
      return res.status(403).json({
        success: false,
        message: "Only primary coordinator can split teams.",
      });
    }

    const { projectId, studentIds, reason } = req.body;

    const project = await Project.findById(projectId).populate("students");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    if (!verifyContext(project, req.coordinator)) {
      return res.status(403).json({
        success: false,
        message: "Project not in your department.",
      });
    }

    // Validate team sizes after split
    const config = await DepartmentConfig.findOne(getCoordinatorContext(req));
    const remainingSize = project.students.length - studentIds.length;

    if (config) {
      if (
        studentIds.length < config.minTeamSize ||
        studentIds.length > config.maxTeamSize
      ) {
        return res.status(400).json({
          success: false,
          message: `New team size (${studentIds.length}) must be between ${config.minTeamSize} and ${config.maxTeamSize}.`,
        });
      }

      if (
        remainingSize < config.minTeamSize ||
        remainingSize > config.maxTeamSize
      ) {
        return res.status(400).json({
          success: false,
          message: `Remaining team size (${remainingSize}) must be between ${config.minTeamSize} and ${config.maxTeamSize}.`,
        });
      }
    }

    // Remove students from original project
    project.students = project.students.filter(
      (s) => !studentIds.includes(s._id.toString()),
    );
    project.teamSize = remainingSize;
    project.history = project.history || [];
    project.history.push({
      action: "team_split",
      studentsRemoved: studentIds,
      reason,
      performedBy: req.user._id,
      performedAt: new Date(),
    });

    await project.save();

    logger.info("team_split_by_coordinator", {
      originalProject: projectId,
      studentsRemoved: studentIds.length,
      remainingSize,
      coordinatorId: req.coordinator._id,
    });

    res.status(200).json({
      success: true,
      message:
        "Team split successfully. Create a new project for the removed students.",
      data: {
        originalProjectId: project._id,
        remainingTeamSize: remainingSize,
        removedStudentIds: studentIds,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// ==================== Marking Schema & Components ====================

export async function getMarkingSchema(req, res) {
  try {
    const context = getCoordinatorContext(req);
    const schema = await MarkingSchema.findOne(context).lean();

    if (!schema) {
      return res.status(404).json({
        success: false,
        message: "Marking schema not found for your department.",
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

export async function updateMarkingSchemaDeadlines(req, res) {
  try {
    if (!req.coordinator.isPrimary) {
      return res.status(403).json({
        success: false,
        message: "Only primary coordinator can update deadlines.",
      });
    }

    const { id } = req.params;
    const { deadlines } = req.body; // { reviewName: { from, to }, ... }

    const schema = await MarkingSchema.findById(id);

    if (!schema) {
      return res.status(404).json({
        success: false,
        message: "Marking schema not found.",
      });
    }

    if (!verifyContext(schema, req.coordinator)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this marking schema.",
      });
    }

    // Update deadlines
    schema.reviews.forEach((review) => {
      if (deadlines[review.reviewName]) {
        review.deadline = deadlines[review.reviewName];
      }
    });

    await schema.save();

    logger.info("marking_schema_deadlines_updated_by_coordinator", {
      schemaId: id,
      coordinatorId: req.coordinator._id,
    });

    res.status(200).json({
      success: true,
      message: "Deadlines updated successfully.",
      data: schema,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getComponentLibrary(req, res) {
  try {
    const context = getCoordinatorContext(req);
    const library = await ComponentLibrary.findOne(context).lean();

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

// ==================== Department Config ====================

export async function getDepartmentConfig(req, res) {
  try {
    const context = getCoordinatorContext(req);
    const config = await DepartmentConfig.findOne(context).lean();

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Department configuration not found.",
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

// ==================== Requests ====================

export async function getRequests(req, res) {
  try {
    const context = getCoordinatorContext(req);

    const requests = await Request.find({
      ...context,
      status: { $in: ["pending", "approved", "rejected"] },
    })
      .populate("faculty", "name employeeId")
      .populate("student", "regNo name")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: requests,
      count: requests.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function handleRequest(req, res) {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'approved' or 'rejected'.",
      });
    }

    const request = await Request.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found.",
      });
    }

    request.status = status;
    request.remarks = remarks;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();

    await request.save();

    logger.info("request_handled_by_coordinator", {
      requestId: id,
      status,
      coordinatorId: req.coordinator._id,
    });

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

// ==================== Broadcasts ====================

export async function getBroadcasts(req, res) {
  try {
    const context = getCoordinatorContext(req);

    const broadcasts = await BroadcastMessage.find({
      $or: [{ targetSchools: { $size: 0 } }, { targetSchools: context.school }],
      $and: [
        {
          $or: [
            { targetDepartments: { $size: 0 } },
            { targetDepartments: context.department },
          ],
        },
      ],
    })
      .sort({ createdAt: -1 })
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

export async function createBroadcast(req, res) {
  try {
    const context = getCoordinatorContext(req);

    const broadcast = new BroadcastMessage({
      ...req.body,
      targetSchools: [context.school],
      targetDepartments: [context.department],
      createdBy: req.user._id,
    });

    await broadcast.save();

    logger.info("broadcast_created_by_coordinator", {
      broadcastId: broadcast._id,
      coordinatorId: req.coordinator._id,
    });

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

export async function updateBroadcast(req, res) {
  try {
    if (!req.coordinator.isPrimary) {
      return res.status(403).json({
        success: false,
        message: "Only primary coordinator can update broadcasts.",
      });
    }

    const { id } = req.params;

    const broadcast = await BroadcastMessage.findById(id);

    if (!broadcast) {
      return res.status(404).json({
        success: false,
        message: "Broadcast not found.",
      });
    }

    // Removed check for createdBy since only primary can edit now
    // if (broadcast.createdBy.toString() !== req.user._id.toString()) { ... }

    Object.assign(broadcast, req.body);
    await broadcast.save();

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

export async function deleteBroadcast(req, res) {
  try {
    if (!req.coordinator.isPrimary) {
      return res.status(403).json({
        success: false,
        message: "Only primary coordinator can delete broadcasts.",
      });
    }

    const { id } = req.params;

    const broadcast = await BroadcastMessage.findById(id);

    if (!broadcast) {
      return res.status(404).json({
        success: false,
        message: "Broadcast not found.",
      });
    }

    // Removed check for createdBy since only primary can delete now
    // if (broadcast.createdBy.toString() !== req.user._id.toString()) { ... }

    await BroadcastMessage.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Broadcast deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// ==================== Reports ====================

export async function getOverviewReport(req, res) {
  try {
    const context = getCoordinatorContext(req);

    const [totalProjects, totalStudents, totalFaculty, totalPanels] =
      await Promise.all([
        Project.countDocuments({ ...context, status: "active" }),
        Student.countDocuments(context),
        Faculty.countDocuments(context),
        Panel.countDocuments({ ...context, isActive: true }),
      ]);

    res.status(200).json({
      success: true,
      data: {
        totalProjects,
        totalStudents,
        totalFaculty,
        totalPanels,
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
    const context = getCoordinatorContext(req);

    const projects = await Project.find({ ...context, status: "active" })
      .populate("students", "regNo name")
      .populate("guideFaculty", "name employeeId")
      .populate("panel")
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
    const context = getCoordinatorContext(req);

    const students = await Student.find(context)
      .select("regNo name reviews")
      .lean();

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

export async function getPanelsReport(req, res) {
  try {
    const context = getCoordinatorContext(req);

    const panels = await Panel.find({ ...context, isActive: true })
      .populate("members.faculty", "name employeeId")
      .lean();

    const panelsWithProjects = await Promise.all(
      panels.map(async (panel) => {
        const projectCount = await Project.countDocuments({ panel: panel._id });
        return { ...panel, projectCount };
      }),
    );

    res.status(200).json({
      success: true,
      data: panelsWithProjects,
      count: panelsWithProjects.length,
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
    const context = getCoordinatorContext(req);

    const faculty = await Faculty.find(context)
      .select("name employeeId")
      .lean();

    const workload = await Promise.all(
      faculty.map(async (f) => {
        const [asGuide, asPanelMember] = await Promise.all([
          Project.countDocuments({ guideFaculty: f._id, status: "active" }),
          Panel.countDocuments({ "members.faculty": f._id, isActive: true }),
        ]);

        return {
          ...f,
          projectsAsGuide: asGuide,
          panelsAsMember: asPanelMember,
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
    const context = getCoordinatorContext(req);

    const students = await Student.find(context)
      .select("regNo name reviews PAT requiresContribution contributionType")
      .lean();

    // Process to calculate totals
    const performance = students.map((student) => {
      let processedReviews = {};
      if (student.reviews instanceof Map) {
        processedReviews = Object.fromEntries(student.reviews);
      } else {
        processedReviews = student.reviews || {};
      }

      let totalMarks = 0;
      Object.values(processedReviews).forEach((review) => {
        if (review.marks) {
          Object.values(review.marks).forEach((mark) => {
            totalMarks += Number(mark) || 0;
          });
        }
      });

      return {
        regNo: student.regNo,
        name: student.name,
        totalMarks,
        PAT: student.PAT,
        requiresContribution: student.requiresContribution,
        contributionType: student.contributionType,
        reviews: processedReviews,
      };
    });

    res.status(200).json({
      success: true,
      data: performance,
      count: performance.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
