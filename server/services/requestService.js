import Request from "../models/requestSchema.js";
import Student from "../models/studentSchema.js";
import { logger } from "../utils/logger.js";

export class RequestService {
  /**
   * Get all requests with filters
   */
  static async getAllRequests(filters = {}) {
    const { facultyType, academicYear, school, department, status } = filters;

    const query = {};
    if (facultyType) query.facultyType = facultyType;
    if (academicYear) query.academicYear = academicYear;
    if (status) query.status = status;

    // Build faculty match for populate
    const facultyMatch = {};
    if (school) facultyMatch.school = { $in: [school] };
    if (department) facultyMatch.department = { $in: [department] };

    const requests = await Request.find(query)
      .populate({
        path: "faculty",
        select: "name employeeId school department",
        match: Object.keys(facultyMatch).length > 0 ? facultyMatch : undefined,
      })
      .populate("student", "name regNo emailId")
      .populate("project", "name")
      .lean();

    // Filter out null faculty (didn't match)
    const filteredRequests = requests.filter((req) => req.faculty !== null);

    // Group by faculty
    const grouped = {};
    filteredRequests.forEach((req) => {
      const facultyId = req.faculty._id.toString();

      if (!grouped[facultyId]) {
        grouped[facultyId] = {
          _id: facultyId,
          name: req.faculty.name,
          employeeId: req.faculty.employeeId,
          school: req.faculty.school,
          department: req.faculty.department,
          requests: [],
        };
      }

      grouped[facultyId].requests.push({
        _id: req._id,
        student: req.student,
        project: req.project,
        reviewType: req.reviewType,
        requestType: req.requestType,
        reason: req.reason,
        status: req.status,
        createdAt: req.createdAt,
      });
    });

    return Object.values(grouped);
  }

  /**
   * Update request status
   */
  static async updateRequestStatus(
    requestId,
    status,
    resolvedBy,
    additionalData = {},
  ) {
    if (!["approved", "rejected"].includes(status)) {
      throw new Error("Status must be 'approved' or 'rejected'.");
    }

    const request = await Request.findById(requestId)
      .populate("student")
      .populate("faculty");

    if (!request) {
      throw new Error("Request not found.");
    }

    if (request.status !== "pending") {
      throw new Error("Request has already been resolved.");
    }

    request.status = status;
    request.resolvedBy = resolvedBy;
    request.resolvedAt = new Date();

    if (additionalData.remarks) {
      request.remarks = additionalData.remarks;
    }

    await request.save();

    // Handle approved requests based on type
    if (status === "approved") {
      const student = request.student;

      switch (request.requestType) {
        case "deadline_extension":
          // Update student approval deadline if provided
          if (additionalData.newDeadline) {
            if (!student.approvals) student.approvals = new Map();

            const reviewApproval =
              student.approvals.get(request.reviewType) || {};
            reviewApproval.locked = false;
            student.approvals.set(request.reviewType, reviewApproval);

            await student.save();
          }
          break;

        case "mark_edit":
          // Unlock marks for editing (handled in marks service)
          break;

        case "resubmission":
          // Allow resubmission
          if (student.approvals?.has(request.reviewType)) {
            const reviewApproval = student.approvals.get(request.reviewType);
            if (reviewApproval.ppt) reviewApproval.ppt.locked = false;
            if (reviewApproval.draft) reviewApproval.draft.locked = false;
            student.approvals.set(request.reviewType, reviewApproval);
            await student.save();
          }
          break;
      }
    }

    logger.info("request_status_updated", {
      requestId,
      status,
      requestType: request.requestType,
      resolvedBy,
    });

    return request;
  }

  /**
   * Create request
   */
  static async createRequest(data, createdBy) {
    const {
      faculty,
      facultyType,
      student,
      project,
      academicYear,
      reviewType,
      requestType,
      reason,
    } = data;

    // Check for duplicate pending request
    const existing = await Request.findOne({
      faculty,
      student,
      reviewType,
      requestType,
      status: "pending",
    });

    if (existing) {
      throw new Error("A pending request already exists for this combination.");
    }

    const request = new Request({
      faculty,
      facultyType,
      student,
      project,
      academicYear,
      reviewType,
      requestType,
      reason,
      status: "pending",
    });

    await request.save();

    logger.info("request_created", {
      requestId: request._id,
      facultyType,
      requestType,
      reviewType,
      createdBy,
    });

    return request;
  }
}
