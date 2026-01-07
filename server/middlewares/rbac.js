import Faculty from "../models/facultySchema.js";
import ProjectCoordinator from "../models/projectCoordinatorSchema.js";
import ProgramConfig from "../models/programConfigSchema.js";

/**
 * Require specific role
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Admin has access to everything
    if (req.user.role === "admin") {
      return next();
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(", ")}`,
      });
    }

    next();
  };
}

/**
 * Check if user is a project coordinator
 */
export async function requireProjectCoordinator(req, res, next) {
  try {
    // Check if faculty has coordinator flag
    if (!req.user.isProjectCoordinator) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not a project coordinator.",
      });
    }

    // Get coordinator assignment(s)
    const coordinators = await ProjectCoordinator.find({
      faculty: req.user._id,
      isActive: true,
    }).populate("faculty", "name emailId employeeId");

    if (coordinators.length === 0) {
      return res.status(403).json({
        success: false,
        message: "No active coordinator assignments found.",
      });
    }

    // Attach to request
    req.coordinators = coordinators;

    // Apply ProgramConfig deadlines dynamically
    for (const coordinator of coordinators) {
      const config = await ProgramConfig.findOne({
        academicYear: coordinator.academicYear,
        school: coordinator.school,
        program: coordinator.program,
      }).lean();

      if (config && config.featureLocks) {
        config.featureLocks.forEach((lock) => {
          const featureName = lock.featureName;
          const deadline = lock.deadline;

          // Check if coordinator has this permission group
          if (
            coordinator.permissions[featureName] &&
            coordinator.permissions[featureName].enabled
          ) {
            // Apply deadline from config to coordinator's permission
            coordinator.permissions[featureName].deadline = deadline;
          }
        });
      }
    }

    // If single assignment, attach directly
    if (coordinators.length === 1) {
      req.coordinator = coordinators[0];
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Validate coordinator context
 */
export function validateCoordinatorContext(req, res, next) {
  try {
    const { academicYear, school, program } =
      req.body || req.query || req.params;

    if (!academicYear || !school || !program) {
      return res.status(400).json({
        success: false,
        message: "academicYear, school, and program are required",
      });
    }

    // Find matching coordinator assignment
    const coordinator = req.coordinators.find(
      (c) =>
        c.academicYear === academicYear &&
        c.school === school &&
        c.program === program
    );

    if (!coordinator) {
      return res.status(403).json({
        success: false,
        message:
          "You are not assigned as coordinator for this academic context",
      });
    }

    req.coordinator = coordinator;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Check coordinator permission
 */
export function checkCoordinatorPermission(permissionName) {
  return (req, res, next) => {
    try {
      const coordinator = req.coordinator;

      if (!coordinator) {
        return res.status(403).json({
          success: false,
          message: "Coordinator context not found",
        });
      }

      const permission = coordinator.permissions[permissionName];

      if (!permission || !permission.enabled) {
        return res.status(403).json({
          success: false,
          message: `Permission denied: ${permissionName}`,
        });
      }

      // Check deadline
      if (permission.deadline) {
        const now = new Date();
        const deadline = new Date(permission.deadline);

        if (now > deadline) {
          return res.status(403).json({
            success: false,
            message: `Deadline has passed. Deadline was ${deadline.toISOString()}`,
          });
        }
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
}
