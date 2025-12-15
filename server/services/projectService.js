import mongoose from "mongoose";
import Project from "../models/projectSchema.js";
import { logger } from "../utils/logger.js";

export class ProjectService {
  /**
   * Get projects with filters
   */
  static async getProjectList(filters = {}) {
    const query = {};

    if (filters.academicYear) query.academicYear = filters.academicYear;
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
    if (filters.school) query.school = filters.school;
    if (filters.department) query.department = filters.department;

    const projects = await Project.find(query)
      .populate("students", "regNo name")
      .populate("guideFaculty", "name employeeId emailId school department")
      .lean();

    // Group by guide
    const grouped = {};
    projects.forEach((project) => {
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
      .populate("guideMarks")
      .populate("panelMarks")
      .lean();
  }

  /**
   * Get project by ID with full population
   */
  static async getProjectById(projectId) {
    const project = await Project.findById(projectId)
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
   * Delete project
   */
  static async deleteProject(projectId, userId) {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    // Authorization check
    if (project.guideFaculty.toString() !== userId.toString()) {
      throw new Error("Unauthorized");
    }

    await Project.findByIdAndDelete(projectId);

    logger.info("project_deleted", {
      projectId,
      deletedBy: userId,
    });

    return true;
  }
}
