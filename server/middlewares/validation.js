import { logger } from "../utils/logger.js";
import Faculty from "../models/facultySchema.js";
import Project from "../models/projectSchema.js";

/**
 * Validate required fields in request body
 * @param {string[]} requiredFields - Array of required field names
 */
export const validateRequired = (requiredFields, source = "body") => {
  return (req, res, next) => {
    const data = source === "query" ? req.query : req.body;

    const missingFields = requiredFields.filter((field) => {
      const value = data[field];
      return value === undefined || value === null || value === "";
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields.",
        missingFields,
      });
    }

    next();
  };
};

/**
 * Validate specialization match between faculty and project
 */
export const validateSpecialization = async (req, res, next) => {
  try {
    const { facultyId, projectId } = req.body || req.params;

    if (!facultyId || !projectId) {
      return next();
    }

    const [faculty, project] = await Promise.all([
      Faculty.findById(facultyId).select("specialization").lean(),
      Project.findById(projectId).select("specialization").lean(),
    ]);

    if (!faculty || !project) {
      return res.status(404).json({
        success: false,
        message: "Faculty or project not found.",
      });
    }

    const hasMatchingSpecialization = faculty.specialization?.some(
      (spec) => spec === project.specialization
    );

    if (!hasMatchingSpecialization) {
      return res.status(400).json({
        success: false,
        message: "Faculty specialization does not match project requirements.",
        facultySpecializations: faculty.specialization,
        projectSpecialization: project.specialization,
      });
    }

    next();
  } catch (error) {
    logger.error("specialization_validation_error", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Error validating specialization.",
    });
  }
};

/**
 * Validate academic context consistency
 */
export const validateAcademicContext = (req, res, next) => {
  const { academicYear, school, program } = req.body || req.query;

  if (!academicYear || !school || !program) {
    return res.status(400).json({
      success: false,
      message: "Academic context required: academicYear, school, program.",
    });
  }

  // Validate format
  const yearPattern = /^\d{4}-\d{4}$/;
  if (!yearPattern.test(academicYear)) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid academic year format. Expected: YYYY-YYYY (e.g., 2024-2025).",
    });
  }

  next();
};

/**
 * Sanitize input to prevent injection attacks
 */
export const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== "object" || obj === null) return obj;

    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === "string") {
        // Remove potential MongoDB operators
        if (key.startsWith("$")) {
          delete obj[key];
          return;
        }
        // Basic XSS prevention
        obj[key] = obj[key].replace(
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          ""
        );
      } else if (typeof obj[key] === "object") {
        sanitize(obj[key]);
      }
    });

    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);

  next();
};
