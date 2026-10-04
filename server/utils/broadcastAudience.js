import BroadcastMessage from "../models/broadcastMessageSchema.js";
import Faculty from "../models/facultySchema.js";
import Student from "../models/studentSchema.js";
import ProjectCoordinator from "../models/projectCoordinatorSchema.js";
import { logger } from "./logger.js";

// Faculty.school is a single string and Faculty.program an array; accept
// either shape so a school-targeted broadcast actually matches.
const list = (v) => (Array.isArray(v) ? v : [v]).filter(Boolean);

/**
 * Who a user is for matching broadcast audiences: faculty or student, plus
 * their schools/programs (and academic year for students). Null when the user
 * has no such record.
 */
export async function audienceOf(userId, role) {
  if (role === "student") {
    const s = await Student.findById(userId).select("school program academicYear").lean();
    return s ? { students: true, schools: list(s.school), programs: list(s.program), years: list(s.academicYear) } : null;
  }
  if (role === "project_coordinator") {
    const c = await ProjectCoordinator.findOne({ faculty: userId }).select("school program").lean();
    return c ? { schools: list(c.school), programs: list(c.program) } : null;
  }
  const f = await Faculty.findById(userId).select("school program").lean();
  return f ? { schools: list(f.school), programs: list(f.program) } : null;
}

/** Active, unexpired broadcasts addressed to this audience (empty target = everyone). */
export async function activeBroadcastsFilter({ students, schools, programs, years }) {
  const now = new Date();
  try {
    await BroadcastMessage.updateMany(
      { isActive: true, expiresAt: { $lte: now } },
      { $set: { isActive: false } }
    );
  } catch (error) {
    logger.warn("broadcast_auto_deactivate_failed", { error: error.message });
  }
  const and = [
    // Missing audience = saved before students could be targeted = faculty.
    students ? { audience: { $in: ["students", "all"] } } : { audience: { $ne: "students" } },
    { $or: [{ targetSchools: { $size: 0 } }, { targetSchools: { $in: schools } }] },
    { $or: [{ targetPrograms: { $size: 0 } }, { targetPrograms: { $in: programs } }] },
  ];
  // Only students carry an academic year; faculty ignore the year target.
  if (years) {
    and.push({ $or: [{ targetAcademicYears: { $size: 0 } }, { targetAcademicYears: { $in: years } }] });
  }
  return { isActive: true, expiresAt: { $gt: now }, $and: and };
}
