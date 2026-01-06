import BroadcastMessage from "../models/broadcastMessageSchema.js";
import { logger } from "../utils/logger.js";

export class BroadcastService {
  /**
   * Create broadcast message
   */
  static async createBroadcast(data, createdBy) {
    const {
      title,
      message,
      targetSchools = [],
      targetPrograms = [],
      targetAcademicYears = [],
      expiresAt,
      action = "notice",
      priority = "medium",
    } = data;

    if (!message || !expiresAt) {
      throw new Error("Message and expiration date are required.");
    }

    if (!["notice", "block"].includes(action)) {
      throw new Error("Action must be 'notice' or 'block'.");
    }

    if (!["low", "medium", "high", "urgent"].includes(priority)) {
      throw new Error("Priority must be 'low', 'medium', 'high', or 'urgent'.");
    }

    const broadcast = new BroadcastMessage({
      title: title || "",
      message,
      targetSchools,
      targetPrograms,
      targetAcademicYears,
      createdBy: createdBy._id,
      createdByEmployeeId: createdBy.employeeId,
      createdByName: createdBy.name,
      expiresAt: new Date(expiresAt),
      isActive: true,
      action,
      priority,
    });

    await broadcast.save();

    logger.info("broadcast_created", {
      broadcastId: broadcast._id,
      action,
      priority,
      targetSchools: targetSchools.length,
      targetPrograms: targetPrograms.length,
      createdBy: createdBy._id,
    });

    return broadcast;
  }

  /**
   * Get broadcasts with filters
   */
  static async getBroadcasts(filters = {}) {
    const { isActive, action, school, program, academicYear } = filters;

    const query = {};

    if (isActive !== undefined) query.isActive = isActive;
    if (action) query.action = action;

    // Auto-deactivate expired broadcasts
    await BroadcastMessage.updateMany(
      { isActive: true, expiresAt: { $lte: new Date() } },
      { $set: { isActive: false } }
    );

    let broadcasts = await BroadcastMessage.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Filter by audience if specified
    if (school || program || academicYear) {
      broadcasts = broadcasts.filter((b) => {
        const matchSchool =
          !school ||
          b.targetSchools.length === 0 ||
          b.targetSchools.includes(school);
        const matchProg =
          !program ||
          b.targetPrograms.length === 0 ||
          b.targetPrograms.includes(program);
        const matchYear =
          !academicYear ||
          b.targetAcademicYears.length === 0 ||
          b.targetAcademicYears.includes(academicYear);
        return matchSchool && matchProg && matchYear;
      });
    }

    return broadcasts;
  }

  /**
   * Update broadcast
   */
  static async updateBroadcast(id, updates, updatedBy) {
    const broadcast = await BroadcastMessage.findById(id);

    if (!broadcast) {
      throw new Error("Broadcast not found.");
    }

    // Update allowed fields
    if (updates.title !== undefined) broadcast.title = updates.title;
    if (updates.message !== undefined) broadcast.message = updates.message;
    if (updates.targetSchools !== undefined)
      broadcast.targetSchools = updates.targetSchools;
    if (updates.targetPrograms !== undefined)
      broadcast.targetPrograms = updates.targetPrograms;
    if (updates.targetAcademicYears !== undefined)
      broadcast.targetAcademicYears = updates.targetAcademicYears;
    if (updates.expiresAt !== undefined)
      broadcast.expiresAt = new Date(updates.expiresAt);
    if (updates.isActive !== undefined) broadcast.isActive = updates.isActive;
    if (updates.action !== undefined) broadcast.action = updates.action;
    if (updates.priority !== undefined) broadcast.priority = updates.priority;

    await broadcast.save();

    logger.info("broadcast_updated", {
      broadcastId: id,
      updatedBy,
    });

    return broadcast;
  }

  /**
   * Delete broadcast
   */
  static async deleteBroadcast(id, deletedBy) {
    const broadcast = await BroadcastMessage.findByIdAndDelete(id);

    if (!broadcast) {
      throw new Error("Broadcast not found.");
    }

    logger.info("broadcast_deleted", {
      broadcastId: id,
      deletedBy,
    });

    return broadcast;
  }
}
