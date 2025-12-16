import Panel from "../models/panelSchema.js";
import Faculty from "../models/facultySchema.js";
import Project from "../models/projectSchema.js";
import DepartmentConfig from "../models/departmentConfigSchema.js";
import { logger } from "../utils/logger.js";

export class PanelService {
  /**
   * Validate panel members
   */
  static async validatePanelMembers(
    memberEmployeeIds,
    academicYear,
    school,
    department,
  ) {
    // Check for duplicates
    if (new Set(memberEmployeeIds).size !== memberEmployeeIds.length) {
      throw new Error("Duplicate faculty members in panel.");
    }

    // Fetch faculties
    const faculties = await Faculty.find({
      employeeId: { $in: memberEmployeeIds },
    });

    if (faculties.length !== memberEmployeeIds.length) {
      const foundIds = faculties.map((f) => f.employeeId);
      const missing = memberEmployeeIds.filter((id) => !foundIds.includes(id));
      throw new Error(`Faculty not found: ${missing.join(", ")}`);
    }

    // Validate all faculties are from the same school and department
    const invalidMembers = faculties.filter(
      (f) => f.school !== school || f.department !== department,
    );

    if (invalidMembers.length > 0) {
      throw new Error(
        `All panel members must be from ${school} - ${department}. Invalid: ${invalidMembers.map((f) => f.employeeId).join(", ")}`,
      );
    }

    // Validate panel size
    const config = await DepartmentConfig.findOne({
      academicYear,
      school,
      department,
    });

    if (config) {
      if (
        faculties.length < config.minPanelSize ||
        faculties.length > config.maxPanelSize
      ) {
        throw new Error(
          `Panel size must be between ${config.minPanelSize} and ${config.maxPanelSize}.`,
        );
      }
    }

    return faculties;
  }

  /**
   * Create panel
   */
  static async createPanel(data, createdBy = null) {
    const {
      memberEmployeeIds,
      academicYear,
      school,
      department,
      venue,
      dateTime,
      specializations = [],
    } = data;

    // Validate members
    const faculties = await this.validatePanelMembers(
      memberEmployeeIds,
      academicYear,
      school,
      department,
    );

    // Build panel members array
    const members = faculties.map((faculty, index) => ({
      faculty: faculty._id,
      role: index === 0 ? "chair" : "member",
      addedAt: new Date(),
    }));

    // Get config for maxProjects
    const config = await DepartmentConfig.findOne({
      academicYear,
      school,
      department,
    });

    const panel = new Panel({
      panelName: `Panel-${school}-${department}-${Date.now()}`,
      members,
      venue: venue || "TBD",
      dateTime: dateTime || null,
      academicYear,
      school,
      department,
      specializations: specializations.length > 0 ? specializations : [],
      maxProjects: config?.maxProjectsPerPanel || 10,
      assignedProjectsCount: 0,
      isActive: true,
    });

    await panel.save();

    if (createdBy) {
      logger.info("panel_created", {
        panelId: panel._id,
        memberCount: members.length,
        academicYear,
        school,
        department,
        createdBy,
      });
    }

    return panel;
  }

  /**
   * Get panels with filters
   */
  static async getPanelList(filters = {}) {
    const query = { isActive: true };

    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.school) query.school = filters.school;
    if (filters.department) query.department = filters.department;
    if (filters.specialization) {
      query.specializations = { $in: [filters.specialization] };
    }

