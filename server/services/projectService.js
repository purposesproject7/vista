import mongoose from "mongoose";
import Project from "../models/projectSchema.js";
import Student from "../models/studentSchema.js";
import Faculty from "../models/facultySchema.js";
import Panel from "../models/panelSchema.js";
import ProgramConfig from "../models/programConfigSchema.js";
import { logger } from "../utils/logger.js";

export class ProjectService {
  /**
   * Get projects with filters
   */
  static async getProjectList(filters = {}) {
    const query = {};

    // Similar fix for projects to ensure visibility across slight context mismatches
    if (filters.academicYear) delete filters.academicYear;
    if (filters.school) query.school = filters.school;
    if (filters.program) query.program = filters.program;
    if (filters.status) query.status = filters.status;
    if (filters.guideFaculty) query.guideFaculty = filters.guideFaculty;
    if (filters.panel) query.panel = filters.panel;

    return await Project.find(query)
      .populate("students", "regNo name emailId")
      .populate("guideFaculty", "name employeeId emailId")
      .populate({
        path: "panel",
        select: "panelName members venue",
        populate: {
          path: "members.faculty",
          select: "name employeeId emailId",
        },
      })
      .populate({
        path: "reviewPanels.panel",
        select: "panelName members venue",
        populate: {
          path: "members.faculty",
          select: "name employeeId emailId",
        },
      })
      .lean();
  }

  /**
   * Get guide projects
   */
  static async getGuideProjects(filters = {}) {
    const query = {};
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.school) query.school = filters.school;
    if (filters.program) query.program = filters.program;

    const projects = await Project.find(query)
      .populate("students", "regNo name")
      .populate("guideFaculty", "name employeeId emailId school program")
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
    if (filters.school) query.school = filters.school;
    if (filters.program) query.program = filters.program;

    const projects = await Project.find(query)
      .populate("students", "regNo name emailId")
      .populate("guideFaculty", "name employeeId emailId")
      .populate("panel")
      .populate("panel.members.faculty", "name employeeId emailId")
      .populate({
        path: "reviewPanels.panel",
        populate: {
          path: "members.faculty",
          select: "name employeeId emailId"
        }
      })
      .lean();

    // Group by panel
    const grouped = {};
    projects.forEach((project) => {
      // Handle Main Panel
      if (project.panel) {
        const panelId = project.panel._id.toString();
        if (!grouped[panelId]) {
          grouped[panelId] = {
            panelId: project.panel._id,
            members: project.panel.members,
            venue: project.panel.venue,
            school: project.panel.school,
            program: project.panel.program,
            projects: [],
          };
        }
        grouped[panelId].projects.push({ ...project, assignmentType: "Regular" });
      }

      // Handle Review Panels
      if (project.reviewPanels && project.reviewPanels.length > 0) {
        project.reviewPanels.forEach(rp => {
          if (rp.panel) {
            const rpId = rp.panel._id.toString();
            // Initialize group if not exists
            if (!grouped[rpId]) {
              grouped[rpId] = {
                panelId: rp.panel._id,
                members: rp.panel.members,
                venue: rp.panel.venue,
                school: rp.panel.school,
                program: rp.panel.program,
                projects: []
              };
            }

            // Add project if not already present (avoid duplicates if main panel == review panel by ID, but distinct by role)
            const alreadyAdded = grouped[rpId].projects.some(p => p._id.toString() === project._id.toString() && p.assignmentType === "Review");
            if (!alreadyAdded) {
              grouped[rpId].projects.push({ ...project, assignmentType: "Review", reviewType: rp.reviewType });
            }
          }
        });
      }
    });

