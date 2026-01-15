import BroadcastMessage from "../models/broadcastMessageSchema.js";
import Faculty from "../models/facultySchema.js";
import ProjectCoordinator from "../models/projectCoordinatorSchema.js";
import { logger } from "../utils/logger.js";

/**
 * Block faculty and project coordinator API access when an active blocking broadcast exists
 */
export const broadcastBlockMiddleware = async (req, res, next) => {
  try {
    // Allow fetching broadcasts even when blocked
    if (req.path?.includes("/broadcasts") || req.path?.includes("/auth")) {
      return next();
    }

    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!userId) {
      return next();
    }

    // Only block faculty and project_coordinator roles
    if (userRole !== "faculty" && userRole !== "project_coordinator") {
      return next();
    }

    let facultySchools = [];
    let facultyPrograms = [];

    // Get school and program based on user type
    if (userRole === "project_coordinator") {
      // For project coordinators, get their coordinator record
      const coordinator = await ProjectCoordinator.findOne({ faculty: userId })
        .select("school program")
        .lean();

      if (!coordinator) {
        return next();
      }

      facultySchools = [coordinator.school].filter(Boolean);
      facultyPrograms = [coordinator.program].filter(Boolean);
    } else {
      // For faculty, get their faculty record
      const faculty = await Faculty.findById(userId)
        .select("school program")
        .lean();

      if (!faculty) {
        return next();
      }

      facultySchools = Array.isArray(faculty.school)
        ? faculty.school.filter(Boolean)
        : [];

      facultyPrograms = Array.isArray(faculty.program)
        ? faculty.program.filter(Boolean)
        : [];
    }

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
            { targetPrograms: { $size: 0 } },
            { targetPrograms: { $in: facultyPrograms } },
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
        userId,
        userRole,
        broadcastId: blockingBroadcast._id,
      });

      return res.status(403).json({
        success: false,
        message: "Access temporarily blocked by administrator.",
        blocked: true,
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
