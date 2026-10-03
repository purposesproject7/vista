import express from "express";
import * as studentController from "../controllers/studentController.js";
import { authenticate } from "../middlewares/auth.js";
import { requireRole, requireSelfStudent } from "../middlewares/rbac.js";
import { validateRequired } from "../middlewares/validation.js";

const router = express.Router();

// Submit the logged-in student's proposed project title/abstract
router.post(
  "/project/title-abstract",
  authenticate,
  requireRole("student"),
  studentController.submitTitleAbstract
);

// Get the title/abstract workflow status for the logged-in student's project
router.get(
  "/project/title-abstract",
  authenticate,
  requireRole("student"),
  studentController.getTitleAbstractStatus
);

// Get student profile by registration number (self only)
router.get(
  "/profile/:regNo",
  authenticate,
  requireSelfStudent,
  studentController.getProfile
);

// Get project details for a student (self only)
router.get(
  "/project/:regNo",
  authenticate,
  requireSelfStudent,
  studentController.getProject
);

// Get marks for a student (self only)
router.get(
  "/marks/:regNo",
  authenticate,
  requireSelfStudent,
  studentController.getMarks
);

// Get approvals (PPT/draft etc.) for a student (self only)
router.get(
  "/approvals/:regNo",
  authenticate,
  requireSelfStudent,
  studentController.getApprovals
);

// Get broadcast messages visible to students
router.get(
  "/broadcasts",
  authenticate,
  requireSelfStudent,
  studentController.getBroadcasts
);

export default router;
