import { logger } from "../utils/logger.js";

// In-memory OTP storage (use Redis in production)
const otpStorage = new Map();

export class OTPService {
  /**
   * Generate 6-digit OTP
   */
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Store OTP with expiration
   */
  static storeOTP(emailId, otp, facultyName) {
    otpStorage.set(emailId, {
      otp,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
      facultyName,
      createdAt: new Date(),
    });

    logger.info("otp_stored", {
      emailId,
      expiresIn: "10 minutes",
    });
  }

  /**
   * Verify OTP
   */
  static verifyOTP(emailId, inputOTP) {
    const otpData = otpStorage.get(emailId);

    // Check if OTP exists
    if (!otpData) {
      return {
        success: false,
        message: "OTP not found or expired. Please request a new OTP.",
      };
    }

    // Check if expired
    if (Date.now() > otpData.expires) {
      otpStorage.delete(emailId);
      return {
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      };
    }

    // Check attempt limit
    if (otpData.attempts >= 3) {
      otpStorage.delete(emailId);
      return {
        success: false,
        message: "Too many failed attempts. Please request a new OTP.",
      };
    }

    // Verify OTP
    if (otpData.otp !== inputOTP.trim()) {
      otpData.attempts += 1;
      otpStorage.set(emailId, otpData); // Update attempts

      logger.warn("otp_verification_failed", {
        emailId,
        attemptsRemaining: 3 - otpData.attempts,
      });

      return {
        success: false,
        message: `Invalid OTP. ${3 - otpData.attempts} attempts remaining.`,
      };
    }

    logger.info("otp_verified", { emailId });

    return {
      success: true,
      message: "OTP verified successfully.",
    };
  }

  /**
   * Delete OTP
   */
  static deleteOTP(emailId) {
    const deleted = otpStorage.delete(emailId);
    if (deleted) {
      logger.info("otp_deleted", { emailId });
    }
    return deleted;
  }

  /**
   * Get OTP data (for debugging in dev)
   */
  static getOTPData(emailId) {
    if (process.env.NODE_ENV !== "production") {
      return otpStorage.get(emailId);
    }
    return null;
  }

  /**
   * Clean up expired OTPs (run periodically)
   */
  static cleanupExpiredOTPs() {
    const now = Date.now();
    let cleaned = 0;

    for (const [emailId, data] of otpStorage.entries()) {
      if (now > data.expires) {
        otpStorage.delete(emailId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info("expired_otps_cleaned", { count: cleaned });
    }

    return cleaned;
  }
}

// Auto-cleanup every 5 minutes
if (process.env.NODE_ENV === "production") {
  setInterval(
    () => {
      OTPService.cleanupExpiredOTPs();
    },
    5 * 60 * 1000,
  );
}
