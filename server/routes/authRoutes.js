import express from "express";
import * as authController from "../controllers/authController.js";
import * as otpController from "../controllers/otpController.js";
import { authenticate } from "../middlewares/auth.js";
import { validateRequired } from "../middlewares/validation.js";
import { loginLimiter, resendOtpLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// === Standard Auth ===
router.post(
  "/login",
  loginLimiter,
  validateRequired(["emailId", "password"]),
  authController.login,
);

router.post(
  "/register",
  validateRequired(["name", "emailId", "password", "employeeId", "role"]),
  authController.register,
);

// === OTP-Based Password Reset ===
router.post(
  "/forgot-password/send-otp",
  validateRequired(["emailId"]),
  otpController.sendOTP,
);

router.post(
  "/forgot-password/verify-otp",
  validateRequired(["emailId", "otp", "newPassword", "confirmPassword"]),
  otpController.verifyOTPAndResetPassword,
);

router.post(
  "/forgot-password/resend-otp",
  resendOtpLimiter,
  validateRequired(["emailId"]),
  otpController.resendOTP,
);

// === Token-Based Password Reset (Alternative) ===
router.post(
  "/forgot-password",
  validateRequired(["emailId"]),
  authController.forgotPassword,
);

router.post(
  "/reset-password",
  validateRequired(["token", "newPassword"]),
  authController.resetPassword,
);

// === Authenticated Routes ===
router.put(
  "/change-password",
  authenticate,
  validateRequired(["currentPassword", "newPassword"]),
  authController.changePassword,
);

// === First-time Password Setup (for faculty using admin-assigned default password) ===
router.post(
  "/setup-password",
  authenticate,
  validateRequired(["newPassword", "confirmPassword"]),
  authController.setupPassword,
);

router.get("/verify-token", authenticate, authController.verifyToken);

router.post("/logout", authenticate, authController.logout);

router.get("/profile", authenticate, authController.getProfile);

export default router;