    return await Panel.find(query)
      .populate("members.faculty", "name employeeId emailId specialization")
      .lean();
  }

  /**
   * ✅ NEW: Update panel (generic update method)
   */
  static async updatePanel(id, updates, updatedBy = null) {
    const panel = await Panel.findById(id);

    if (!panel) {
      throw new Error("Panel not found.");
    }

    // Allowed fields to update
    const allowedFields = [
      "panelName",
      "venue",
      "dateTime",
      "specializations",
      "maxProjects",
      "isActive",
    ];

    const validUpdates = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        validUpdates[field] = updates[field];
      }
    }

    // If memberEmployeeIds provided, update members
    if (updates.memberEmployeeIds) {
      const faculties = await this.validatePanelMembers(
        updates.memberEmployeeIds,
        panel.academicYear,
        panel.school,
        panel.department,
      );

      panel.members = faculties.map((faculty, index) => ({
        faculty: faculty._id,
        role: index === 0 ? "chair" : "member",
        addedAt: new Date(),
      }));
    }

    // Apply other updates
    Object.assign(panel, validUpdates);

    await panel.save();

    if (updatedBy) {
      logger.info("panel_updated", {
        panelId: id,
        updatedFields: Object.keys(validUpdates),
        updatedBy,
      });
    }

    return panel;
  }

  /**
   * Assign panel to project
   */
  static async assignPanelToProject(panelId, projectId, assignedBy = null) {
    const [panel, project] = await Promise.all([
      Panel.findById(panelId),
      Project.findById(projectId),
    ]);

    if (!panel) throw new Error("Panel not found.");
    if (!project) throw new Error("Project not found.");

    // Verify same academic context
    if (
      panel.academicYear !== project.academicYear ||
      panel.school !== project.school ||
      panel.department !== project.department
    ) {
      throw new Error(
        "Panel and project must belong to the same academic context.",
      );
    }

    // Check capacity
    if (panel.assignedProjectsCount >= panel.maxProjects) {
      throw new Error(
        `Panel has reached maximum capacity (${panel.maxProjects} projects).`,
      );
    }

    // Check if project already has this panel
    if (project.panel?.toString() === panelId.toString()) {
      throw new Error("Project already assigned to this panel.");
    }

    // If project had a previous panel, decrement its count
    if (project.panel) {
      await Panel.findByIdAndUpdate(project.panel, {
        $inc: { assignedProjectsCount: -1 },
      });
    }

    // Assign panel
    project.panel = panelId;
    panel.assignedProjectsCount += 1;

    await Promise.all([project.save(), panel.save()]);

    if (assignedBy) {
      logger.info("panel_assigned_to_project", {
        panelId,
        projectId,
        assignedBy,
      });
    }

    return { panel, project };
  }

  /**
   * Update panel members
   */
  static async updatePanelMembers(
    panelId,
    memberEmployeeIds,
    updatedBy = null,
  ) {
    const panel = await Panel.findById(panelId);
    if (!panel) throw new Error("Panel not found.");

    const faculties = await this.validatePanelMembers(
      memberEmployeeIds,
      panel.academicYear,
      panel.school,
      panel.department,
    );

    panel.members = faculties.map((faculty, index) => ({
      faculty: faculty._id,
      role: index === 0 ? "chair" : "member",
      addedAt: new Date(),
    }));

    await panel.save();

    if (updatedBy) {
      logger.info("panel_members_updated", {
        panelId,
        newMemberCount: panel.members.length,
        updatedBy,
      });
    }

    return panel;
  }

  /**
   * Auto-create panels based on available faculty
   */
  static async autoCreatePanels(
    academicYear,
    school,
    department,
    createdBy = null,
  ) {
    const results = {
      panelsCreated: 0,
      errors: 0,
      details: [],
    };

    try {
      // Get department config
      const config = await DepartmentConfig.findOne({
        academicYear,
        school,
        department,
      });

      if (!config) {
        throw new Error(
          `Department configuration not found for ${school} - ${department}`,
        );
      }

      const panelSize = config.minPanelSize || 3;

      // Get available faculty for this department
      const faculties = await Faculty.find({
        school,
        department,
        role: "faculty",
      }).lean();

      if (faculties.length < panelSize) {
        results.errors++;
        results.details.push({
          error: `Not enough faculty. Need ${panelSize}, found ${faculties.length}`,
        });
        return results;
      }

      // Group faculty by specialization
      const bySpecialization = {};
      faculties.forEach((f) => {
        const spec = f.specialization || "General";
        if (!bySpecialization[spec]) bySpecialization[spec] = [];
        bySpecialization[spec].push(f);
      });

      // Create panels for each specialization
      for (const [specialization, specFaculty] of Object.entries(
        bySpecialization,
      )) {
        const panelCount = Math.floor(specFaculty.length / panelSize);

        for (let i = 0; i < panelCount; i++) {
          try {
            const panelMembers = specFaculty.slice(
              i * panelSize,
              (i + 1) * panelSize,
            );

            await this.createPanel(
              {
                memberEmployeeIds: panelMembers.map((f) => f.employeeId),
                academicYear,
                school,
                department,
                specializations: [specialization],
                venue: `Panel Room ${results.panelsCreated + 1}`,
              },
              createdBy,
            );

            results.panelsCreated++;
          } catch (error) {
            results.errors++;
            results.details.push({
              specialization,
              panelIndex: i,
              error: error.message,
            });
          }
        }
      }
    } catch (error) {
      results.errors++;
      results.details.push({
        error: error.message,
      });
    }

    return results;
  }

  /**
   * Auto-assign panels to projects based on specialization
   */
  static async autoAssignPanels(
    academicYear,
    school,
    department,
    assignedBy = null,
  ) {
    const projects = await Project.find({
      academicYear,
      school,
      department,
      panel: null,
      status: "active",
    });

    const results = {
      projectsAssigned: 0,
      errors: 0,
      details: [],
    };

    for (const project of projects) {
      try {
        // Find suitable panel based on specialization
        const panel = await Panel.findOne({
          academicYear,
          school,
          department,
          specializations: { $in: [project.specialization] },
          isActive: true,
          $expr: { $lt: ["$assignedProjectsCount", "$maxProjects"] },
        }).sort({ assignedProjectsCount: 1 });

        // If no specialization match, find any available panel
        const fallbackPanel =
          panel ||
          (await Panel.findOne({
            academicYear,
            school,
            department,
            isActive: true,
            $expr: { $lt: ["$assignedProjectsCount", "$maxProjects"] },
          }).sort({ assignedProjectsCount: 1 }));

        if (!fallbackPanel) {
          results.errors++;
          results.details.push({
            projectId: project._id,
            projectName: project.name,
            error: "No available panel found",
          });
          continue;
        }

        await this.assignPanelToProject(
          fallbackPanel._id,
          project._id,
          assignedBy,
        );
        results.projectsAssigned++;
      } catch (error) {
        results.errors++;
        results.details.push({
          projectId: project._id,
          projectName: project.name,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Delete panel
   */
  static async deletePanel(panelId, deletedBy = null) {
    // Check if panel has assigned projects
    const projectCount = await Project.countDocuments({
      panel: panelId,
      status: "active",
    });

    if (projectCount > 0) {
      throw new Error(
        `Cannot delete panel with ${projectCount} assigned active projects.`,
      );
    }

    const panel = await Panel.findByIdAndDelete(panelId);

    if (!panel) {
      throw new Error("Panel not found.");
    }

    if (deletedBy) {
      logger.info("panel_deleted", {
        panelId,
        deletedBy,
      });
    }

    return panel;
  }

  /**
   * Get panel by ID
   */
  static async getPanelById(panelId) {
    const panel = await Panel.findById(panelId)
      .populate("members.faculty", "name employeeId emailId specialization")
      .lean();

    if (!panel) {
      throw new Error("Panel not found.");
    }

    return panel;
  }
}