    return Object.values(grouped);
  }

  /**
   * Get faculty projects (guide + panel)
   */
  static async getFacultyProjects(facultyId, filters = {}) {
    // Base query for filters
    const baseQuery = { status: "active" };
    if (filters.academicYear) baseQuery.academicYear = filters.academicYear;
    if (filters.school) baseQuery.school = filters.school;
    if (filters.program) baseQuery.program = filters.program;

    // Guide projects
    const guideProjects = await Project.find({
      ...baseQuery,
      guideFaculty: facultyId,
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

    // Panel projects (where faculty is in main panel OR review-specific panel)
    let empId = facultyId;
    if (mongoose.Types.ObjectId.isValid(facultyId)) {
      const faculty = await Faculty.findById(facultyId).select("employeeId");
      if (faculty?.employeeId) empId = faculty.employeeId;
    }

    const panels = await Panel.find({
      $or: [
        { "members.faculty": facultyId },
        { facultyEmployeeIds: empId }
      ],
      isActive: true,
    }).select("_id");

    const panelIds = panels.map((p) => p._id);


    const panelProjects = await Project.find({
      ...baseQuery,
      $or: [
        { panel: { $in: panelIds } },
        { "reviewPanels.panel": { $in: panelIds } }
      ]
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
      .populate({
        path: "reviewPanels.panel",
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

    let empId = facultyId;
    if (mongoose.Types.ObjectId.isValid(facultyId)) {
      const faculty = await Faculty.findById(facultyId).select("employeeId");
      if (faculty?.employeeId) empId = faculty.employeeId;
    }

    const panels = await Panel.find({
      $or: [
        { "members.faculty": facultyId },
        { facultyEmployeeIds: empId }
      ],
      isActive: true,
    }).select("_id");

    const panelIds = panels.map((p) => p._id);


    const panelProjects = await Project.find({
      $or: [
        { panel: { $in: panelIds } },
        { "reviewPanels.panel": { $in: panelIds } }
      ],
      status: "active",
    }).select("students");

    const panelStudentIds = panelProjects.flatMap((p) => p.students);

    const allStudentIds = [
      ...new Set(
        [...guideStudentIds, ...panelStudentIds].map((id) => id.toString())
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
      .populate({
        path: "reviewPanels.panel",
        select: "panelName members venue",
        populate: {
          path: "members.faculty",
          select: "name employeeId emailId",
        },
      })
      .lean();

    return project;
  }

  /**
   * Get projects by student ID (Reg No)
   */
  static async getProjectsByStudent(regNo) {
    const student = await Student.findOne({ regNo });
    if (!student) {
      throw new Error(`Student with Reg No ${regNo} not found.`);
    }

    return await Project.find({ students: student._id })
      .populate("students", "name regNo emailId")
      .populate("guideFaculty", "name employeeId")
      .populate("panel")
      .lean();
  }

  /**
   * Get projects by guide faculty ID (Employee ID)
   */
  static async getProjectsByGuide(employeeId) {
    const faculty = await Faculty.findOne({ employeeId });
    if (!faculty) {
      throw new Error(`Faculty with Employee ID ${employeeId} not found.`);
    }

    return await Project.find({
      guideFaculty: faculty._id,
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
   * Create multiple projects
   */
  static async bulkCreateProjects(data, createdBy) {
    let projectsToCreate = [];

    if (Array.isArray(data)) {
      projectsToCreate = data;
    } else if (
      typeof data === "object" &&
      data !== null &&
      Array.isArray(data.projects)
    ) {
      const { school, program, academicYear, guideFacultyEmpId, projects } =
        data;
      projectsToCreate = projects.map((p) => ({
        ...p,
        school: p.school || school,
        program: p.program || program,
        academicYear: p.academicYear || academicYear,
        guideFacultyEmpId: p.guideFacultyEmpId || guideFacultyEmpId,
      }));
    } else {
      throw new Error(
        "Invalid input for bulk creation. Expected array of projects or object with projects array."
      );
    }

    const results = {
      total: projectsToCreate.length,
      created: 0,
      failed: 0,
      errors: [],
      projects: [],
    };

    for (const [index, projectData] of projectsToCreate.entries()) {
      try {
        const project = await this.createProject(projectData, createdBy);
        results.created++;
        results.projects.push(project);
      } catch (error) {
        results.failed++;
        results.errors.push({
          index,
          name: projectData.name,
          error: error.message,
        });
      }
    }

    return results;
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
      program,
      specialization,
      type,
    } = data;

    // Validate guide faculty exists
    const guide = await Faculty.findOne({ employeeId: guideFacultyEmpId });
    if (!guide) {
      throw new Error(`Guide faculty with ID ${guideFacultyEmpId} not found.`);
    }

    // Validate specialization match
    /*
    if (guide.specialization !== specialization) {
      throw new Error(
        `Specialization mismatch. Guide specializes in ${guide.specialization}, but project requires ${specialization}.`,
      );
    }
    */

    // Check team size limits
    const config = await ProgramConfig.findOne({
      academicYear,
      school,
      program,
    });

    if (config) {
      if (students.length < config.minTeamSize) {
        throw new Error(
          `Team size (${students.length}) is below minimum (${config.minTeamSize}).`
        );
      }
      if (students.length > config.maxTeamSize) {
        throw new Error(
          `Team size (${students.length}) exceeds maximum (${config.maxTeamSize}).`
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
          `Guide already has maximum ${config.maxProjectsPerGuide} projects assigned.`
        );
      }
    }

    // Validate and assign students
    const studentIds = [];
    for (const studentData of students) {
      let regNo;

      if (typeof studentData === "string") {
        regNo = studentData;
      } else if (studentData && studentData.regNo) {
        regNo = studentData.regNo;
      } else {
        throw new Error("Invalid student data. Expected Reg No.");
      }

      // 1. Check if student exists
      let student = await Student.findOne({ regNo });

      // 2. If valid object provided and student not found, create them
      if (
        !student &&
        typeof studentData === "object" &&
        studentData.name &&
        studentData.emailId
      ) {
        try {
          const newStudentData = {
            ...studentData,
            academicYear, // Inherit from project context if not in data
            school,
            program,
          };
          // Use StudentService to reuse logic (uploadStudents creates/updates)
          // But for a single student creation, direct creation might be cleaner or calling uploadStudents logic
          // Let's create directly here for clarity, or import StudentService if not already imported.
          // imported StudentService in top of file? No. Need to check imports.
          // Assuming we import StudentService. If not, safe default is direct creation.

          student = new Student({
            ...newStudentData,
            password: `Vit${regNo}@123`, // Default password
          });
          await student.save();

          logger.info("student_auto_created_with_project", {
            regNo: student.regNo,
            projectId: null, // Not assigned yet
          });
        } catch (err) {
          throw new Error(
            `Failed to auto-create student ${regNo}: ${err.message}`
          );
        }
      } else if (!student) {
        // Only string provided or incomplete object, and not found
        throw new Error(`Student with Reg No ${regNo} not found.`);
      }

      // If object provided and student exists, update details?
      // Requirement says: "for the latter we need all the student details needed while creation."
      // It implies we just needed to create if not exists.

      // Check if student is already assigned to an active project
      const existingProject = await Project.findOne({
        students: student._id,
        status: "active",
      });

      if (existingProject) {
        throw new Error(
          `Student ${regNo} is already assigned to project '${existingProject.name}'.`
        );
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
      program,
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
   * Update project details
   */
  static async updateProjectDetails(
    projectId,
    projectUpdates,
    studentUpdates,
    updatedBy
  ) {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new Error("Project not found.");
    }

    // ---------- Extract special update fields ----------
    const addStudents = projectUpdates?.addStudents || [];
    const removeStudents = projectUpdates?.removeStudents || [];

    const guideFacultyEmpId = projectUpdates?.guideFacultyEmpId;
    const panelId = projectUpdates?.panelId;
    const reviewPanelsUpdates = projectUpdates?.reviewPanelsUpdates || [];
    const ignoreSpecialization = projectUpdates?.ignoreSpecialization; // Extract flag
    const assignmentScope = projectUpdates?.assignmentScope || 'main';
    const reviewType = projectUpdates?.reviewType;

    // Remove helper keys so they don't get blindly assigned to project doc
    if (projectUpdates) {
      delete projectUpdates.addStudents;
      delete projectUpdates.removeStudents;
      delete projectUpdates.guideFacultyEmpId;
      delete projectUpdates.panelId;
      delete projectUpdates.reviewPanelsUpdates;
      delete projectUpdates.ignoreSpecialization; // Remove flag
      delete projectUpdates.assignmentScope;
      delete projectUpdates.reviewType;
    }

    // ---------- Update project scalar fields ----------
    if (projectUpdates && Object.keys(projectUpdates).length > 0) {
      Object.assign(project, projectUpdates);

      project.history = project.history || [];
      project.history.push({
        action: "updated",
        changes: Object.keys(projectUpdates),
        performedBy: updatedBy,
        performedAt: new Date(),
      });
    }

    // Ensure arrays exist
    project.students = project.students || [];
    project.history = project.history || [];
    project.reviewPanels = project.reviewPanels || [];

    // ---------- Remove students from project ----------
    if (Array.isArray(removeStudents) && removeStudents.length > 0) {
      const studentsToRemove = await Student.find({
        regNo: { $in: removeStudents },
      }).select("_id regNo");

      const removeIds = new Set(studentsToRemove.map((s) => s._id.toString()));

      project.students = project.students.filter(
        (sid) => !removeIds.has(sid.toString())
      );

      if (studentsToRemove.length > 0) {
        project.history.push({
          action: "team_merged", // or another action name if you prefer
          changes: ["removeStudents"],
          removedRegNos: studentsToRemove.map((s) => s.regNo),
          performedBy: updatedBy,
          performedAt: new Date(),
        });
      }
    }

    // ---------- Add students to project ----------
    let addedStudentsCount = 0;
    if (Array.isArray(addStudents) && addStudents.length > 0) {
      const regNos = addStudents.map((s) =>
        typeof s === "string" ? s : s.regNo
      );

      const existingStudents = await Student.find({
        regNo: { $in: regNos },
      });

      const existingByRegNo = new Map(
        existingStudents.map((s) => [s.regNo, s])
      );

      for (const item of addStudents) {
        const regNo = typeof item === "string" ? item : item.regNo;
        if (!regNo) continue;

        const student = existingByRegNo.get(regNo);
        if (!student) continue;

        const studentIdStr = student._id.toString();
        const alreadyInProject = project.students.some(
          (sid) => sid.toString() === studentIdStr
        );
        if (!alreadyInProject) {
          project.students.push(student._id);
          addedStudentsCount++;
        }

        if (typeof item === "object") {
          Object.assign(student, item);
          await student.save();
        }
      }

      if (addedStudentsCount > 0) {
        project.history.push({
          action: "team_merged",
          changes: ["addStudents"],
          addedCount: addedStudentsCount,
          performedBy: updatedBy,
          performedAt: new Date(),
        });
      }
    }

    // ---------- Guide reassignment ----------
    if (guideFacultyEmpId) {
      const newGuide = await Faculty.findOne({
        employeeId: guideFacultyEmpId.trim().toUpperCase(),
      });

      if (!newGuide) {
        throw new Error("New guide faculty not found.");
      }

      // Ensure same academic context
      // Skip check if ignoreSpecialization is true
      if (
        !ignoreSpecialization &&
        (newGuide.school !== project.school ||
          newGuide.program !== project.program)
      ) {
        throw new Error(
          "Guide must belong to the same school and program as the project."
        );
      }

      const previousGuide = project.guideFaculty;

      if (
        !previousGuide ||
        previousGuide.toString() !== newGuide._id.toString()
      ) {
        project.history.push({
          action: "guide_reassigned",
          previousGuideFaculty: previousGuide || null,
          newGuideFaculty: newGuide._id,
          performedBy: updatedBy,
          performedAt: new Date(),
        });

        project.guideFaculty = newGuide._id;
      }
    }

    // ---------- Main/Review panel reassignment ----------
    if (panelId) {
      if (assignmentScope === 'review') {
        if (!reviewType) {
          throw new Error("Review type is required for review-specific panel assignment.");
        }
        reviewPanelsUpdates.push({ reviewType, panelId });
      } else {
        const newPanel = await Panel.findById(panelId);

        if (!newPanel) {
          throw new Error("Panel not found.");
        }

        // Ensure same academic context
        // Skip check if ignoreSpecialization is true
        if (
          !ignoreSpecialization &&
          (newPanel.academicYear !== project.academicYear ||
            newPanel.school !== project.school ||
            newPanel.program !== project.program)
        ) {
          throw new Error(
            "Panel must belong to the same academic context as the project."
          );
        }

        const previousPanel = project.panel;

        if (
          !previousPanel ||
          previousPanel.toString() !== newPanel._id.toString()
        ) {
          project.history.push({
            action: "panel_reassigned",
            previousPanel: previousPanel || null,
            newPanel: newPanel._id,
            performedBy: updatedBy,
            performedAt: new Date(),
          });

          project.panel = newPanel._id;
        }
      }
    }

    // ---------- Review-specific panel assignments ----------
    if (Array.isArray(reviewPanelsUpdates) && reviewPanelsUpdates.length > 0) {
      for (const update of reviewPanelsUpdates) {
        const { reviewType, panelId: reviewPanelId } = update;
        if (!reviewType || !reviewPanelId) continue;

        const newPanel = await Panel.findById(reviewPanelId);
        if (!newPanel) {
          throw new Error(`Panel not found for reviewType '${reviewType}'.`);
        }

        if (
          !ignoreSpecialization &&
          (newPanel.academicYear !== project.academicYear ||
            newPanel.school !== project.school ||
            newPanel.program !== project.program)
        ) {
          throw new Error(
            `Review panel for '${reviewType}' must be in same academic context as project.`
          );
        }

        const existingIndex = project.reviewPanels.findIndex(
          (rp) => rp.reviewType === reviewType
        );

        let previousPanel = null;

        if (existingIndex >= 0) {
          previousPanel = project.reviewPanels[existingIndex].panel;
          project.reviewPanels[existingIndex].panel = newPanel._id;
          project.reviewPanels[existingIndex].assignedAt = new Date();
          project.reviewPanels[existingIndex].assignedBy = updatedBy;
        } else {
          project.reviewPanels.push({
            reviewType,
            panel: newPanel._id,
            assignedAt: new Date(),
            assignedBy: updatedBy,
          });
        }

        project.history.push({
          action: "review_panel_assigned",
          reviewType,
          previousPanel: previousPanel || null,
          newPanel: newPanel._id,
          performedBy: updatedBy,
          performedAt: new Date(),
        });
      }
    }

    // ---------- Keep teamSize in sync ----------
    project.teamSize = project.students.length;

    // Use validateBeforeSave: false if ignoreSpecialization is true
    // This allows bypassing validation errors (like missing specialization on existing doc)
    await project.save({ validateBeforeSave: !ignoreSpecialization });

    // ---------- Update existing student profiles ----------
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
      studentsAdded: addedStudentsCount,
      ignoreSpecialization,
    });

    return {
      project,
      studentsUpdated: updatedStudents,
      studentsAdded: addedStudentsCount,
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
      project.program !== panel.program
    ) {
      throw new Error(
        "Panel must belong to the same academic context as the project."
      );
    }

    // Check max projects per panel
    const config = await ProgramConfig.findOne({
      academicYear: project.academicYear,
      school: project.school,
      program: project.program,
    });

    if (config?.maxProjectsPerPanel) {
      const panelProjectCount = await Project.countDocuments({
        panel: panelId,
        status: "active",
      });

      if (panelProjectCount >= config.maxProjectsPerPanel) {
        throw new Error(
          `Panel already has maximum ${config.maxProjectsPerPanel} projects assigned.`
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
      }
    );

    return project;
  }

  /**
   * Merge multiple projects into one new project
   */
  static async mergeProjects(projectIds, newName, facultyId) {
    // 1. Validate inputs
    if (!projectIds || !Array.isArray(projectIds) || projectIds.length < 2) {
      throw new Error("At least two projects are required to merge.");
    }

    if (!newName || typeof newName !== "string" || newName.trim().length === 0) {
      throw new Error("New project name is required.");
    }

    // 2. Fetch all projects to be merged
    const projects = await Project.find({
      _id: { $in: projectIds },
      status: "active",
    });

    if (projects.length !== projectIds.length) {
      throw new Error("One or more projects not found or not active.");
    }

    // 3. Verify all projects belong to the same faculty and context (optional but recommended)
    const firstProject = projects[0];
    const commonContext = {
      school: firstProject.school,
      program: firstProject.program,
      academicYear: firstProject.academicYear,
      guide: firstProject.guideFaculty.toString(),
    };

    for (const p of projects) {
      if (p.guideFaculty.toString() !== facultyId.toString()) {
        throw new Error(`Project '${p.name}' does not belong to you.`);
      }
      if (
        p.school !== commonContext.school ||
        p.program !== commonContext.program ||
        p.academicYear !== commonContext.academicYear
      ) {
        throw new Error(
          `Projects must belong to the same School, Program, and Academic Year to be merged.`
        );
      }
    }

    // 4. Collect all students
    let allStudents = [];
    projects.forEach((p) => {
      allStudents = [...allStudents, ...p.students];
    });

    // Deduplicate students (just in case)
    const uniqueStudentIds = [
      ...new Set(allStudents.map((id) => id.toString())),
    ];

    // 5. Create the new Merged Project
    const newProject = new Project({
      name: newName,
      students: uniqueStudentIds,
      guideFaculty: facultyId,
      academicYear: commonContext.academicYear,
      school: commonContext.school,
      program: commonContext.program,
      specialization: firstProject.specialization || 'General', // Fallback for legacy data
      type: firstProject.type || 'software', // Inherit or default
      teamSize: uniqueStudentIds.length,
      status: "active",

      // Inherit panel info from first project to minimize data loss
      panel: firstProject.panel,
      reviewPanels: firstProject.reviewPanels,

      history: [
        {
          action: "created", // Standard creation action
          performedBy: facultyId,
          performedAt: new Date(),
        },
        {
          action: "team_merged",
          performedBy: facultyId,
          performedAt: new Date(),
          reason: `Merged from projects: ${projects.map(p => p.name).join(", ")}`
        },
      ],
    });

    await newProject.save();

    // 6. Update Marks references
    // Marks are linked to `project` and `student`.
    // We need to update existing marks to point to the new project
    const Marks = (await import("../models/marksSchema.js")).default;
    const updateResult = await Marks.updateMany(
      {
        project: { $in: projectIds },
        student: { $in: uniqueStudentIds },
      },
      {
        $set: { project: newProject._id },
      }
    );

    logger.info("marks_moved_on_merge", {
      count: updateResult.modifiedCount,
      newProjectId: newProject._id,
    });

    // 7. Deactivate old projects
    // We use 'team_merged' action which exists in schema
    for (const p of projects) {
      p.status = "archived";
      p.history.push({
        action: "team_merged",
        performedBy: facultyId,
        reason: `Merged into ${newProject.name}`,
        mergedWithProject: newProject._id
      });
      await p.save();
    }

    return newProject;
  }
}
