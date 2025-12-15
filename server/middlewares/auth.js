import jwt from "jsonwebtoken";
import Faculty from "../models/facultySchema.js";
import { logger } from "../utils/logger.js";

/**
 * Base JWT authentication middleware
 * Verifies token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch full faculty details
    const faculty = await Faculty.findById(decoded.id)
      .select("-password")
      .lean();

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found.",
      });
    }

    // Attach user to request
    req.user = {
      ...decoded,
      ...faculty,
      _id: faculty._id,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Token expired.",
      });
    }

    logger.error("auth_middleware_error", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Authentication error.",
    });
  }
};

/**
 * Generate JWT token for login
 */
export const generateToken = (faculty) => {
  return jwt.sign(
    {
      id: faculty._id,
      emailId: faculty.emailId,
      employeeId: faculty.employeeId,
      role: faculty.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
};
