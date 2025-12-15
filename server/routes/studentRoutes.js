import express from "express";
import * as studentController from "../controllers/studentController.js";
import { authenticate } from "../middlewares/auth.js";
import { validateRequired } from "../middlewares/validation.js";

const router = express.Router();

// Get student profile by registration number
router.get("/profile/:regNo", studentController.getProfile);

// Get project details for a student
router.get("/project/:regNo", studentController.getProject);

// Get marks for a student (protected)
router.get("/marks/:regNo", authenticate, studentController.getMarks);

// Get approvals (PPT/draft etc.) for a student (protected)
router.get("/approvals/:regNo", authenticate, studentController.getApprovals);

// Get broadcast messages visible to students
router.get("/broadcasts", studentController.getBroadcasts);

export default router;
