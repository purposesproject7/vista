import express from "express";
import * as adminController from "../controllers/adminController.js";
import { authenticate } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";
import { requireSudoAdmin } from "../middlewares/requireSudoAdmin.js";
import { validateRequired } from "../middlewares/validation.js";
import { validateAcademicContext } from "../middlewares/validation.js";
import { validateTeamSize } from "../middlewares/featureLock.js";
import { validatePanelSize } from "../middlewares/featureLock.js";

const router = express.Router();

// Global admin auth and role guard
router.use(authenticate);
router.use(requireRole("admin"));

/**
 * Master data management
 */
router.get("/master-data", adminController.getMasterData);

// Bulk create master data
router.post(
  "/master-data/bulk",
  validateRequired(["schools", "programs", "academicYears"]),
  adminController.createMasterDataBulk
);

router.post(
  "/master-data/schools",
  validateRequired(["name", "code"]),
  adminController.createSchool
);

router.put("/master-data/schools/:id", adminController.updateSchool);

router.delete("/master-data/schools/:id", adminController.deleteSchool);

router.post(
  "/master-data/programs",
  validateRequired(["name", "code", "school"]),
  adminController.createProgram
);

router.put("/master-data/programs/:id", adminController.updateProgram);

router.post(
  "/master-data/academic-years",
  validateRequired(["year"]),
  adminController.createAcademicYear
);

router.put(
  "/master-data/academic-years/:id",
  adminController.updateAcademicYear
);

/**
 * Program configuration & feature locks
 */
router.get(
  "/program-config",
  validateRequired(["academicYear", "school", "program"], "query"),
  adminController.getProgramConfig
);

router.post(
  "/program-config",
  validateRequired(["academicYear", "school", "program"]),
  adminController.createProgramConfig
);

router.put("/program-config/:id", adminController.updateProgramConfig);

router.patch(
  "/program-config/:id/feature-lock",
  adminController.updateFeatureLock
);

/**
 * Component library
 */
router.get(
  "/component-library",
  validateRequired(["academicYear", "school", "program"], "query"),
  adminController.getComponentLibrary
);

router.post(
  "/component-library",
  validateRequired(["academicYear", "school", "program", "components"]),
  adminController.createComponentLibrary
);

router.put("/component-library/:id", adminController.updateComponentLibrary);

/**
 * Marking schema
 */
router.get(
  "/marking-schema",
  validateRequired(["academicYear", "school", "program"], "query"),
  adminController.getMarkingSchema
);

router.post(
  "/marking-schema",
  validateRequired(["academicYear", "school", "program", "reviews"]),
  adminController.createOrUpdateMarkingSchema
);

router.put("/marking-schema/:id", adminController.updateMarkingSchema);

/**
 * Admin Management (SUDO ADMIN ONLY - ADMIN001)
 */
router.get("/admins", requireSudoAdmin, adminController.getAllAdmins);

router.post(
  "/admins",
  requireSudoAdmin,
  validateRequired(["name", "emailId", "employeeId", "password", "school", "phoneNumber"]),
  adminController.createAdminUser
);

router.post(
  "/admins/bulk",
  requireSudoAdmin,
  validateRequired(["adminList"]),
  adminController.bulkCreateAdmins
);

router.put(
  "/admins/:employeeId",
  requireSudoAdmin,
  adminController.updateAdminUser
);

router.delete(
  "/admins/:employeeId",
  requireSudoAdmin,
  adminController.deleteAdminUser
);

/**
 * Faculty management
 */
router.get("/faculty", adminController.getAllFaculty);

router.post(
  "/faculty",
  validateRequired([
    "name",
    "emailId",
    "employeeId",
    "password",
    "role",
    "school",
    "program",
    "phoneNumber",
    "specialization",
  ]),
  adminController.createFaculty
);

router.post(
  "/faculty/bulk",
  validateRequired(["facultyList"]),
  adminController.createFacultyBulk
);

// Legacy admin creation endpoint - now protected by requireSudoAdmin
router.post(
  "/faculty/admin",
  requireSudoAdmin,
  validateRequired(["name", "emailId", "employeeId", "password"]),
  adminController.createAdmin
);

router.put("/faculty/:employeeId", adminController.updateFaculty);

router.delete("/faculty/:employeeId", adminController.deleteFaculty);

router.post(
  "/faculty/details-bulk",
  validateRequired(["employeeIds"]),
  adminController.getFacultyDetailsBulk
);

/**
 * Project coordinators
 */
router.get("/project-coordinators", adminController.getProjectCoordinators);

router.post(
  "/project-coordinators",
  validateRequired(["facultyId", "academicYear", "school", "program"]),
  adminController.assignProjectCoordinator
);

router.put(
  "/project-coordinators/:id",
  adminController.updateProjectCoordinator
);

