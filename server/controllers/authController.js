import Faculty from "../models/facultySchema.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { logger } from "../utils/logger.js";
import crypto from "crypto";

/**
 * Generate JWT token
 */
const generateToken = (faculty) => {
  return jwt.sign(
    {
      id: faculty._id,
      emailId: faculty.emailId,
      employeeId: faculty.employeeId,
      role: faculty.role,
      isProjectCoordinator: faculty.isProjectCoordinator || false,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" },
  );
};

/**
 * Login - Unified for all roles (admin, faculty, project_coordinator)
 */
export async function login(req, res) {
  try {
    console.log('Login request body:', req.body);
    const { emailId, password, expectedRole } = req.body;

    const faculty = await Faculty.findOne({ emailId }).select("+password");

    if (!faculty) {
      logger.warn("login_failed", {
        emailId,
        reason: "user_not_found",
        ip: req.ip,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, faculty.password);

    if (!isPasswordMatch) {
      logger.warn("login_failed", {
        emailId,
        reason: "invalid_password",
        ip: req.ip,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (expectedRole && faculty.role !== expectedRole) {
      logger.warn("login_failed", {
        emailId,
        reason: "role_mismatch",
        expectedRole,
        actualRole: faculty.role,
        ip: req.ip,
      });

      return res.status(403).json({
        success: false,
        message: `Access denied. Expected role: ${expectedRole}`,
      });
    }

    const token = generateToken(faculty);

    const facultyData = faculty.toObject();
    delete facultyData.password;

    logger.info("login_success", {
      facultyId: faculty._id,
      employeeId: faculty.employeeId,
      role: faculty.role,
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      data: facultyData,
    });
  } catch (error) {
    logger.error("login_error", {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Register - Create new faculty account (can be used by admin or self-registration)
 */
export async function register(req, res) {
  try {
    const {
      name,
      emailId,
      password,
      employeeId,
      phoneNumber,
      role,
      school,
      department,
      specialization,
    } = req.body;

    const existingFaculty = await Faculty.findOne({
      $or: [{ emailId }, { employeeId }, { phoneNumber }],
    });

    if (existingFaculty) {
      return res.status(400).json({
        success: false,
        message:
          "Faculty with this email, employee ID, or phone already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const faculty = new Faculty({
      name,
      emailId,
      password: hashedPassword,
      employeeId,
      phoneNumber,
      role,
      school,
      department,
      specialization: specialization || [],
    });

    await faculty.save();

    const token = generateToken(faculty);

    const facultyData = faculty.toObject();
    delete facultyData.password;

    logger.info("faculty_registered", {
      facultyId: faculty._id,
      employeeId: faculty.employeeId,
      role: faculty.role,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      data: facultyData,
    });
  } catch (error) {
    logger.error("register_error", {
      error: error.message,
      stack: error.stack,
    });

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Forgot Password - Send reset token via email
 */
export async function forgotPassword(req, res) {
  try {
    const { emailId } = req.body;

    const faculty = await Faculty.findOne({ emailId });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    faculty.passwordResetToken = hashedToken;
    faculty.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes

    await faculty.save();

    // In production, send email with reset link
    // await sendEmail({
    //   to: faculty.emailId,
    //   subject: 'Password Reset Request',
    //   html: `Reset your password: ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    // });

    logger.info("password_reset_requested", {
      facultyId: faculty._id,
      emailId: faculty.emailId,
    });

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email.",
      // In development, return token (remove in production)
      ...(process.env.NODE_ENV === "development" && { resetToken }),
    });
  } catch (error) {
    logger.error("forgot_password_error", {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Reset Password - Reset password with token
 */
export async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const faculty = await Faculty.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!faculty) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token.",
      });
    }

    faculty.password = await bcrypt.hash(newPassword, 10);
    faculty.passwordResetToken = undefined;
    faculty.passwordResetExpires = undefined;

    await faculty.save();

    logger.info("password_reset_success", {
      facultyId: faculty._id,
      emailId: faculty.emailId,
    });

    res.status(200).json({
      success: true,
      message:
        "Password reset successful. Please login with your new password.",
    });
  } catch (error) {
    logger.error("reset_password_error", {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Change Password - Change password when logged in
 */
export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    const faculty = await Faculty.findById(req.user._id).select("+password");

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found.",
      });
    }

    const isPasswordMatch = await bcrypt.compare(
      currentPassword,
      faculty.password,
    );

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    faculty.password = await bcrypt.hash(newPassword, 10);
    await faculty.save();

    logger.info("password_changed", {
      facultyId: faculty._id,
      employeeId: faculty.employeeId,
    });

    res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    logger.error("change_password_error", {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Verify Token - Check if token is valid
 */
export async function verifyToken(req, res) {
  try {
    const facultyData = req.user.toObject ? req.user.toObject() : req.user;

    delete facultyData.password;

    res.status(200).json({
      success: true,
      message: "Token is valid.",
      data: facultyData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Logout - Invalidate token (client-side mostly)
 */
export async function logout(req, res) {
  try {
    logger.info("logout", {
      facultyId: req.user._id,
      employeeId: req.user.employeeId,
    });

    res.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Get Profile - Get current user profile
 */
export async function getProfile(req, res) {
  try {
    const faculty = await Faculty.findById(req.user._id).select("-password");

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: faculty,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
