import BroadcastMessage from "../models/broadcastMessageSchema.js";
import Faculty from "../models/facultySchema.js";
import { logger } from "../utils/logger.js";

/**
 * Block faculty API access when an active blocking broadcast exists
 */
export const broadcastBlockMiddleware = async (req, res, next) => {
  try {
    // Allow fetching broadcasts even when blocked
    if (req.path?.includes("/broadcasts") || req.path?.includes("/auth")) {
      return next();
    }

    const facultyId = req.user?._id;
    if (!facultyId) {
      return next();
    }

    const faculty = await Faculty.findById(facultyId)
      .select("school department")
      .lean();

    if (!faculty) {
      return next();
    }

    // Handle both string and array formats for school and department
    const facultySchools = Array.isArray(faculty.school)
      ? faculty.school.filter(Boolean)
      : faculty.school
        ? [faculty.school]
        : [];

    const facultyDepartments = Array.isArray(faculty.department)
      ? faculty.department.filter(Boolean)
      : faculty.department
        ? [faculty.department]
        : [];

    const now = new Date();

    // Auto-deactivate expired broadcasts
    try {
      await BroadcastMessage.updateMany(
        {
          isActive: true,
          expiresAt: { $lte: now },
        },
        { $set: { isActive: false } },
      );
    } catch (deactivateError) {
      logger.warn("broadcast_auto_deactivate_failed", {
        error: deactivateError.message,
      });
    }

    // Build audience filter
    const audienceFilter = {
      $and: [
        {
          $or: [
            { targetSchools: { $size: 0 } },
            { targetSchools: { $in: facultySchools } },
          ],
        },
        {
          $or: [
            { targetDepartments: { $size: 0 } },
            { targetDepartments: { $in: facultyDepartments } },
          ],
        },
      ],
    };

    const blockingBroadcast = await BroadcastMessage.findOne({
      action: "block",
      isActive: true,
      expiresAt: { $gt: now },
      ...audienceFilter,
    })
      .select("title message priority expiresAt")
      .lean();

    if (blockingBroadcast) {
      logger.info("access_blocked_by_broadcast", {
        facultyId,
        broadcastId: blockingBroadcast._id,
      });

      return res.status(403).json({
        success: false,
        message: "Access temporarily blocked by administrator.",
        broadcast: blockingBroadcast,
      });
    }

    next();
  } catch (error) {
    logger.error("broadcast_block_middleware_error", {
      error: error.message,
    });
    // Don't block access if middleware fails
    next();
  }
};
