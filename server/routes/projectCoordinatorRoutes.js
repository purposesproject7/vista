import express from "express";
import * as coordinatorController from "../controllers/projectCoordinatorController.js";
import { authenticate } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";
import { requireProjectCoordinator } from "../middlewares/rbac.js";
import { checkCoordinatorPermission } from "../middlewares/rbac.js";
import { checkFeatureLock } from "../middlewares/featureLock.js";
import { validateRequired } from "../middlewares/validation.js";
import { validateSpecialization } from "../middlewares/validation.js";
import { validateTeamSize } from "../middlewares/featureLock.js";
import { validatePanelSize } from "../middlewares/featureLock.js";

const router = express.Router();

// Authentication and role guards
router.use(authenticate);
// router.use(requireRole("project_coordinator")); // Removed: Role is "faculty", check isProjectCoordinator instead
router.use(requireProjectCoordinator);

/**
 * Coordinator profile and permissions
 */
router.get("/profile", coordinatorController.getProfile);
router.get("/permissions", coordinatorController.getPermissions);

// Faculty management (dept-specific)
router.get("/faculty", coordinatorController.getFacultyList); // Usually view is allowed if authorized

router.post(
  "/faculty",
  checkCoordinatorPermission("faculty_management"),
  validateRequired(["name", "emailId", "employeeId", "role", "specialization"]),
  coordinatorController.createFaculty
);

router.post(
  "/faculty/bulk",
  checkCoordinatorPermission("faculty_management"), // Added check here for consistency
  validateRequired(["facultyList"]),
  coordinatorController.createFacultyBulk
);

router.put(
  "/faculty/:employeeId",
  checkCoordinatorPermission("faculty_management"),
  coordinatorController.updateFaculty
);

router.delete(
  "/faculty/:employeeId",
  checkCoordinatorPermission("faculty_management"),
  coordinatorController.deleteFaculty
);

/**
 * Student management (dept-specific)
 */
router.get("/students", coordinatorController.getStudentList);

router.post(
  "/student",
  checkCoordinatorPermission("student_management"),
  validateRequired(["regNo", "name", "emailId"]),
  coordinatorController.createStudent
);

router.post(
  "/student/bulk",
  checkCoordinatorPermission("student_management"),
  validateRequired(["students"]),
  coordinatorController.uploadStudents
);

router.put(
  "/student/:regNo",
  checkCoordinatorPermission("student_management"),
  coordinatorController.updateStudent
);

router.delete(
  "/student/:regNo",
  checkCoordinatorPermission("student_management"),
  coordinatorController.deleteStudent
);

router.get("/student/:regNo", coordinatorController.getStudentByRegNo);

/**
 * Project management
 */
router.get("/projects", coordinatorController.getProjectList);

router.post(
  "/projects/bulk",
  checkCoordinatorPermission("project_management"),
  validateRequired(["projects"]),
  coordinatorController.createProjectsBulk
);

router.post(
  "/projects",
  checkCoordinatorPermission("project_management"),
  validateRequired([
    "name",
    "students",
    "guideFacultyEmpId",
    "specialization",
    "type",
  ]),
  coordinatorController.createProject
);

router.put(
  "/projects/:id",
  checkCoordinatorPermission("project_management"),
  coordinatorController.updateProject
);

router.delete(
  "/projects/:id",
  checkCoordinatorPermission("project_management"),
  coordinatorController.deleteProject
);

/**
 * Guide assignment and reassignment
 */
router.put(
  "/projects/:projectId/assign-guide",
  checkCoordinatorPermission("project_management"),
  validateRequired(["guideFacultyEmpId"]),
  coordinatorController.assignGuide
);

router.put(
  "/projects/:projectId/reassign-guide",
  checkCoordinatorPermission("project_management"),
  validateRequired(["newGuideFacultyEmpId", "reason"]),
  coordinatorController.reassignGuide
);

/**
 * Panel management
 */
router.get("/panels", coordinatorController.getPanelList);

router.post(
  "/panels",
  checkCoordinatorPermission("panel_management"),
  validateRequired(["memberEmployeeIds"]),
  coordinatorController.createPanel
);

router.post(
  "/panels/auto-create",
  checkCoordinatorPermission("panel_management"),
  coordinatorController.autoCreatePanels
);

router.post(
  "/panels/bulk",
  checkCoordinatorPermission("panel_management"),
  validateRequired(["panels"]),
  coordinatorController.createPanelsBulk
);

