import Panel from "../models/panelSchema.js";
import Faculty from "../models/facultySchema.js";
import Project from "../models/projectSchema.js";
import ProgramConfig from "../models/programConfigSchema.js";
import { logger } from "../utils/logger.js";

export class PanelService {
  /**
   * Validate panel members
   */
  static async validatePanelMembers(
    memberEmployeeIds,
    academicYear,
    school,
    program
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

    // Validate all faculties are from the same school and program
    const invalidMembers = faculties.filter(
      (f) => f.school !== school || f.program !== program
    );

    if (invalidMembers.length > 0) {
      throw new Error(
        `All panel members must be from ${school} - ${program}. Invalid: ${invalidMembers
          .map((f) => f.employeeId)
          .join(", ")}`
      );
    }

    // Validate panel size
    const config = await ProgramConfig.findOne({
      academicYear,
      school,
      program,
    });

    if (config) {
      const minSize = 1; // Enforce min panel size as 1
      if (
        faculties.length < minSize ||
        faculties.length > config.maxPanelSize
      ) {
        throw new Error(
          `Panel size must be between ${minSize} and ${config.maxPanelSize}.`
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
      program,
      venue,
      dateTime,
      specializations = [],
      type = "regular",
    } = data;

    // Validate members
    const faculties = await this.validatePanelMembers(
      memberEmployeeIds,
      academicYear,
      school,
      program
    );

    // Build panel members array
    const members = faculties.map((faculty, index) => ({
      faculty: faculty._id,
      addedAt: new Date(),
    }));

    // Get config for maxProjects
    const config = await ProgramConfig.findOne({
      academicYear,
      school,
      program,
    });

    // Auto-generate panel name if not provided
    let panelName = data.panelName;
    if (!panelName) {
      // "keep the faculties as the panel name"
      const facultyNames = faculties.map((f) => f.name).join(" & ");
      panelName =
        facultyNames.length > 50
          ? facultyNames.substring(0, 47) + "..."
          : facultyNames;
    }

    const panel = new Panel({
      panelName,
      members,
      venue: venue || "TBD",
      dateTime: dateTime || null,
      academicYear,
      school,
      program,
      specializations: specializations.length > 0 ? specializations : [],
      type,
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
        program,
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
    if (filters.program) query.program = filters.program;
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
        panel.department
      );

      panel.members = faculties.map((faculty, index) => ({
        faculty: faculty._id,
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
      panel.program !== project.program
    ) {
      throw new Error(
        "Panel and project must belong to the same academic context."
      );
    }

    // Check capacity
    if (panel.assignedProjectsCount >= panel.maxProjects) {
      throw new Error(
        `Panel has reached maximum capacity (${panel.maxProjects} projects).`
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
    updatedBy = null
  ) {
    const panel = await Panel.findById(panelId);
    if (!panel) throw new Error("Panel not found.");

    const faculties = await this.validatePanelMembers(
      memberEmployeeIds,
      panel.academicYear,
      panel.school,
      panel.department
    );

    panel.members = faculties.map((faculty, index) => ({
      faculty: faculty._id,
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
  // services/panelService.js

  static async autoCreatePanels(
    academicYear,
    school,
    department,
    panelSize = null,
    createdBy = null,
    facultyList = null
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
          `Department configuration not found for ${school} - ${department}`
        );
      }

      // Use requested team size if provided, else config minPanelSize or 2
      let effectivePanelSize = parseInt(panelSize);
      if (isNaN(effectivePanelSize) || effectivePanelSize <= 0) {
        effectivePanelSize = config.minPanelSize || 2;
      }

      // Prepare query
      const query = {
        school,
        program,
        role: "faculty",
      };

      // If specific faculty list provided, filter by it
      if (facultyList && Array.isArray(facultyList) && facultyList.length > 0) {
        query.employeeId = { $in: facultyList };
      }

      // Get available faculty for this program
      let faculties = await Faculty.find(query)
        .sort({ employeeId: 1 }) // sort by employeeId -> lower = more experienced
        .lean();

      if (faculties.length < 2) {
        results.errors++;
        results.details.push({
          error: `Not enough faculty to form even a single panel. Found ${faculties.length}`,
        });
        return results;
      }

      // Group faculty by specialization (default "General")
      const bySpecialization = {};
      faculties.forEach((f) => {
        const spec = f.specialization || "General";
        if (!bySpecialization[spec]) bySpecialization[spec] = [];
        bySpecialization[spec].push(f);
      });

      // For each specialization, create balanced panels
      for (const [specialization, specFacultyRaw] of Object.entries(
        bySpecialization
      )) {
        // Ensure sorted by employeeId within specialization
        const specFaculty = [...specFacultyRaw].sort((a, b) =>
          a.employeeId.localeCompare(b.employeeId)
        );

        const n = specFaculty.length;
        if (n === 0) continue;

        let left = 0;
        let right = n - 1;

        while (left <= right) {
          const panelMembers = [];

          // Build a panel up to effectivePanelSize members
          for (let k = 0; k < effectivePanelSize && left <= right; k++) {
            // Alternate: most experienced (left) then least experienced (right)
            if (k % 2 === 0) {
              panelMembers.push(specFaculty[left]);
              left++;
            } else {
              panelMembers.push(specFaculty[right]);
              right--;
            }
          }

          // Create panel even if last one has < effectivePanelSize members
          try {
            await this.createPanel(
              {
                memberEmployeeIds: panelMembers.map((f) => f.employeeId),
                academicYear,
                school,
                department,
                specializations: [specialization],
                venue: `Panel Room ${results.panelsCreated + 1}`,
              },
              createdBy
            );

            results.panelsCreated++;
          } catch (error) {
            results.errors++;
            results.details.push({
              specialization,
              panelIndex: results.panelsCreated,
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
    buffer = 0,
    assignedBy = null
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

    // 1. Fetch all active panels for this context
    let allPanels = await Panel.find({
      academicYear,
      school,
      program,
      isActive: true,
    })
      .populate("members.faculty", "employeeId")
      .lean();

    // 2. Calculate experience score for each panel
    // Score = Sum of numeric part of employeeIds of members
    // Lower score = More experienced (as per requirement)
    allPanels = allPanels.map((panel) => {
      const score = panel.members.reduce((sum, member) => {
        const empId = member.faculty?.employeeId || "";
        const num = parseInt(empId.replace(/\D/g, "") || "0", 10);
        return sum + num;
      }, 0);
      return { ...panel, experienceScore: score };
    });

    // 3. Sort by experience score (ASC)
    allPanels.sort((a, b) => a.experienceScore - b.experienceScore);

    // 4. Apply buffer - keep top (N - buffer) panels
    const activeCount = Math.max(0, allPanels.length - buffer);
    const activePanels = allPanels.slice(0, activeCount);

    if (activePanels.length === 0) {
      return {
        ...results,
        errors: projects.length,
        details: [{ error: "No panels available after applying buffer." }],
      };
    }

    for (const project of projects) {
      try {
        // Filter candidates from activePanels
        // Must have capacity
        const candidates = activePanels.filter(
          (p) => p.assignedProjectsCount < p.maxProjects
        );

        if (candidates.length === 0) {
          results.errors++;
          results.details.push({
            projectId: project._id,
            projectName: project.name,
            error: "No available panel found (capacity full)",
          });
          continue;
        }

        // Find suitable panel based on specialization
        let suitablePanels = candidates.filter(
          (p) =>
            p.specializations &&
            p.specializations.includes(project.specialization)
        );

        // If no specialization match, use all candidates (fallback)
        if (suitablePanels.length === 0) {
          suitablePanels = candidates;
        }

        // Sort suitable panels:
        // 1. assignedProjectsCount ASC (Load balancing)
        // 2. experienceScore ASC (Prefer experienced for "extra" / tie-breaking)
        suitablePanels.sort((a, b) => {
          if (a.assignedProjectsCount !== b.assignedProjectsCount) {
            return a.assignedProjectsCount - b.assignedProjectsCount;
          }
          return a.experienceScore - b.experienceScore;
        });

        const bestPanel = suitablePanels[0];

        await this.assignPanelToProject(bestPanel._id, project._id, assignedBy);

        // Update in-memory count
        bestPanel.assignedProjectsCount++;

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
        `Cannot delete panel with ${projectCount} assigned active projects.`
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

  /**
   * Reassign project to a different panel
   */
  static async reassignProjectToPanel(
    projectId,
    newPanelId,
    reason,
    performedBy,
    skipSpecializationCheck = false
  ) {
    const [project, newPanel] = await Promise.all([
      Project.findById(projectId),
      Panel.findById(newPanelId),
    ]);

    if (!project) throw new Error("Project not found.");
    if (!newPanel) throw new Error("Target panel not found.");

    // Verify context
    if (
      project.academicYear !== newPanel.academicYear ||
      project.school !== newPanel.school ||
      project.program !== newPanel.program
    ) {
      throw new Error(
        "Project and panel must be in the same academic context."
      );
    }

    // Check capacity
    if (newPanel.assignedProjectsCount >= newPanel.maxProjects) {
      throw new Error(`Target panel is full (Max: ${newPanel.maxProjects}).`);
    }

    // Specialization check
    if (!skipSpecializationCheck) {
      if (
        newPanel.specializations &&
        newPanel.specializations.length > 0 &&
        !newPanel.specializations.includes(project.specialization)
      ) {
        throw new Error(
          `Specialization mismatch. Panel: [${newPanel.specializations.join(
            ", "
          )}], Project: ${project.specialization}`
        );
      }
    }

    const oldPanelId = project.panel;

    // Decrement old panel count
    if (oldPanelId) {
      await Panel.findByIdAndUpdate(oldPanelId, {
        $inc: { assignedProjectsCount: -1 },
      });
    }

    // Increment new panel count
    newPanel.assignedProjectsCount += 1;
    await newPanel.save();

    // Update project
    project.panel = newPanelId;
    project.history = project.history || [];
    project.history.push({
      action: "panel_reassigned",
      previousPanel: oldPanelId,
      newPanel: newPanelId,
      reason,
      performedBy,
      performedAt: new Date(),
    });

    await project.save();

    return { project, oldPanelId, newPanelId };
  }
}
