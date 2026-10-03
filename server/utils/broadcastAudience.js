import BroadcastMessage from "../models/broadcastMessageSchema.js";
import Faculty from "../models/facultySchema.js";
import ProjectCoordinator from "../models/projectCoordinatorSchema.js";
import { logger } from "./logger.js";

// Faculty.school is a single string and Faculty.program an array; accept
// either shape so a school-targeted broadcast actually matches.
const list = (v) => (Array.isArray(v) ? v : [v]).filter(Boolean);

/**
 * Schools/programs a faculty or project coordinator belongs to, for matching
 * broadcast audiences. Null when the user has no such record.
 */
export async function audienceOf(userId, role) {
  if (role === "project_coordinator") {
    const c = await ProjectCoordinator.findOne({ faculty: userId }).select("school program").lean();
    return c ? { schools: list(c.school), programs: list(c.program) } : null;
  }
  const f = await Faculty.findById(userId).select("school program").lean();
  return f ? { schools: list(f.school), programs: list(f.program) } : null;
}

/** Active, unexpired broadcasts addressed to this audience (empty target = everyone). */
export async function activeBroadcastsFilter({ schools, programs }) {
  const now = new Date();
  try {
    await BroadcastMessage.updateMany(
      { isActive: true, expiresAt: { $lte: now } },
      { $set: { isActive: false } }
    );
  } catch (error) {
    logger.warn("broadcast_auto_deactivate_failed", { error: error.message });
  }
  return {
    isActive: true,
    expiresAt: { $gt: now },
    $and: [
      { $or: [{ targetSchools: { $size: 0 } }, { targetSchools: { $in: schools } }] },
      { $or: [{ targetPrograms: { $size: 0 } }, { targetPrograms: { $in: programs } }] },
    ],
  };
}
