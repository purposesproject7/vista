import express from "express";
import * as projectController from "../controllers/projectController.js";
import { authenticate } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";
import { validateRequired } from "../middlewares/validation.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ⚠️ All literal routes MUST come before /:id to prevent Express
// matching :id = "list" | "student" | "guide" | "panel" | "create" | "bulk"

// Get all projects (with optional filters)
router.get("/list", projectController.getProjectList);

// Get projects by student Reg No
router.get("/student/:regNo", projectController.getProjectsByStudent);

// Get projects by guide faculty Employee ID
router.get("/guide/:employeeId", projectController.getProjectsByGuide);

// Get projects by panel ID
router.get("/panel/:panelId", projectController.getProjectsByPanel);

// Create single project (requires faculty or admin role)
router.post(
  "/create",
  requireRole("faculty", "admin"),
  validateRequired([
    "name",
    "students",
    "guideFacultyEmpId",
    "specialization",
    "type",
  ]),
  projectController.createProject
);

// Create multiple projects (bulk — restricted to admin only)
router.post(
  "/bulk",
  requireRole("admin"),
  validateRequired(["school", "program", "projects", "guideFacultyEmpId"]),
  projectController.createProjectsBulk
);

// Parameterized /:id routes AFTER all literal paths
// Get single project by ID
router.get("/:id", projectController.getProjectById);

// Update project details (requires faculty or admin role)
router.put(
  "/:id",
  requireRole("faculty", "admin"),
  validateRequired(["projectId"]),
  projectController.updateProjectDetails
);

// Guide accepts the student-submitted title/abstract, locking it (guide/admin only)
router.put(
  "/:id/accept-title-abstract",
  requireRole("faculty", "admin"),
  projectController.acceptTitleAbstract
);

// Delete project (requires faculty or admin role)
router.delete("/:id", requireRole("faculty", "admin"), projectController.deleteProject);

export default router;
