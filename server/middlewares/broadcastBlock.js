import BroadcastMessage from "../models/broadcastMessageSchema.js";
import { audienceOf, activeBroadcastsFilter } from "../utils/broadcastAudience.js";
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

    const audience = await audienceOf(userId, userRole);
    if (!audience) {
      return next();
    }
    const audienceFilter = await activeBroadcastsFilter(audience);

    const blockingBroadcast = await BroadcastMessage.findOne({
      action: "block",
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
