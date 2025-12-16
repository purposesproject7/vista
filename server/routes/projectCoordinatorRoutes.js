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
router.use(requireRole("project_coordinator"));
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
  checkFeatureLock("faculty_creation"),
  validateRequired([
    "name",
    "emailId",
    "employeeId",
    "password",
    "role",
    "specialization",
  ]),
  coordinatorController.createFaculty,
);

router.put(
  "/faculty/:employeeId",
  checkCoordinatorPermission("canEditFaculty"),
  coordinatorController.updateFaculty,
);

router.delete(
  "/faculty/:employeeId",
  checkCoordinatorPermission("canDeleteFaculty"),
  coordinatorController.deleteFaculty,
);

/**
 * Student management (dept-specific)
 */
router.get("/students", coordinatorController.getStudentList);

router.post(
  "/student",
  checkCoordinatorPermission("canUploadStudents"),
  checkFeatureLock("student_upload"),
  validateRequired(["regNo", "name", "emailId"]),
  coordinatorController.createStudent,
);

router.post(
  "/student/bulk",
  checkCoordinatorPermission("canUploadStudents"),
  checkFeatureLock("student_upload"),
  validateRequired(["students"]),
  coordinatorController.uploadStudents,
);

router.put(
  "/students/:regNo",
  checkCoordinatorPermission("canModifyStudents"),
  checkFeatureLock("student_modification"),
  coordinatorController.updateStudent,
);

router.delete(
  "/students/:regNo",
  checkCoordinatorPermission("canDeleteStudents"),
  coordinatorController.deleteStudent,
);

router.get("/students/:regNo", coordinatorController.getStudentByRegNo);

/**
 * Project management
 */
router.get("/projects", coordinatorController.getProjectList);

router.post(
  "/projects",
  checkCoordinatorPermission("canCreateProjects"),
  checkFeatureLock("project_creation"),
  validateRequired([
    "name",
    "students",
    "guideFacultyEmpId",
    "specialization",
    "type",
  ]),
  validateTeamSize,
  validateSpecialization,
  coordinatorController.createProject,
);

router.put(
  "/projects/:id",
  checkCoordinatorPermission("canEditProjects"),
  coordinatorController.updateProject,
);

router.delete(
  "/projects/:id",
  checkCoordinatorPermission("canDeleteProjects"),
  coordinatorController.deleteProject,
);

/**
 * Guide assignment and reassignment
 */
router.put(
  "/projects/:projectId/assign-guide",
  checkCoordinatorPermission("canAssignGuides"),
  checkFeatureLock("guide_assignment"),
  validateRequired(["guideFacultyEmpId"]),
  validateSpecialization,
  coordinatorController.assignGuide,
);

router.put(
  "/projects/:projectId/reassign-guide",
  checkCoordinatorPermission("canReassignGuides"),
  checkFeatureLock("guide_reassignment"),
  validateRequired(["newGuideFacultyEmpId", "reason"]),
  validateSpecialization,
  coordinatorController.reassignGuide,
);

/**
 * Panel management
 */
router.get("/panels", coordinatorController.getPanelList);

router.post(
  "/panels",
  checkCoordinatorPermission("canCreatePanels"),
  checkFeatureLock("panel_creation"),
  validateRequired(["memberEmployeeIds"]),
  validatePanelSize,
  coordinatorController.createPanel,
);

router.post(
  "/panels/auto-create",
  checkCoordinatorPermission("canCreatePanels"),
  checkFeatureLock("panel_creation"),
  coordinatorController.autoCreatePanels,
);

router.put(
  "/panels/:id/members",
  checkCoordinatorPermission("canEditPanels"),
  validateRequired(["memberEmployeeIds"]),
  validatePanelSize,
  coordinatorController.updatePanelMembers,
);

router.delete(
  "/panels/:id",
  checkCoordinatorPermission("canDeletePanels"),
  coordinatorController.deletePanel,
);

/**
 * Panel assignment to projects
 */
router.post(
  "/projects/:projectId/assign-panel",
  checkCoordinatorPermission("canAssignPanels"),
  checkFeatureLock("panel_assignment"),
  validateRequired(["panelId"]),
  coordinatorController.assignPanel,
);

router.post(
  "/projects/:projectId/assign-review-panel",
  checkCoordinatorPermission("canAssignPanels"),
  validateRequired(["reviewType", "panelId"]),
  coordinatorController.assignReviewPanel,
);

router.post(
  "/panels/auto-assign",
  checkCoordinatorPermission("canAssignPanels"),
  checkFeatureLock("panel_assignment"),
  validateSpecialization,
  coordinatorController.autoAssignPanels,
);

/**
 * Panel reassignment (update members only)
 */
router.put(
  "/projects/:projectId/reassign-panel",
  checkCoordinatorPermission("canReassignPanels"),
  validateRequired(["panelId", "reason"]),
  coordinatorController.reassignPanel,
);

/**
 * Team operations
 */
router.post(
  "/teams/merge",
  checkCoordinatorPermission("canMergeTeams"),
  checkFeatureLock("team_merging"),
  validateRequired(["projectId1", "projectId2", "reason"]),
  validateTeamSize,
  coordinatorController.mergeTeams,
);

router.post(
  "/teams/split",
  checkCoordinatorPermission("canSplitTeams"),
  checkFeatureLock("team_splitting"),
  validateRequired(["projectId", "studentIds", "reason"]),
  validateTeamSize,
  coordinatorController.splitTeam,
);

/**
 * Marking schema and component library (view and limited edit)
 */
router.get("/marking-schema", coordinatorController.getMarkingSchema);

router.put(
  "/marking-schema/:id/deadlines",
  checkCoordinatorPermission("canEditMarkingSchema"),
  coordinatorController.updateMarkingSchemaDeadlines,
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
  coordinatorController.handleRequest,
);

/**
 * Broadcast messages (dept-specific)
 */
router.get("/broadcasts", coordinatorController.getBroadcasts);

router.post(
  "/broadcasts",
  checkCoordinatorPermission("canCreateBroadcasts"),
  validateRequired(["message", "expiresAt"]),
  coordinatorController.createBroadcast,
);

router.put(
  "/broadcasts/:id",
  checkCoordinatorPermission("canEditBroadcasts"),
  coordinatorController.updateBroadcast,
);

router.delete(
  "/broadcasts/:id",
  checkCoordinatorPermission("canDeleteBroadcasts"),
  coordinatorController.deleteBroadcast,
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
  coordinatorController.getFacultyWorkloadReport,
);
router.get(
  "/reports/student-performance",
  coordinatorController.getStudentPerformanceReport,
);

/**
 * Department configuration (view only for coordinators)
 */
router.get("/department-config", coordinatorController.getDepartmentConfig);

export default router;