router.patch(
  "/project-coordinators/:id/permissions",
  validateRequired(["permissions"]),
  adminController.updateCoordinatorPermissions
);

router.delete(
  "/project-coordinators/:id",
  adminController.removeProjectCoordinator
);

/**
 * Students overview (admin side)
 */
router.get("/students", adminController.getAllStudents);

router.post(
  "/student",
  validateRequired([
    "regNo",
    "name",
    "emailId",
    "school",
    "program",
    "academicYear",
  ]),
  adminController.createStudent
);

router.post(
  "/student/bulk",
  validateRequired(["students", "academicYear", "school", "program"]),
  adminController.bulkUploadStudents
);

router.post(
  "/student/notify-duplicate-guides",
  validateRequired(["duplicates"]),
  adminController.notifyDuplicateProjectGuides
);

router.put("/student/:regNo", adminController.updateStudent);

// Update student marks (ADMIN001 only)
router.put(
  "/student/:regNo/marks",
  requireSudoAdmin,
  adminController.updateStudentMarks
);

router.delete("/student/:regNo", adminController.deleteStudent);

router.get("/student/:regNo", adminController.getStudentByRegNo);

/**
 * Projects & best project flag
 */
router.get("/projects", adminController.getAllProjects);

router.get("/projects/guides", adminController.getAllGuideWithProjects);

router.post(
  "/projects",
  validateRequired([
    "name",
    "students",
    "guideFacultyEmpId",
    "school",
    "program",
    "academicYear",
  ]),
  adminController.createProject
);

router.post(
  "/projects/bulk",
  validateRequired(["projects"]),
  adminController.bulkCreateProjects
);

router.get("/projects/panels", adminController.getAllPanelsWithProjects);

router.patch("/projects/:id/best-project", adminController.markAsBestProject);

/**
 * Panels: CRUD and assignment
 */
router.get("/panels", adminController.getAllPanels);

router.get(
  "/panels/summary",
  validateRequired(["academicYear", "school", "program"], "query"),
  adminController.getPanelSummary
);

router.post(
  "/panels",
  validateRequired(["memberEmployeeIds", "academicYear", "school", "program"]),
  validatePanelSize,
  adminController.createPanelManually
);

router.post(
  "/panels/auto-create",
  validateRequired(["programs", "school", "academicYear"]),
  adminController.autoCreatePanels
);

router.post(
  "/panels/bulk",
  validateRequired(["panels"]),
  adminController.bulkCreatePanels
);

router.put("/panels/:id", adminController.updatePanel);

router.delete("/panels/:id", adminController.deletePanel);

router.post(
  "/panels/assign",
  validateRequired(["panelId", "projectId"]),
  adminController.assignPanelToProject
);

router.post(
  "/panels/auto-assign",
  validateRequired(["academicYear", "school", "program"]),
  adminController.autoAssignPanelsToProjects
);

/**
 * Faculty requests (unlock, extensions, etc.)
 */
router.get("/requests", adminController.getAllRequests);

router.put(
  "/requests/:id/status",
  validateRequired(["status"]),
  adminController.updateRequestStatus
);

/**
 * Project Coordinator Access Requests
 */
router.get("/access-requests", adminController.getAllAccessRequests);

router.put(
  "/access-requests/:id/status",
  validateRequired(["status"]),
  adminController.updateAccessRequestStatus
);

/**
 * Broadcast messages
 */
router.get("/broadcasts", adminController.getBroadcastMessages);

router.post(
  "/broadcasts",
  validateRequired(["message", "expiresAt"]),
  adminController.createBroadcastMessage
);

router.put("/broadcasts/:id", adminController.updateBroadcastMessage);

router.delete("/broadcasts/:id", adminController.deleteBroadcastMessage);

/**
 * Force PPT Approval (SUPER ADMIN ONLY - ADMIN001)
 */
router.post(
  "/force-ppt-approval",
  requireSudoAdmin,
  validateRequired(["school", "program", "academicYear", "reviewType"]),
  adminController.forcePPTApproval
);

import { getReportData } from "../controllers/reportController.js";

/**
 * Reporting endpoints
 */
router.get(
  "/reports/overview",
  validateRequired(["academicYear", "school", "program"], "query"),
  adminController.getOverviewReport
);

router.get(
  "/reports/projects",
  validateRequired(["academicYear", "school", "program"], "query"),
  adminController.getProjectsReport
);

router.get(
  "/reports/marks",
  validateRequired(["academicYear", "school", "program"], "query"),
  adminController.getMarksReport
);

router.get(
  "/reports/faculty-workload",
  validateRequired(["academicYear", "school", "program"], "query"),
  adminController.getFacultyWorkloadReport
);

router.get(
  "/reports/student-performance",
  validateRequired(["academicYear", "school", "program"], "query"),
  adminController.getStudentPerformanceReport
);

router.get("/reports", getReportData);

export default router;
