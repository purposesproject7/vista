import Faculty from "../models/facultySchema.js";
import Student from "../models/studentSchema.js";
import ProjectCoordinator from "../models/projectCoordinatorSchema.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { logger } from "../utils/logger.js";
import crypto from "crypto";
import ActivityLogService from "../services/activityLogService.js";

const STUDENT_EMAIL_DOMAIN = "@vitstudent.ac.in";

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
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "1h" }
  );
};

/**
 * Generate JWT token for a student
 */
const generateStudentToken = (student) => {
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

/**
 * Login for a student account (@vitstudent.ac.in)
 */
async function loginStudent(req, res, emailId, password) {
  const student = await Student.findOne({ emailId }).select("+password");

  if (!student) {
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

  if (!student.isActive) {
    return res.status(403).json({
      success: false,
      message: "This account has been deactivated. Contact your coordinator.",
    });
  }

  const isPasswordMatch = await bcrypt.compare(password, student.password);

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

  const token = generateStudentToken(student);

  const studentData = student.toObject();
  delete studentData.password;
  studentData.role = "student";

  logger.info("login_success", {
    studentId: student._id,
    regNo: student.regNo,
    role: "student",
    ip: req.ip,
  });

  res.status(200).json({
    success: true,
    message: "Login successful.",
    token,
    data: studentData,
  });
}

/**
 * Login - Unified for all roles (admin, faculty, project_coordinator, student)
 */
export async function login(req, res) {
  try {
    const { emailId, password, expectedRole } = req.body;

    if (emailId && emailId.toLowerCase().endsWith(STUDENT_EMAIL_DOMAIN)) {
      return loginStudent(req, res, emailId, password);
    }

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

    const masterAdminId = process.env.ADMIN_EMPLOYEE_ID || "ADMIN001";
    facultyData.isMasterAdmin = facultyData.employeeId === masterAdminId;

    logger.info("login_success", {
      facultyId: faculty._id,
      employeeId: faculty.employeeId,
      role: faculty.role,
      isProjectCoordinator: faculty.isProjectCoordinator,
      ip: req.ip,
    });

    // Activity Log
    ActivityLogService.logActivity(
      faculty._id,
      "LOGIN",
      {
        school: faculty.school,
        program: faculty.program,
        academicYear: "N/A", // Faculty login isn't tied to a year
      },
      { description: "Faculty logged in" },
      req
    );

    // If project coordinator, use the active primary context when multiple assignments exist.
    let isPrimary = false;
    let coordinatorContext = null;
    if (faculty.isProjectCoordinator) {
      const coordinatorAssignments = await ProjectCoordinator.find({
        faculty: faculty._id,
        isActive: true,
      }).lean();

      if (coordinatorAssignments.length > 0) {
        coordinatorContext =
          coordinatorAssignments.find((c) => c.isPrimary) ||
          coordinatorAssignments[0];
        isPrimary = Boolean(coordinatorContext.isPrimary);

        // Keep the authenticated user's school/program aligned with the active coordinator context
        // instead of the base faculty record, which may be a broader or older value.
        facultyData.school = coordinatorContext.school;
        facultyData.program = coordinatorContext.program;
      }
    }

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      data: {
        ...facultyData,
        isProjectCoordinator: faculty.isProjectCoordinator,
        isPrimary,
        school: facultyData.school,
        program: facultyData.program,
      },
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
      program,
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
      program,
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
 * Setup Password - First-time password change after admin-assigned default password
 * Only works if the faculty still has isDefaultPassword === true
 */
export async function setupPassword(req, res) {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const Model = req.user.role === "student" ? Student : Faculty;
    const user = await Model.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${req.user.role === "student" ? "Student" : "Faculty"} not found.`,
      });
    }

    if (!user.isDefaultPassword) {
      return res.status(400).json({
        success: false,
        message: "Password has already been set up. Use Change Password instead.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.isDefaultPassword = false;
    await user.save();

    logger.info("password_setup_completed", {
      userId: user._id,
      role: req.user.role,
    });

    res.status(200).json({
      success: true,
      message: "Password set up successfully. You can now access your dashboard.",
    });
  } catch (error) {
    logger.error("setup_password_error", {
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

    const Model = req.user.role === "student" ? Student : Faculty;
    const user = await Model.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `${req.user.role === "student" ? "Student" : "Faculty"} not found.`,
      });
    }

    const isPasswordMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    logger.info("password_changed", {
      userId: user._id,
      role: req.user.role,
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

    // If project coordinator, fetch primary status
    let isPrimary = false;
    if (facultyData.isProjectCoordinator) {
      const coordinatorData = await ProjectCoordinator.findOne({
        faculty: facultyData._id,
        isActive: true
      });
      if (coordinatorData) {
        isPrimary = coordinatorData.isPrimary;
      }
    }

    res.status(200).json({
      success: true,
      message: "Token is valid.",
      data: {
        ...facultyData,
        isPrimary,
      },
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
    if (req.user.role === "student") {
      const student = await Student.findById(req.user._id).select("-password");

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found.",
        });
      }

      const studentData = student.toObject();
      studentData.role = "student";

      return res.status(200).json({
        success: true,
        data: studentData,
      });
    }

    const faculty = await Faculty.findById(req.user._id).select("-password");

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found.",
      });
    }

    const facultyData = faculty.toObject();
    const masterAdminId = process.env.ADMIN_EMPLOYEE_ID || "ADMIN001";
    facultyData.isMasterAdmin = facultyData.employeeId === masterAdminId;

    if (faculty.isProjectCoordinator) {
      const coordinator = await ProjectCoordinator.findOne({
        faculty: faculty._id,
        isActive: true,
        isPrimary: true,
      }).lean();

      if (coordinator) {
        facultyData.school = coordinator.school;
        facultyData.program = coordinator.program;
        facultyData.academicYear = coordinator.academicYear;
        facultyData.isPrimary = coordinator.isPrimary;
      } else {
        const fallbackCoordinator = await ProjectCoordinator.findOne({
          faculty: faculty._id,
          isActive: true,
        }).sort({ createdAt: -1 }).lean();

        if (fallbackCoordinator) {
          facultyData.school = fallbackCoordinator.school;
          facultyData.program = fallbackCoordinator.program;
          facultyData.academicYear = fallbackCoordinator.academicYear;
          facultyData.isPrimary = fallbackCoordinator.isPrimary;
        }
      }
    }

    res.status(200).json({
      success: true,
      data: facultyData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
