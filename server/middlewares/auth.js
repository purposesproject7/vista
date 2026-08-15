import jwt from "jsonwebtoken";
import Faculty from "../models/facultySchema.js";
import Student from "../models/studentSchema.js";
import { logger } from "../utils/logger.js";

/**
 * Base JWT authentication middleware
 * Verifies token and attaches user to request
 */
export async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please provide a valid token.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === "student") {
      const student = await Student.findById(decoded.id).select("-password");

      if (!student || !student.isActive) {
        return res.status(401).json({
          success: false,
          message: "Invalid token or inactive account.",
        });
      }

      req.user = {
        _id: student._id,
        name: student.name,
        emailId: student.emailId,
        regNo: student.regNo,
        role: "student",
        school: student.school,
        program: student.program,
        academicYear: student.academicYear,
      };

      return next();
    }

    const faculty = await Faculty.findById(decoded.id).select("-password");

    if (!faculty || !faculty.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid token or inactive account.",
      });
    }

    // Attach to request
    req.user = {
      _id: faculty._id,
      name: faculty.name,
      emailId: faculty.emailId,
      employeeId: faculty.employeeId,
      role: faculty.role,
      school: faculty.school,
      program: faculty.program,
      specialization: faculty.specialization,
      isProjectCoordinator: faculty.isProjectCoordinator, // ✅ Include flag
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}

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
    { expiresIn: process.env.JWT_EXPIRE || "1h" }
  );
};

/**
 * Generate JWT token for student login
 */
export const generateStudentToken = (student) => {
  return jwt.sign(
    {
      id: student._id,
      emailId: student.emailId,
      regNo: student.regNo,
      role: "student",
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "1h" }
  );
};
