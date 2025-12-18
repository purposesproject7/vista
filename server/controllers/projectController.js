import mongoose from "mongoose";
import Project from "../models/projectSchema.js";
import Student from "../models/studentSchema.js";
import Faculty from "../models/facultySchema.js";
import Panel from "../models/panelSchema.js";
import MarkingSchema from "../models/markingSchema.js";
import Request from "../models/requestSchema.js";
import { ProjectService } from "../services/projectService.js";
import { logger } from "../utils/logger.js";

/**
 * Get all projects with filters
 */
export async function getProjectList(req, res) {
  try {
    const projects = await ProjectService.getProjectList(req.query);

    res.status(200).json({
      success: true,
      data: projects,
      count: projects.length,
    });
  } catch (error) {
    logger.error("get_project_list_error", {
      error: error.message,
      query: req.query,
    });

    res.status(500).json({
      success: false,
      message: "Error retrieving projects.",
    });
  }
}

/**
 * Get project by ID
 */
export async function getProjectById(req, res) {
  try {
    const { id } = req.params;

    const project = await ProjectService.getProjectById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching project details.",
    });
  }
}

/**
 * Get projects by student ID
 */
export async function getProjectsByStudent(req, res) {
  try {
    const { regNo } = req.params;

    const projects = await ProjectService.getProjectsByStudent(regNo);

    res.status(200).json({
      success: true,
      data: projects,
      count: projects.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching student projects.",
    });
  }
}

/**
 * Get projects by guide faculty ID
 */
export async function getProjectsByGuide(req, res) {
  try {
    const { employeeId } = req.params;

    const projects = await ProjectService.getProjectsByGuide(employeeId);

    res.status(200).json({
      success: true,
      data: projects,
      count: projects.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching guide projects.",
    });
  }
}

/**
 * Get projects by panel ID
 */
export async function getProjectsByPanel(req, res) {
  try {
    const { panelId } = req.params;

    const projects = await ProjectService.getProjectsByPanel(panelId);

    res.status(200).json({
      success: true,
      data: projects,
      count: projects.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching panel projects.",
    });
  }
}

/**
 * Create single project
 */
export async function createProject(req, res) {
  try {
    const project = await ProjectService.createProject(req.body, req.user._id);

    logger.info("project_created", {
      projectId: project._id,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully.",
      data: {
        projectId: project._id,
        name: project.name,
        studentsCount: project.students.length,
      },
    });
  } catch (error) {
    logger.error("create_project_error", {
      error: error.message,
      userId: req.user._id,
    });

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Project with this name already exists.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create project.",
    });
  }
}

/**
 * Create multiple projects (bulk)
 */
export async function createProjectsBulk(req, res) {
  try {
    const results = await ProjectService.createProjectsBulk(
      req.body,
      req.user._id,
    );

    logger.info("bulk_projects_created", {
      created: results.created,
      errors: results.errors,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: `Bulk creation completed: ${results.created} created, ${results.errors} errors.`,
      data: results,
    });
  } catch (error) {
    logger.error("bulk_create_error", {
      error: error.message,
      userId: req.user._id,
    });

    res.status(500).json({
      success: false,
      message: "Server error during bulk project creation.",
    });
  }
}

/**
 * Update project details
 */
export async function updateProjectDetails(req, res) {
  try {
    const { projectId, projectUpdates, studentUpdates } = req.body;

    const result = await ProjectService.updateProjectDetails(
      projectId,
      projectUpdates,
      studentUpdates,
      req.user._id,
    );

    logger.info("project_updated", {
      projectId,
      updatedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: `Successfully updated project and ${result.studentsUpdated || 0} students.`,
      data: result,
    });
  } catch (error) {
    logger.error("update_project_error", {
      error: error.message,
      projectId: req.body?.projectId,
    });

    res.status(500).json({
      success: false,
      message: error.message || "Server error during project update.",
    });
  }
}


/**
 * Delete project
 */
export async function deleteProject(req, res) {
  try {
    const { id } = req.params;

    await ProjectService.deleteProject(id, req.user._id);

    logger.info("project_deleted", {
      projectId: id,
      deletedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Project deleted successfully.",
    });
  } catch (error) {
    logger.error("delete_project_error", {
      error: error.message,
      projectId: req.params?.id,
    });

    if (error.message === "Project not found") {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error deleting project.",
    });
  }
}
