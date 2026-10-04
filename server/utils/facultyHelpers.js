import Faculty from "../models/facultySchema.js";
import Project from "../models/projectSchema.js";
import ProgramConfig from "../models/programConfigSchema.js";

/**
 * Throws if the project's program holds teams out of reviews until the guide
 * accepts the title & abstract (admin setting) and it is not accepted yet.
 */
export async function assertReviewable(project) {
  if (project.titleAbstractStatus === "accepted") return;
  const gated = await ProgramConfig.exists({
    academicYear: project.academicYear,
    school: project.school,
    program: project.program,
    requireTitleAbstractApproval: true,
  });
  if (gated) {
    throw new Error(
      "This team's title & abstract must be accepted by the guide before it can be reviewed."
    );
  }
}

/**
 * Extract primary school and program from faculty
 */
export function extractPrimaryContext(faculty) {
  const school = Array.isArray(faculty.school)
    ? faculty.school[0]
    : faculty.school;

  const program = Array.isArray(faculty.program)
    ? faculty.program[0]
    : faculty.program;

  return { school, program };
}

/**
 * Determine faculty type for a project (guide or panel)
 */
export async function getFacultyTypeForProject(
  facultyId,
  projectId,
  reviewType = null
) {
  const project = await Project.findById(projectId)
    .populate("panel")
    .populate({
      path: "reviewPanels.panel",
      populate: { path: "members.faculty", select: "_id" },
    });

  if (!project) {
    throw new Error("Project not found.");
  }

  // Check if guide
  if (project.guideFaculty?.toString() === facultyId.toString()) {
    return { facultyType: "guide", project };
  }

  // Check if panel member (Main Panel)
  const isMainPanelMember = project.panel?.members?.some(
    (m) => m.faculty.toString() === facultyId.toString()
  );

  if (isMainPanelMember) {
    return { facultyType: "panel", project };
  }

  // Check review-specific panels
  if (project.reviewPanels && project.reviewPanels.length > 0) {
    // If reviewType is provided, check specifically for that review
    if (reviewType) {
      const reviewPanelAssignment = project.reviewPanels.find(
        (rp) => rp.reviewType === reviewType
      );

      if (reviewPanelAssignment && reviewPanelAssignment.panel) {
        const isReviewPanelMember =
          reviewPanelAssignment.panel.members?.some(
            (m) => m.faculty._id.toString() === facultyId.toString()
          );

        if (isReviewPanelMember) {
          return { facultyType: "panel", project };
        }
      }
    } else {
      // If no reviewType provided, check if member of ANY assigned review panel
      // (This is useful for general access checks)
      const isAnyReviewPanelMember = project.reviewPanels.some((rp) =>
        rp.panel?.members?.some(
          (m) => m.faculty._id.toString() === facultyId.toString()
        )
      );

      if (isAnyReviewPanelMember) {
        return { facultyType: "panel", project };
      }
    }
  }

  throw new Error("You are not assigned to this project.");
}

/**
 * Employee id of the master ("sudo") admin, who is exempt from school
 * scoping. Normalized the way employee ids are stored (trimmed, uppercased),
 * so "admin001" or a stray space in deploy.conf still matches.
 */
export function masterAdminId() {
  return String(process.env.ADMIN_EMPLOYEE_ID || "ADMIN001").trim().toUpperCase();
}

/** Sudo admin manages every school; any other admin only their own. */
export function canAdminSchool(user, school) {
  if (isMasterAdmin(user)) return true;
  const own = String(user?.school ?? "").trim().toLowerCase();
  return own !== "" && own === String(school ?? "").trim().toLowerCase();
}

export function isMasterAdmin(user) {
  return String(user?.employeeId ?? "").trim().toUpperCase() === masterAdminId();
}
