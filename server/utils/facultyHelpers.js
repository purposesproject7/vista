import Faculty from "../models/facultySchema.js";
import Project from "../models/projectSchema.js";

/**
 * Extract primary school and department from faculty
 */
export function extractPrimaryContext(faculty) {
  const school = Array.isArray(faculty.school)
    ? faculty.school[0]
    : faculty.school;

  const department = Array.isArray(faculty.department)
    ? faculty.department[0]
    : faculty.department;

  return { school, department };
}

/**
 * Determine faculty type for a project (guide or panel)
 */
export async function getFacultyTypeForProject(facultyId, projectId) {
  const project = await Project.findById(projectId).populate("panel");

  if (!project) {
    throw new Error("Project not found.");
  }

  // Check if guide
  if (project.guideFaculty?.toString() === facultyId.toString()) {
    return { facultyType: "guide", project };
  }

  // Check if panel member
  const isPanelMember = project.panel?.members?.some(
    (m) => m.faculty.toString() === facultyId.toString(),
  );

  if (isPanelMember) {
    return { facultyType: "panel", project };
  }

  throw new Error("You are not assigned to this project.");
}

/**
 * Extract school/department arrays from faculty for broadcast matching
 */
export function getFacultyAudience(faculty) {
  const schools = Array.isArray(faculty.school)
    ? faculty.school
    : [faculty.school];

  const departments = Array.isArray(faculty.department)
    ? faculty.department
    : [faculty.department];

  return { schools, departments };
}
