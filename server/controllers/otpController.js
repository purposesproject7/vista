import Faculty from "../models/facultySchema.js";
import bcrypt from "bcryptjs";
import { EmailService } from "../services/emailService.js";
import { OTPService } from "../services/otpService.js";
import { logger } from "../utils/logger.js";

/**
 * Send OTP to email
 */
export async function sendOTP(req, res) {
  try {
    const { emailId } = req.body;

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(emailId)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // Check if faculty exists
    const faculty = await Faculty.findOne({ emailId });
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address.",
      });
    }

    // Generate and store OTP
    const otp = OTPService.generateOTP();
    OTPService.storeOTP(emailId, otp, faculty.name);

    // Send OTP via email
    await EmailService.sendOTPEmail(emailId, otp, faculty.name);

    logger.info("otp_sent", {
      emailId,
      facultyId: faculty._id,
      requestId: req.requestId,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent to your email successfully. Please check your inbox.",
      expiresIn: "10 minutes",
    });
  } catch (error) {
    logger.error("send_otp_error", {
      error: error.message,
      emailId: req.body?.emailId,
    });

    // Clean up OTP on error
    if (req.body?.emailId) {
      OTPService.deleteOTP(req.body.emailId);
    }

    res.status(500).json({
      success: false,
      message: "Error sending OTP. Please try again.",
      error: error.message, // Exposed for debugging
    });
  }
}

/**
 * Verify OTP and reset password
 */
export async function verifyOTPAndResetPassword(req, res) {
  try {
    const { emailId, otp, newPassword, confirmPassword } = req.body;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    // Verify OTP
    const verification = OTPService.verifyOTP(emailId, otp);

    if (!verification.success) {
      return res.status(400).json({
        success: false,
        message: verification.message,
      });
    }

    // Find faculty
    const faculty = await Faculty.findOne({ emailId });
    if (!faculty) {
      OTPService.deleteOTP(emailId);
      return res.status(404).json({
        success: false,
        message: "Faculty not found.",
      });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    faculty.password = hashedPassword;
    await faculty.save();

    // Remove OTP from storage
    OTPService.deleteOTP(emailId);

    logger.info("password_reset_via_otp", {
      emailId,
      facultyId: faculty._id,
    });

    res.status(200).json({
      success: true,
      message:
        "Password reset successful! You can now login with your new password.",
    });
  } catch (error) {
    logger.error("verify_otp_error", {
      error: error.message,
      emailId: req.body?.emailId,
    });

    // Clean up OTP on error
    if (req.body?.emailId) {
      OTPService.deleteOTP(req.body.emailId);
    }

    res.status(500).json({
      success: false,
      message: "Error resetting password. Please try again.",
      error: error.message, // Exposed for debugging
    });
  }
}

/**
 * Resend OTP
 */
export async function resendOTP(req, res) {
  try {
    const { emailId } = req.body;

    // Clear existing OTP
    OTPService.deleteOTP(emailId);

    // Call sendOTP with the same request
    return await sendOTP(req, res);
  } catch (error) {
    logger.error("resend_otp_error", {
      error: error.message,
      emailId: req.body?.emailId,
    });

    res.status(500).json({
      success: false,
      message: "Error resending OTP. Please try again.",
      error: error.message, // Exposed for debugging
    });
  }
}
