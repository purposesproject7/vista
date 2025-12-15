import express from "express";
import * as facultyController from "../controllers/facultyController.js";
import { authenticate } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";
import { broadcastBlockMiddleware } from "../middlewares/broadcastBlock.js";
import { validateRequired } from "../middlewares/validation.js";

const router = express.Router();

router.use(authenticate);
router.use(requireRole("faculty"));

router.get("/profile", facultyController.getProfile);
router.put("/profile", facultyController.updateProfile);

router.get(
  "/projects",
  broadcastBlockMiddleware,
  facultyController.getAssignedProjects,
);
router.get(
  "/projects/:id",
  broadcastBlockMiddleware,
  facultyController.getProjectDetails,
);

router.get(
  "/students",
  broadcastBlockMiddleware,
  facultyController.getAssignedStudents,
);

router.get(
  "/marking-schema",
  broadcastBlockMiddleware,
  facultyController.getMarkingSchema,
);

router.post(
  "/marks",
  broadcastBlockMiddleware,
  validateRequired([
    "student",
    "project",
    "reviewType",
    "componentMarks",
    "totalMarks",
    "maxTotalMarks",
  ]),
  facultyController.submitMarks,
);
router.put(
  "/marks/:id",
  broadcastBlockMiddleware,
  facultyController.updateMarks,
);
router.get(
  "/marks",
  broadcastBlockMiddleware,
  facultyController.getSubmittedMarks,
);

router.post(
  "/approvals/ppt",
  broadcastBlockMiddleware,
  validateRequired(["studentId", "reviewType"]),
  facultyController.approvePPT,
);

router.post(
  "/approvals/draft",
  broadcastBlockMiddleware,
  validateRequired(["studentId", "reviewType"]),
  facultyController.approveDraft,
);

router.post(
  "/requests",
  broadcastBlockMiddleware,
  validateRequired([
    "student",
    "project",
    "reviewType",
    "requestType",
    "reason",
  ]),
  facultyController.createRequest,
);

router.get(
  "/panels",
  broadcastBlockMiddleware,
  facultyController.getAssignedPanels,
);

router.get("/broadcasts", facultyController.getBroadcasts);

export default router;
