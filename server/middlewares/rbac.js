import ProjectCoordinator from "../models/projectCoordinatorSchema.js";
import { logger } from "../utils/logger.js";

/**
 * Middleware for role-based access control
 * @param {...string} allowedRoles - Roles that can access the route
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn("unauthorized_access_attempt", {
        userId: req.user._id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
      });

      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(" or ")}.`,
      });
    }

    next();
  };
};

/**
 * Verify user is a project coordinator for the specified context
 * Expects academicYear, school, department in query or body
 */
export const requireProjectCoordinator = async (req, res, next) => {
  try {
    const { academicYear, school, department } =
      req.body || req.query || req.params;

    if (!academicYear || !school || !department) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required parameters: academicYear, school, department.",
      });
    }

    const coordinator = await ProjectCoordinator.findOne({
      faculty: req.user._id,
      academicYear,
      school,
      department,
      isActive: true,
    }).lean();

    if (!coordinator) {
      logger.warn("project_coordinator_access_denied", {
        userId: req.user._id,
        academicYear,
        school,
        department,
      });

      return res.status(403).json({
        success: false,
        message: "Not authorized as project coordinator for this context.",
      });
    }

    // Attach coordinator info to request
    req.coordinator = coordinator;
    next();
  } catch (error) {
    logger.error("project_coordinator_check_error", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Error verifying coordinator access.",
    });
  }
};

/**
 * Check specific permission for project coordinator
 * @param {string} permission - Permission key (e.g., 'canCreateFaculty')
 */
export const checkCoordinatorPermission = (permission) => {
  return (req, res, next) => {
    if (!req.coordinator) {
      return res.status(403).json({
        success: false,
        message: "Project coordinator context required.",
      });
    }

    const perm = req.coordinator.permissions?.[permission];

    if (!perm || !perm.enabled) {
      return res.status(403).json({
        success: false,
        message: `Permission '${permission}' is disabled.`,
      });
    }

    // Check deadline if not using global deadline
    if (!perm.useGlobalDeadline && perm.deadline) {
      if (new Date() > new Date(perm.deadline)) {
        return res.status(403).json({
          success: false,
          message: `Permission '${permission}' has expired.`,
          deadline: perm.deadline,
        });
      }
    }

    next();
  };
};

/**
 * Verify primary project coordinator status
 */
export const requirePrimaryCoordinator = (req, res, next) => {
  if (!req.coordinator) {
    return res.status(403).json({
      success: false,
      message: "Project coordinator context required.",
    });
  }

  if (!req.coordinator.isPrimary) {
    return res.status(403).json({
      success: false,
      message: "Only primary project coordinator can perform this action.",
    });
  }

  next();
};
