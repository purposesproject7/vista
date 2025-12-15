import { FacultyService } from "../services/facultyService.js";
import { PanelService } from "../services/panelService.js";
import { StudentService } from "../services/studentService.js";
import { ProjectService } from "../services/projectService.js";
import { MarkingSchemaService } from "../services/markingSchemaService.js";
import ComponentLibrary from "../models/componentLibrarySchema.js";
import { logger } from "../utils/logger.js";

// Faculty Management
export async function createFaculty(req, res) {
  try {
    const { academicYear, school, department } = req.body;

    if (
      req.coordinator.academicYear !== academicYear ||
      req.coordinator.school !== school ||
      req.coordinator.department !== department
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only create faculty for your assigned context.",
      });
    }

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

export async function getFacultyList(req, res) {
  try {
    const filters = {
      ...req.query,
      school: req.coordinator.school,
      department: req.coordinator.department,
    };

    const faculties = await FacultyService.getFacultyList(filters);

    res.status(200).json({
      success: true,
      data: faculties,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Student Management
export async function uploadStudents(req, res) {
  try {
    const { students } = req.body;

    const results = await StudentService.uploadStudents(
      students,
      req.coordinator.academicYear,
      req.coordinator.school,
      req.coordinator.department,
      req.user._id,
    );

    res.status(200).json({
      success: true,
      message: `Upload complete: ${results.created} created, ${results.updated} updated, ${results.errors} errors.`,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getStudentList(req, res) {
  try {
    const filters = {
      academicYear: req.coordinator.academicYear,
      school: req.coordinator.school,
      department: req.coordinator.department,
      ...req.query,
    };

    const students = await StudentService.getStudentList(filters);

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

// Panel Management
export async function createPanel(req, res) {
  try {
    req.body.academicYear = req.coordinator.academicYear;
    req.body.school = req.coordinator.school;
    req.body.department = req.coordinator.department;

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

export async function getPanelList(req, res) {
  try {
    const filters = {
      academicYear: req.coordinator.academicYear,
      school: req.coordinator.school,
      department: req.coordinator.department,
      ...req.query,
    };

    const panels = await PanelService.getPanelList(filters);

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

export async function updatePanelMembers(req, res) {
  try {
    const { id } = req.params;
    const { memberEmployeeIds } = req.body;

    const panel = await PanelService.updatePanelMembers(
      id,
      memberEmployeeIds,
      req.user._id,
    );

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

// Guide Assignment
export async function assignGuide(req, res) {
  try {
    const { projectId } = req.params;
    const { guideFacultyId } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    // Verify context
    if (
      project.academicYear !== req.coordinator.academicYear ||
      project.school !== req.coordinator.school ||
      project.department !== req.coordinator.department
    ) {
      return res.status(403).json({
        success: false,
        message: "Project not in your coordinator context.",
      });
    }

    project.guideFaculty = guideFacultyId;
    await project.save();

    logger.info("guide_assigned", {
      projectId,
      guideFacultyId,
      assignedBy: req.user._id,
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

// Guide Reassignment
export async function reassignGuide(req, res) {
  try {
    const { projectId } = req.params;
    const { newGuideFacultyId, reason } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    // Add to history
    project.history.push({
      action: "guide_reassigned",
      previousGuideFaculty: project.guideFaculty,
      newGuideFaculty: newGuideFacultyId,
      reason,
      performedBy: req.user._id,
      performedAt: new Date(),
    });

    // Set old project inactive
    project.status = "inactive";
    await project.save();

    // Create new project
    const newProject = new Project({
      ...project.toObject(),
      _id: new mongoose.Types.ObjectId(),
      guideFaculty: newGuideFacultyId,
      status: "active",
      previousProjectId: project._id,
      history: [
        {
          action: "created",
          newGuideFaculty: newGuideFacultyId,
          reason: "Guide reassignment",
          performedBy: req.user._id,
          performedAt: new Date(),
        },
      ],
    });

    await newProject.save();

    logger.info("guide_reassigned", {
      oldProjectId: projectId,
      newProjectId: newProject._id,
      newGuideFacultyId,
      performedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Guide reassigned successfully.",
      data: { newProjectId: newProject._id },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// Panel Assignment
export async function assignPanel(req, res) {
  try {
    const { projectId } = req.params;
    const { panelId } = req.body;

    await PanelService.assignPanelToProject(panelId, projectId, req.user._id);

    res.status(200).json({
      success: true,
      message: "Panel assigned successfully.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// Review Panel Assignment
export async function assignReviewPanel(req, res) {
  try {
    const { projectId } = req.params;
    const { reviewType, panelId } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    // Check if review panel already assigned
    const existing = project.reviewPanels.find(
      (rp) => rp.reviewType === reviewType,
    );
    if (existing) {
      existing.panel = panelId;
      existing.assignedAt = new Date();
      existing.assignedBy = req.user._id;
    } else {
      project.reviewPanels.push({
        reviewType,
        panel: panelId,
        assignedBy: req.user._id,
      });
    }

    await project.save();

    logger.info("review_panel_assigned", {
      projectId,
      reviewType,
      panelId,
      assignedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Review panel assigned successfully.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// Team Merging
export async function mergeTeams(req, res) {
  try {
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

    // Verify context
    if (
      project1.academicYear !== req.coordinator.academicYear ||
      project1.school !== req.coordinator.school ||
      project1.department !== req.coordinator.department
    ) {
      return res.status(403).json({
        success: false,
        message: "Projects not in your coordinator context.",
      });
    }

    // Check team size
    const config = await departmentConfig.findOne({
      academicYear: req.coordinator.academicYear,
      school: req.coordinator.school,
      department: req.coordinator.department,
    });

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
    project1.history.push({
      action: "team_merged",
      mergedWithProject: project2._id,
      reason,
      performedBy: req.user._id,
    });

    // Deactivate project2
    project2.status = "inactive";
    project2.history.push({
      action: "deactivated",
      reason: "Team merged into another project",
      performedBy: req.user._id,
    });

    await Promise.all([project1.save(), project2.save()]);

    logger.info("teams_merged", {
      project1Id: projectId1,
      project2Id: projectId2,
      newTeamSize: mergedSize,
      performedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Teams merged successfully.",
      data: { mergedProjectId: project1._id, newTeamSize: mergedSize },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// Marking Schema
export async function getMarkingSchema(req, res) {
  try {
    const schema = await MarkingSchemaService.getMarkingSchema(
      req.coordinator.academicYear,
      req.coordinator.school,
      req.coordinator.department,
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

export async function updateMarkingSchema(req, res) {
  try {
    const { id } = req.params;

    // Verify ownership
    const schema = await MarkingSchema.findById(id);
    if (
      !schema ||
      schema.academicYear !== req.coordinator.academicYear ||
      schema.school !== req.coordinator.school ||
      schema.department !== req.coordinator.department
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this marking schema.",
      });
    }

    Object.assign(schema, req.body);
    await schema.save();

    logger.info("marking_schema_updated_by_coordinator", {
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

// Component Library
export async function getComponentLibrary(req, res) {
  try {
    const library = await ComponentLibrary.findOne({
      academicYear: req.coordinator.academicYear,
      school: req.coordinator.school,
      department: req.coordinator.department,
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

export async function updateComponentLibrary(req, res) {
  try {
    const { id } = req.params;

    const library = await ComponentLibrary.findById(id);
    if (
      !library ||
      library.academicYear !== req.coordinator.academicYear ||
      library.school !== req.coordinator.school ||
      library.department !== req.coordinator.department
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this component library.",
      });
    }

    Object.assign(library, req.body);
    await library.save();

    logger.info("component_library_updated_by_coordinator", {
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

// Reports (filtered to coordinator context)
export async function getProjectsReport(req, res) {
  try {
    const filters = {
      academicYear: req.coordinator.academicYear,
      school: req.coordinator.school,
      department: req.coordinator.department,
    };

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

export async function getMarksReport(req, res) {
  try {
    const marks = await Marks.find({
      academicYear: req.coordinator.academicYear,
      school: req.coordinator.school,
      department: req.coordinator.department,
    })
      .populate("student", "regNo name")
      .populate("faculty", "name employeeId")
      .populate("project", "name")
      .lean();

    res.status(200).json({
      success: true,
      data: marks,
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
    const panels = await Panel.find({
      academicYear: req.coordinator.academicYear,
      school: req.coordinator.school,
      department: req.coordinator.department,
      isActive: true,
    })
      .populate("members.faculty", "name employeeId")
      .lean();

    // Get project count for each panel
    const panelsWithProjects = await Promise.all(
      panels.map(async (panel) => {
        const projectCount = await Project.countDocuments({ panel: panel._id });
        return {
          ...panel,
          projectCount,
        };
      }),
    );

    res.status(200).json({
      success: true,
      data: panelsWithProjects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
