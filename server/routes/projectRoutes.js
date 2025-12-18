import express from "express";
import * as projectController from "../controllers/projectController.js";
import { authenticate } from "../middlewares/auth.js";
import { validateRequired } from "../middlewares/validation.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all projects (with optional filters)
router.get("/list", projectController.getProjectList);

// Get single project by ID
router.get("/:id", projectController.getProjectById);

// Get projects by student Reg No
router.get("/student/:regNo", projectController.getProjectsByStudent);

// Get projects by guide faculty Employee ID
router.get("/guide/:employeeId", projectController.getProjectsByGuide);

// Get projects by panel ID
router.get("/panel/:panelId", projectController.getProjectsByPanel);

// Create single project
router.post(
  "/create",
  validateRequired([
    "name",
    "students",
    "guideFacultyEmpId",
    "specialization",
    "type",
  ]),
  projectController.createProject,
);

// Create multiple projects (bulk)
router.post(
  "/bulk",
  validateRequired(["school", "department", "projects", "guideFacultyEmpId"]),
  projectController.createProjectsBulk,
);

// Update project details
router.put(
  "/:id",
  validateRequired(["projectId"]),
  projectController.updateProjectDetails,
);

// Delete project
router.delete("/:id", projectController.deleteProject);

export default router;
