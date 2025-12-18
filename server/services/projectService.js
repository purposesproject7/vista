import mongoose from "mongoose";
import Project from "../models/projectSchema.js";
import Student from "../models/studentSchema.js";
import Faculty from "../models/facultySchema.js";
import Panel from "../models/panelSchema.js";
import DepartmentConfig from "../models/departmentConfigSchema.js";
import { logger } from "../utils/logger.js";

export class ProjectService {
  /**
   * Get projects with filters
   */
  static async getProjectList(filters = {}) {
    const query = {};

    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.semester) query.semester = filters.semester;
    if (filters.school) query.school = filters.school;
    if (filters.department) query.department = filters.department;
    if (filters.status) query.status = filters.status;
    if (filters.guideFaculty) query.guideFaculty = filters.guideFaculty;
    if (filters.panel) query.panel = filters.panel;

    return await Project.find(query)
      .populate("students", "regNo name emailId")
      .populate("guideFaculty", "name employeeId emailId")
      .populate("panel", "panelName members venue")
      .lean();
  }

  /**
   * Get guide projects
   */
  static async getGuideProjects(filters = {}) {
    const query = {};
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.semester) query.semester = filters.semester;
    if (filters.school) query.school = filters.school;
    if (filters.department) query.department = filters.department;

    const projects = await Project.find(query)
      .populate("students", "regNo name")
      .populate("guideFaculty", "name employeeId emailId school department")
      .lean();

    // Group by guide
    const grouped = {};
    projects.forEach((project) => {
      if (!project.guideFaculty) return;

      const guideId = project.guideFaculty._id.toString();
      if (!grouped[guideId]) {
        grouped[guideId] = {
          faculty: project.guideFaculty,
          guidedProjects: [],
        };
      }
      grouped[guideId].guidedProjects.push(project);
    });

    return Object.values(grouped);
  }

  /**
   * Get panel projects
   */
  static async getPanelProjects(filters = {}) {
    const query = {};
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.semester) query.semester = filters.semester;
    if (filters.school) query.school = filters.school;
    if (filters.department) query.department = filters.department;

    const projects = await Project.find(query)
      .populate("students", "regNo name emailId")
      .populate("guideFaculty", "name employeeId emailId")
      .populate("panel")
      .populate("panel.members.faculty", "name employeeId emailId")
      .lean();

    // Group by panel
    const grouped = {};
    projects.forEach((project) => {
      if (!project.panel) return;

      const panelId = project.panel._id.toString();
      if (!grouped[panelId]) {
        grouped[panelId] = {
          panelId: project.panel._id,
          members: project.panel.members,
          venue: project.panel.venue,
          school: project.panel.school,
          department: project.panel.department,
          projects: [],
        };
      }
      grouped[panelId].projects.push(project);
    });

    return Object.values(grouped);
  }

  /**
   * Get faculty projects (guide + panel)
   */
  static async getFacultyProjects(facultyId) {
    // Guide projects
    const guideProjects = await Project.find({
      guideFaculty: facultyId,
      status: "active",
    })
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

    // Panel projects
    const panels = await Panel.find({
      "members.faculty": facultyId,
      isActive: true,
    }).select("_id");

    const panelIds = panels.map((p) => p._id);

    const panelProjects = await Project.find({
      panel: { $in: panelIds },
      status: "active",
    })
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

    return {
      guideProjects,
      panelProjects,
    };
  }

  /**
   * Get students assigned to faculty
   */
  static async getFacultyStudents(facultyId) {
    const guideProjects = await Project.find({
      guideFaculty: facultyId,
      status: "active",
    }).select("students");

    const guideStudentIds = guideProjects.flatMap((p) => p.students);

    const panels = await Panel.find({
      "members.faculty": facultyId,
      isActive: true,
    }).select("_id");

    const panelIds = panels.map((p) => p._id);

    const panelProjects = await Project.find({
      panel: { $in: panelIds },
      status: "active",
    }).select("students");

    const panelStudentIds = panelProjects.flatMap((p) => p.students);

    const allStudentIds = [
      ...new Set(
        [...guideStudentIds, ...panelStudentIds].map((id) => id.toString()),
      ),
    ];

    return await Student.find({
      _id: { $in: allStudentIds },
      isActive: true,
    })
      .select("regNo name emailId reviews PAT")
      .lean();
  }

  /**
   * Get project by ID with full population
   */
  static async getProjectById(projectId) {
    const project = await Project.findById(projectId)
      .populate("students", "name regNo emailId reviews approvals PAT")
      .populate("guideFaculty", "name employeeId emailId")
      .populate({
        path: "panel",
        populate: {
          path: "members.faculty",
          select: "name employeeId",
        },
      })
      .lean();

    return project;
  }

  /**
   * Get projects by student ID
   */
  static async getProjectsByStudent(studentId) {
    return await Project.find({ students: studentId })
      .populate("students", "name regNo emailId")
      .populate("guideFaculty", "name employeeId")
      .populate("panel")
      .lean();
  }

  /**
   * Get projects by guide faculty ID
   */
  static async getProjectsByGuide(facultyId) {
    return await Project.find({
      guideFaculty: facultyId,
      status: "active",
    })
      .populate("students", "name regNo emailId")
      .populate("guideFaculty", "name employeeId emailId")
      .populate("panel")
      .lean();
  }

  /**
   * Get projects by panel ID
   */
  static async getProjectsByPanel(panelId) {
    return await Project.find({
      panel: panelId,
      status: "active",
    })
      .populate("students", "name regNo emailId")
      .populate("guideFaculty", "name employeeId emailId")
      .populate("panel")
      .lean();
  }

  /**
   * Create single project
   */
  static async createProject(data, createdBy) {
    const {
      name,
      students,
      guideFacultyEmpId,
      academicYear,
      school,
      department,
      specialization,
      type,
    } = data;

    // Validate guide faculty exists
    const guide = await Faculty.findOne({ employeeId: guideFacultyEmpId });
    if (!guide) {
      throw new Error(`Guide faculty with ID ${guideFacultyEmpId} not found.`);
    }

    // Validate specialization match
    if (guide.specialization !== specialization) {
      throw new Error(
        `Specialization mismatch. Guide specializes in ${guide.specialization}, but project requires ${specialization}.`,
      );
    }

    // Check team size limits
    const config = await DepartmentConfig.findOne({
      academicYear,
      school,
      department,
    });

    if (config) {
      if (students.length < config.minTeamSize) {
        throw new Error(
          `Team size (${students.length}) is below minimum (${config.minTeamSize}).`,
        );
      }
      if (students.length > config.maxTeamSize) {
        throw new Error(
          `Team size (${students.length}) exceeds maximum (${config.maxTeamSize}).`,
        );
      }
    }

    // Check max projects per guide
    if (config?.maxProjectsPerGuide) {
      const guideProjectCount = await Project.countDocuments({
        guideFaculty: guide._id,
        status: "active",
      });

      if (guideProjectCount >= config.maxProjectsPerGuide) {
        throw new Error(
          `Guide already has maximum ${config.maxProjectsPerGuide} projects assigned.`,
        );
      }
    }

    // Create or update students
    const studentIds = [];
    for (const studentData of students) {
      let student = await Student.findOne({ regNo: studentData.regNo });

      if (student) {
        // Update existing student
        Object.assign(student, studentData);
        await student.save();
      } else {
        // Create new student
        student = new Student({
          ...studentData,
          academicYear,
          school,
          department,
        });
        await student.save();

        logger.info("student_created_with_project", {
          studentId: student._id,
          regNo: student.regNo,
        });
      }

      studentIds.push(student._id);
    }

    // Create project
    const project = new Project({
      name,
      students: studentIds,
      guideFaculty: guide._id,
      academicYear,
      school,
      department,
      specialization,
      type,
      teamSize: students.length,
      status: "active",
      history: [
        {
          action: "created",
          performedBy: createdBy,
          performedAt: new Date(),
        },
      ],
    });

    await project.save();

    logger.info("project_created", {
      projectId: project._id,
      guide: guide.employeeId,
      studentsCount: students.length,
    });

    return project;
  }

  /**
   * Create multiple projects (bulk)
   */
  static async createProjectsBulk(data, createdBy) {
    const { school, department, academicYear, guideFacultyEmpId, projects } =
      data;

    const results = {
      created: 0,
      errors: 0,
      errorDetails: [],
      projectIds: [],
    };

    for (const projectData of projects) {
      try {
        const project = await this.createProject(
          {
            ...projectData,
            school,
            department,
            academicYear,
            guideFacultyEmpId:
              projectData.guideFacultyEmpId || guideFacultyEmpId,
          },
          createdBy,
        );

        results.created++;
        results.projectIds.push(project._id);
      } catch (error) {
        results.errors++;
        results.errorDetails.push({
          projectName: projectData.name,
          error: error.message,
        });

        logger.error("bulk_project_creation_error", {
          projectName: projectData.name,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Update project details
   */
  static async updateProjectDetails(
    projectId,
    projectUpdates,
    studentUpdates,
    updatedBy,
  ) {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new Error("Project not found.");
    }

    // Update project fields
    if (projectUpdates) {
      Object.assign(project, projectUpdates);

      project.history = project.history || [];
      project.history.push({
        action: "updated",
        changes: Object.keys(projectUpdates),
        performedBy: updatedBy,
        performedAt: new Date(),
      });
    }

    await project.save();

    // Update students
    let updatedStudents = 0;
    if (studentUpdates && Array.isArray(studentUpdates)) {
      for (const studentData of studentUpdates) {
        const student = await Student.findOne({ regNo: studentData.regNo });

        if (student) {
          Object.assign(student, studentData);
          await student.save();
          updatedStudents++;

          logger.info("student_updated_with_project", {
            studentId: student._id,
            regNo: student.regNo,
            projectId,
          });
        }
      }
    }

    logger.info("project_details_updated", {
      projectId,
      updatedBy,
      studentsUpdated: updatedStudents,
    });

    return {
      project,
      studentsUpdated: updatedStudents,
    };
  }

  /**
   * Delete project
   */
  static async deleteProject(projectId, userId) {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    // Check if project can be deleted (add your authorization logic here)
    // For example: only guide or admin can delete
    // if (project.guideFaculty.toString() !== userId.toString()) {
    //   throw new Error("Unauthorized");
    // }

    // Mark as inactive instead of hard delete (recommended)
    project.status = "inactive";
    project.history = project.history || [];
    project.history.push({
      action: "deleted",
      performedBy: userId,
      performedAt: new Date(),
    });

    await project.save();

    logger.info("project_deleted", {
      projectId,
      deletedBy: userId,
    });

    return true;
  }

  /**
   * Assign panel to project
   */
  static async assignPanelToProject(projectId, panelId, assignedBy) {
    const [project, panel] = await Promise.all([
      Project.findById(projectId),
      Panel.findById(panelId),
    ]);

    if (!project) {
      throw new Error("Project not found.");
    }

    if (!panel) {
      throw new Error("Panel not found.");
    }

    // Check if panel belongs to same context
    if (
      project.academicYear !== panel.academicYear ||
      project.school !== panel.school ||
      project.department !== panel.department
    ) {
      throw new Error(
        "Panel must belong to the same academic context as the project.",
      );
    }

    // Check max projects per panel
    const config = await DepartmentConfig.findOne({
      academicYear: project.academicYear,
      school: project.school,
      department: project.department,
    });

    if (config?.maxProjectsPerPanel) {
      const panelProjectCount = await Project.countDocuments({
        panel: panelId,
        status: "active",
      });

      if (panelProjectCount >= config.maxProjectsPerPanel) {
        throw new Error(
          `Panel already has maximum ${config.maxProjectsPerPanel} projects assigned.`,
        );
      }
    }

    project.panel = panelId;
    project.history = project.history || [];
    project.history.push({
      action: "panel_assigned",
      panel: panelId,
      performedBy: assignedBy,
      performedAt: new Date(),
    });

    await project.save();

    logger.info("panel_assigned_to_project", {
      projectId,
      panelId,
      assignedBy,
    });

    return project;
  }

  /**
   * Mark project as best project
   */
  static async markAsBestProject(projectId, markedBy) {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new Error("Project not found.");
    }

    project.isBestProject = !project.isBestProject;
    project.history = project.history || [];
    project.history.push({
      action: project.isBestProject
        ? "marked_as_best_project"
        : "unmarked_as_best_project",
      performedBy: markedBy,
      performedAt: new Date(),
    });

    await project.save();

    logger.info(
      project.isBestProject ? "project_marked_best" : "project_unmarked_best",
      {
        projectId,
        markedBy,
      },
    );

    return project;
  }
}
