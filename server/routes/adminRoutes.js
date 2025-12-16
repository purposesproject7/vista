import express from "express";
import * as adminController from "../controllers/adminController.js";
import { authenticate } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";
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

router.post(
  "/master-data/bulk",
  validateRequired(["schools", "departments", "academicYears"]),
  adminController.createMasterDataBulk,
);

router.post(
  "/master-data/schools",
  validateRequired(["name", "code"]),
  adminController.createSchool,
);

router.put("/master-data/schools/:id", adminController.updateSchool);

router.post(
  "/master-data/departments",
  validateRequired(["name", "code", "school"]),
  adminController.createDepartment,
);

router.put("/master-data/departments/:id", adminController.updateDepartment);

router.post(
  "/master-data/academic-years",
  validateRequired(["year"]),
  adminController.createAcademicYear,
);

/**
 * Department configuration & feature locks
 */
router.get(
  "/department-config",
  validateRequired(["academicYear", "school", "department"], "query"),
  adminController.getDepartmentConfig,
);

router.post(
  "/department-config",
  validateRequired(["academicYear", "school", "department"]),
  adminController.createDepartmentConfig,
);

router.put("/department-config/:id", adminController.updateDepartmentConfig);

router.patch(
  "/department-config/:id/feature-lock",
  adminController.updateFeatureLock,
);

/**
 * Component library
 */
router.get(
  "/component-library",
  validateRequired(["academicYear", "school", "department"], "query"),
  adminController.getComponentLibrary,
);

router.post(
  "/component-library",
  validateRequired(["academicYear", "school", "department", "components"]),
  adminController.createComponentLibrary,
);

router.put("/component-library/:id", adminController.updateComponentLibrary);

/**
 * Marking schema
 */
router.get(
  "/marking-schema",
  validateRequired(["academicYear", "school", "department"], "query"),
  adminController.getMarkingSchema,
);

router.post(
  "/marking-schema",
  validateRequired(["academicYear", "school", "department", "reviews"]),
  adminController.createOrUpdateMarkingSchema,
);

router.put("/marking-schema/:id", adminController.updateMarkingSchema);

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
    "department",
  ]),
  adminController.createFaculty,
);

router.post(
  "/faculty/bulk",
  validateRequired(["facultyList"]),
  adminController.createFacultyBulk,
);

router.post(
  "/faculty/admin",
  validateRequired(["name", "emailId", "employeeId", "password"]),
  adminController.createAdmin,
);

router.put("/faculty/:employeeId", adminController.updateFaculty);

router.delete("/faculty/:employeeId", adminController.deleteFaculty);

/**
 * Project coordinators
 */
router.get("/project-coordinators", adminController.getProjectCoordinators);

router.post(
  "/project-coordinators",
  validateRequired(["facultyId", "academicYear", "school", "department"]),
  adminController.assignProjectCoordinator,
);

router.put(
  "/project-coordinators/:id",
  adminController.updateProjectCoordinator,
);

router.patch(
  "/project-coordinators/:id/permissions",
  validateRequired(["permissions"]),
  adminController.updateCoordinatorPermissions,
);

router.delete(
  "/project-coordinators/:id",
  adminController.removeProjectCoordinator,
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
    "department",
    "academicYear",
  ]),
  adminController.createStudent,
);

router.post(
  "/student/bulk",
  validateRequired(["students", "academicYear", "school", "department"]),
  adminController.bulkUploadStudents,
);

router.put("/students/:regNo", adminController.updateStudent);

router.delete("/students/:regNo", adminController.deleteStudent);

router.get("/students/:regNo", adminController.getStudentByRegNo);

/**
 * Projects & best project flag
 */
router.get("/projects", adminController.getAllProjects);

router.get("/projects/guides", adminController.getAllGuideWithProjects);

router.get("/projects/panels", adminController.getAllPanelsWithProjects);

router.patch("/projects/:id/best-project", adminController.markAsBestProject);

/**
 * Panels: CRUD and assignment
 */
router.get("/panels", adminController.getAllPanels);

router.post(
  "/panels",
  validateRequired([
    "memberEmployeeIds",
    "academicYear",
    "school",
    "department",
  ]),
  validatePanelSize,
  adminController.createPanelManually,
);

router.post(
  "/panels/auto-create",
  validateRequired(["departments", "school", "academicYear"]),
  adminController.autoCreatePanels,
);

router.put("/panels/:id", adminController.updatePanel);

router.delete("/panels/:id", adminController.deletePanel);

router.post(
  "/panels/assign",
  validateRequired(["panelId", "projectId"]),
  adminController.assignPanelToProject,
);

router.post(
  "/panels/auto-assign",
  validateRequired(["academicYear", "school", "department"]),
  adminController.autoAssignPanelsToProjects,
);

/**
 * Faculty requests (unlock, extensions, etc.)
 */
router.get("/requests", adminController.getAllRequests);

router.put(
  "/requests/:id/status",
  validateRequired(["status"]),
  adminController.updateRequestStatus,
);

/**
 * Broadcast messages
 */
router.get("/broadcasts", adminController.getBroadcastMessages);

router.post(
  "/broadcasts",
  validateRequired(["message", "expiresAt"]),
  adminController.createBroadcastMessage,
);

router.put("/broadcasts/:id", adminController.updateBroadcastMessage);

router.delete("/broadcasts/:id", adminController.deleteBroadcastMessage);

/**
 * Reporting endpoints
 */
router.get(
  "/reports/overview",
  validateRequired(["academicYear", "school", "department"], "query"),
  adminController.getOverviewReport,
);

router.get(
  "/reports/projects",
  validateRequired(["academicYear", "school", "department"], "query"),
  adminController.getProjectsReport,
);

router.get(
  "/reports/marks",
  validateRequired(["academicYear", "school", "department"], "query"),
  adminController.getMarksReport,
);

router.get(
  "/reports/faculty-workload",
  validateRequired(["academicYear", "school", "department"], "query"),
  adminController.getFacultyWorkloadReport,
);

router.get(
  "/reports/student-performance",
  validateRequired(["academicYear", "school", "department"], "query"),
  adminController.getStudentPerformanceReport,
);

export default router;
