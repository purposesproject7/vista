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

router.use(authenticate);
router.use(requireRole("project_coordinator"));
router.use(requireProjectCoordinator);

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

router.get("/students", coordinatorController.getStudentList);
router.post(
  "/students/upload",
  checkCoordinatorPermission("canUploadStudents"),
  checkFeatureLock("student_upload"),
  validateRequired(["students"]),
  coordinatorController.uploadStudents,
);

router.get("/panels", coordinatorController.getPanelList);
router.post(
  "/panels",
  checkCoordinatorPermission("canCreatePanels"),
  checkFeatureLock("panel_creation"),
  validateRequired(["memberEmployeeIds"]),
  validatePanelSize,
  coordinatorController.createPanel,
);
router.put(
  "/panels/:id/members",
  checkCoordinatorPermission("canEdit"),
  validateRequired(["memberEmployeeIds"]),
  validatePanelSize,
  coordinatorController.updatePanelMembers,
);

router.put(
  "/projects/:projectId/assign-guide",
  checkCoordinatorPermission("canAssignGuides"),
  checkFeatureLock("guide_assignment"),
  validateRequired(["guideFacultyId"]),
  validateSpecialization,
  coordinatorController.assignGuide,
);

router.put(
  "/projects/:projectId/reassign-guide",
  checkCoordinatorPermission("canReassignGuides"),
  checkFeatureLock("guide_reassignment"),
  validateRequired(["newGuideFacultyId", "reason"]),
  validateSpecialization,
  coordinatorController.reassignGuide,
);

router.post(
  "/projects/:projectId/assign-panel",
  checkCoordinatorPermission("canEdit"),
  checkFeatureLock("panel_assignment"),
  validateRequired(["panelId"]),
  coordinatorController.assignPanel,
);

router.post(
  "/projects/:projectId/assign-review-panel",
  checkCoordinatorPermission("canEdit"),
  validateRequired(["reviewType", "panelId"]),
  coordinatorController.assignReviewPanel,
);

router.post(
  "/teams/merge",
  checkCoordinatorPermission("canMergeTeams"),
  checkFeatureLock("team_merging"),
  validateRequired(["projectId1", "projectId2", "reason"]),
  validateTeamSize,
  coordinatorController.mergeTeams,
);

router.get("/marking-schema", coordinatorController.getMarkingSchema);
router.put(
  "/marking-schema/:id",
  checkCoordinatorPermission("canEditMarkingSchema"),
  coordinatorController.updateMarkingSchema,
);

router.get("/component-library", coordinatorController.getComponentLibrary);
router.put(
  "/component-library/:id",
  checkCoordinatorPermission("canEditMarkingSchema"),
  coordinatorController.updateComponentLibrary,
);

router.get("/reports/projects", coordinatorController.getProjectsReport);
router.get("/reports/marks", coordinatorController.getMarksReport);
router.get("/reports/panels", coordinatorController.getPanelsReport);

export default router;
