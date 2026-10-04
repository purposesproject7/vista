import express from "express";
import * as studentController from "../controllers/studentController.js";
import { authenticate } from "../middlewares/auth.js";
import { requireRole, requireSelfStudent } from "../middlewares/rbac.js";
import { validateRequired } from "../middlewares/validation.js";
import { broadcastBlockMiddleware } from "../middlewares/broadcastBlock.js";

const router = express.Router();

// Every student route needs a login, and an admin "block" broadcast aimed at
// students shuts them all (except /broadcasts, so the block can be read).
router.use(authenticate, broadcastBlockMiddleware);

// Submit the logged-in student's proposed project title/abstract
router.post(
  "/project/title-abstract",
  requireRole("student"),
  studentController.submitTitleAbstract
);

// Get the title/abstract workflow status for the logged-in student's project
router.get(
  "/project/title-abstract",
  requireRole("student"),
  studentController.getTitleAbstractStatus
);

// Get student profile by registration number (self only)
router.get(
  "/profile/:regNo",
  requireSelfStudent,
  studentController.getProfile
);

// Get project details for a student (self only)
router.get(
  "/project/:regNo",
  requireSelfStudent,
  studentController.getProject
);

// Get marks for a student (self only)
router.get(
  "/marks/:regNo",
  requireSelfStudent,
  studentController.getMarks
);

// Get approvals (PPT/draft etc.) for a student (self only)
router.get(
  "/approvals/:regNo",
  requireSelfStudent,
  studentController.getApprovals
);

// Get broadcast messages visible to students
router.get(
  "/broadcasts",
  requireSelfStudent,
  studentController.getBroadcasts
);

export default router;