router.get("/panels/summary", coordinatorController.getPanelSummary);

router.post(
  "/faculty/details-bulk",
  validateRequired(["employeeIds"]),
  coordinatorController.getFacultyDetailsBulk
);

router.put(
  "/panels/:id/members",
  checkCoordinatorPermission("panel_management"),
  validateRequired(["memberEmployeeIds"]),
  coordinatorController.updatePanelMembers
);

router.delete(
  "/panels/:id",
  checkCoordinatorPermission("panel_management"),
  coordinatorController.deletePanel
);

/**
 * Panel assignment to projects
 */
router.post(
  "/projects/assign-panel",
  checkCoordinatorPermission("panel_management"),
  validateRequired(["projectId", "panelId"]),
  coordinatorController.assignPanel
);

router.post(
  "/projects/assign-review-panel",
  checkCoordinatorPermission("panel_management"),
  validateRequired(["projectId", "reviewType", "panelId"]),
  coordinatorController.assignReviewPanel
);

router.post(
  "/panels/auto-assign",
  checkCoordinatorPermission("panel_management"),
  coordinatorController.autoAssignPanels
);

/**
 * Panel reassignment (update members only)
 */
router.put(
  "/projects/reassign-panel",
  checkCoordinatorPermission("panel_management"),
  validateRequired(["projectId", "panelId", "reason"]),
  coordinatorController.reassignPanel
);

/**
 * Team operations
 */
router.post(
  "/teams/merge",
  checkCoordinatorPermission("project_management"),
  validateRequired(["projectId1", "projectId2", "reason"]),
  coordinatorController.mergeTeams
);

router.post(
  "/teams/split",
  checkCoordinatorPermission("project_management"),
  validateRequired(["projectId", "studentIds", "reason"]),
  coordinatorController.splitTeam
);

/**
 * Marking schema and component library (view and limited edit)
 */
/* Marking schema and component library (view and limited edit) */
router.get("/marking-schema", coordinatorController.getMarkingSchema);
router.post(
  "/marking-schema",
  checkCoordinatorPermission("project_management"),
  coordinatorController.saveMarkingSchema
);

router.put(
  "/marking-schema/:id/deadlines",
  checkCoordinatorPermission("project_management"),
  coordinatorController.updateMarkingSchemaDeadlines
);

router.get("/component-library", coordinatorController.getComponentLibrary);

/**
 * Request management
 */
router.get("/requests", coordinatorController.getRequests);

router.put(
  "/requests/:id/status",
  // checkCoordinatorPermission("canManageRequests"), // Removed as mostly guides related
  validateRequired(["status"]),
  coordinatorController.handleRequest
);

router.post(
  "/requests/approve-multiple",
  // checkCoordinatorPermission("canManageRequests"), // Removed as mostly guides related
  validateRequired(["requestIds"]),
  coordinatorController.approveMultipleRequests
);

/**
 * Broadcast messages (dept-specific)
 */
router.get("/broadcasts", coordinatorController.getBroadcasts);

router.post(
  "/broadcasts",
  checkCoordinatorPermission("project_management"),
  validateRequired(["message", "expiresAt"]),
  coordinatorController.createBroadcast
);

router.put(
  "/broadcasts/:id",
  checkCoordinatorPermission("project_management"),
  coordinatorController.updateBroadcast
);

router.delete(
  "/broadcasts/:id",
  checkCoordinatorPermission("project_management"),
  coordinatorController.deleteBroadcast
);

/**
 * Reporting (dept-specific)
 */
router.get("/reports/overview", coordinatorController.getOverviewReport);
router.get("/reports/projects", coordinatorController.getProjectsReport);
router.get("/reports/marks", coordinatorController.getMarksReport);
router.get("/reports/panels", coordinatorController.getPanelsReport);
router.get(
  "/reports/faculty-workload",
  coordinatorController.getFacultyWorkloadReport
);
router.get(
  "/reports/student-performance",
  coordinatorController.getStudentPerformanceReport
);

/**
 * Master Data & Marks
 */
router.get("/academic-years", coordinatorController.getAcademicYears);
router.get("/programs", coordinatorController.getPrograms);
router.get("/projects/:id/marks", coordinatorController.getProjectMarks);

/**
 * Program configuration (view only for coordinators)
 */
router.get("/program-config", coordinatorController.getProgramConfig);

/**
 * Access Request
 */
router.post(
  "/request-access",
  validateRequired(["reason"]),
  coordinatorController.requestAccess
);

export default router;
