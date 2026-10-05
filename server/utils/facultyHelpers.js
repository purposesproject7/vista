import MarkingSchema from "../models/markingSchema.js";
import { resolveReview, reviewNamesMatch } from "./reviewIdentity.js";
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
export async function getFacultyTypeForProject(facultyId, projectId, reviewType = null, requestedRole = null) {
  const project = await Project.findById(projectId).populate("panel").populate("reviewPanels.panel");
  if (!project) throw new Error("Project not found.");
  const faculty = await Faculty.findById(facultyId).select("employeeId");
  const id = value => String(value?._id || value || "");
  const belongs = panel => panel?.isActive !== false && (
    panel?.members?.some(member => id(member.faculty) === id(facultyId)) ||
    (faculty?.employeeId && panel?.facultyEmployeeIds?.some(employee => String(employee) === faculty.employeeId))
  );
  const isGuide = id(project.guideFaculty) === id(facultyId);
  let review;
  if (reviewType) {
    const schema = await MarkingSchema.findOne({ school: project.school, program: project.program, academicYear: project.academicYear }).lean();
    if (schema) {
      review = resolveReview(schema.reviews, reviewType);
      if (!review) throw new Error("Review is not configured for this project's academic context.");
      if (review.isActive === false) throw new Error("This review is inactive.");
    }
  }
  const canonicalReviewType = review?.reviewName || reviewType;
  const override = canonicalReviewType && project.reviewPanels?.find(rp => reviewNamesMatch(rp.reviewType, canonicalReviewType));
  // A review-specific panel replaces the main panel for this review.
  const isPanel = reviewType ? belongs(override ? override.panel : project.panel) :
    belongs(project.panel) || project.reviewPanels?.some(rp => belongs(rp.panel));
  const allowedGuide = isGuide && (!review || ['guide', 'both'].includes(review.facultyType));
  const allowedPanel = isPanel && (!review || ['panel', 'both'].includes(review.facultyType));
  if (requestedRole && !['guide', 'panel'].includes(requestedRole)) throw new Error("Choose guide or panel evaluation mode.");
  const facultyType = requestedRole || (allowedGuide ? 'guide' : allowedPanel ? 'panel' : null);
  if ((facultyType === 'guide' && !allowedGuide) || (facultyType === 'panel' && !allowedPanel) || !facultyType) {
    throw new Error("You are not assigned to evaluate this review in the selected role.");
  }
  return { facultyType, project, review, reviewType: canonicalReviewType };
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
  return own !== "" && [user.school, ...(user.schoolAliases || [])].some(value => String(value).trim().toLowerCase() === String(school ?? "").trim().toLowerCase());
}

export function isMasterAdmin(user) {
  return String(user?.employeeId ?? "").trim().toUpperCase() === masterAdminId();
}
