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

/**
 * Faculty management (dept-specific)
 */
router.get("/faculty", coordinatorController.getFacultyList);

router.post(
  "/faculty",
  checkCoordinatorPermission("canCreateFaculty"),
  validateRequired(["name", "emailId", "employeeId", "role", "specialization"]),
  coordinatorController.createFaculty
);

router.post(
  "/faculty/bulk",
  validateRequired(["facultyList"]),
  coordinatorController.createFacultyBulk
);

router.put(
  "/faculty/:employeeId",
  checkCoordinatorPermission("canEditFaculty"),
  coordinatorController.updateFaculty
);

router.delete(
  "/faculty/:employeeId",
  checkCoordinatorPermission("canDeleteFaculty"),
  coordinatorController.deleteFaculty
);

/**
 * Student management (dept-specific)
 */
router.get("/students", coordinatorController.getStudentList);

router.post(
  "/student",
  checkCoordinatorPermission("canUploadStudents"),
  validateRequired(["regNo", "name", "emailId"]),
  coordinatorController.createStudent
);

router.post(
  "/student/bulk",
  checkCoordinatorPermission("canUploadStudents"),
  validateRequired(["students"]),
  coordinatorController.uploadStudents
);

router.put(
  "/student/:regNo",
  checkCoordinatorPermission("canModifyStudents"),
  coordinatorController.updateStudent
);

router.delete(
  "/student/:regNo",
  checkCoordinatorPermission("canDeleteStudents"),
  coordinatorController.deleteStudent
);

router.get("/student/:regNo", coordinatorController.getStudentByRegNo);

/**
 * Project management
 */
router.get("/projects", coordinatorController.getProjectList);

router.post(
  "/projects/bulk",
  checkCoordinatorPermission("canCreateProjects"),
  validateRequired(["projects"]),
  coordinatorController.createProjectsBulk
);

router.post(
  "/projects",
  checkCoordinatorPermission("canCreateProjects"),
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
  checkCoordinatorPermission("canEditProjects"),
  coordinatorController.updateProject
);

router.delete(
  "/projects/:id",
  checkCoordinatorPermission("canDeleteProjects"),
  coordinatorController.deleteProject
);

/**
 * Guide assignment and reassignment
 */
router.put(
  "/projects/:projectId/assign-guide",
  checkCoordinatorPermission("canAssignGuides"),
  validateRequired(["guideFacultyEmpId"]),
  coordinatorController.assignGuide
);

router.put(
  "/projects/:projectId/reassign-guide",
  checkCoordinatorPermission("canReassignGuides"),
  validateRequired(["newGuideFacultyEmpId", "reason"]),
  coordinatorController.reassignGuide
);

/**
 * Panel management
 */
router.get("/panels", coordinatorController.getPanelList);

router.post(
  "/panels",
  checkCoordinatorPermission("canCreatePanels"),
  validateRequired(["memberEmployeeIds"]),
  coordinatorController.createPanel
);

router.post(
  "/panels/auto-create",
  checkCoordinatorPermission("canCreatePanels"),
  coordinatorController.autoCreatePanels
);

router.post(
  "/panels/bulk",
  checkCoordinatorPermission("canCreatePanels"),
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
  checkCoordinatorPermission("canEditPanels"),
  validateRequired(["memberEmployeeIds"]),
  coordinatorController.updatePanelMembers
);

router.delete(
  "/panels/:id",
  checkCoordinatorPermission("canDeletePanels"),
  coordinatorController.deletePanel
);

/**
 * Panel assignment to projects
 */
router.post(
  "/projects/assign-panel",
  checkCoordinatorPermission("canAssignPanels"),
  validateRequired(["projectId", "panelId"]),
  coordinatorController.assignPanel
);

router.post(
  "/projects/assign-review-panel",
  checkCoordinatorPermission("canAssignPanels"),
  validateRequired(["projectId", "reviewType", "panelId"]),
  coordinatorController.assignReviewPanel
);

router.post(
  "/panels/auto-assign",
  checkCoordinatorPermission("canAssignPanels"),
  coordinatorController.autoAssignPanels
);

/**
 * Panel reassignment (update members only)
 */
router.put(
  "/projects/reassign-panel",
  checkCoordinatorPermission("canReassignPanels"),
  validateRequired(["projectId", "panelId", "reason"]),
  coordinatorController.reassignPanel
);

/**
 * Team operations
 */
router.post(
  "/teams/merge",
  checkCoordinatorPermission("canMergeTeams"),
  validateRequired(["projectId1", "projectId2", "reason"]),
  coordinatorController.mergeTeams
);

router.post(
  "/teams/split",
  checkCoordinatorPermission("canSplitTeams"),
  validateRequired(["projectId", "studentIds", "reason"]),
  coordinatorController.splitTeam
);

/**
 * Marking schema and component library (view and limited edit)
 */
router.get("/marking-schema", coordinatorController.getMarkingSchema);

router.put(
  "/marking-schema/:id/deadlines",
  checkCoordinatorPermission("canEditMarkingSchema"),
  coordinatorController.updateMarkingSchemaDeadlines
);

router.get("/component-library", coordinatorController.getComponentLibrary);

/**
 * Request management
 */
router.get("/requests", coordinatorController.getRequests);

router.put(
  "/requests/:id/status",
  checkCoordinatorPermission("canManageRequests"),
  validateRequired(["status"]),
  coordinatorController.handleRequest
);

router.post(
  "/requests/approve-multiple",
  checkCoordinatorPermission("canManageRequests"),
  validateRequired(["requestIds"]),
  coordinatorController.approveMultipleRequests
);

/**
 * Broadcast messages (dept-specific)
 */
router.get("/broadcasts", coordinatorController.getBroadcasts);

router.post(
  "/broadcasts",
  checkCoordinatorPermission("canCreateBroadcasts"),
  validateRequired(["message", "expiresAt"]),
  coordinatorController.createBroadcast
);

router.put(
  "/broadcasts/:id",
  checkCoordinatorPermission("canEditBroadcasts"),
  coordinatorController.updateBroadcast
);

router.delete(
  "/broadcasts/:id",
  checkCoordinatorPermission("canDeleteBroadcasts"),
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
