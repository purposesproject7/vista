import ProgramConfig from "../models/programConfigSchema.js";
import { logger } from "../utils/logger.js";

/**
 * Check if a feature is locked based on department configuration
 * @param {string} featureName - Name of the feature to check
 */
export const checkFeatureLock = (featureName) => {
  return async (req, res, next) => {
    try {
      const { academicYear, school, program } =
        req.body || req.query || req.params;

      if (!academicYear || !school || !program) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required parameters: academicYear, school, program.",
        });
      }

      const config = await ProgramConfig.findOne({
        academicYear,
        school,
        program,
      }).lean();

      if (!config) {
        logger.warn("department_config_not_found", {
          academicYear,
          school,
          program,
        });

        return res.status(404).json({
          success: false,
          message: "Program configuration not found.",
        });
      }

      const featureLock = config.featureLocks?.find(
        (lock) => lock.featureName === featureName
      );

      if (!featureLock) {
        // Feature not configured, allow access
        return next();
      }

      // Check if feature is explicitly locked
      if (featureLock.isLocked) {
        return res.status(403).json({
          success: false,
          message: `Feature '${featureName}' is locked.`,
          featureName,
          isLocked: true,
        });
      }

      // Check deadline
      if (featureLock.deadline && new Date() > new Date(featureLock.deadline)) {
        return res.status(403).json({
          success: false,
          message: `Feature '${featureName}' deadline has passed.`,
          featureName,
          deadline: featureLock.deadline,
        });
      }

      next();
    } catch (error) {
      logger.error("feature_lock_check_error", {
        error: error.message,
        featureName,
      });

      return res.status(500).json({
        success: false,
        message: "Error checking feature lock.",
      });
    }
  };
};

/**
 * Validate team size constraints
 */
export const validateTeamSize = async (req, res, next) => {
  try {
    const { academicYear, school, program, teamSize } = req.body;

    const config = await ProgramConfig.findOne({
      academicYear,
      school,
      program,
    })
      .select("minTeamSize maxTeamSize")
      .lean();

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Program configuration not found.",
      });
    }

    if (teamSize < config.minTeamSize || teamSize > config.maxTeamSize) {
      return res.status(400).json({
        success: false,
        message: `Team size must be between ${config.minTeamSize} and ${config.maxTeamSize}.`,
        minTeamSize: config.minTeamSize,
        maxTeamSize: config.maxTeamSize,
      });
    }

    req.teamSizeConfig = {
      min: config.minTeamSize,
      max: config.maxTeamSize,
    };

    next();
  } catch (error) {
    logger.error("team_size_validation_error", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Error validating team size.",
    });
  }
};

/**
 * Validate panel size constraints
 */
export const validatePanelSize = async (req, res, next) => {
  try {
    const { academicYear, school, program, members } = req.body;

    const config = await ProgramConfig.findOne({
      academicYear,
      school,
      program,
    })
      .select("minPanelSize maxPanelSize")
      .lean();

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Program configuration not found.",
      });
    }

    const panelSize = members?.length || 0;

    if (panelSize < config.minPanelSize || panelSize > config.maxPanelSize) {
      return res.status(400).json({
        success: false,
        message: `Panel size must be between ${config.minPanelSize} and ${config.maxPanelSize}.`,
        minPanelSize: config.minPanelSize,
        maxPanelSize: config.maxPanelSize,
      });
    }

    req.panelSizeConfig = {
      min: config.minPanelSize,
      max: config.maxPanelSize,
    };

    next();
  } catch (error) {
    logger.error("panel_size_validation_error", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Error validating panel size.",
    });
  }
};
