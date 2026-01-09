import AccessRequest from "../models/accessRequestSchema.js";
import { logger } from "../utils/logger.js";

export class AccessRequestService {
    /**
     * Get all access requests with filters
     * @param {Object} filters
     * @returns {Promise<Array>}
     */
    static async getAllAccessRequests(filters = {}) {
        const { status, priority, school, program } = filters;

        const query = {};
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (school) query.school = school;
        if (program) query.program = program;

        const requests = await AccessRequest.find(query)
            .populate("requestedBy", "name employeeId emailId")
            .populate("approvedBy", "name employeeId")
            .sort({ submittedAt: -1 })
            .lean();

        return requests;
    }

    /**
     * Update access request status
     * @param {string} requestId
     * @param {string} status
     * @param {string} adminId
     * @param {Object} data - { reason, grantStartTime, grantEndTime }
     * @returns {Promise<Object>}
     */
    static async updateAccessRequestStatus(requestId, status, adminId, data = {}) {
        if (!["approved", "rejected"].includes(status)) {
            throw new Error("Status must be 'approved' or 'rejected'.");
        }

        const request = await AccessRequest.findById(requestId);

        if (!request) {
            throw new Error("Access request not found.");
        }

        if (request.status !== "pending") {
            throw new Error("Request has already been resolved.");
        }

        request.status = status;
        request.resolvedAt = new Date();

        if (status === "approved") {
            request.approvedBy = adminId;
            request.approvalReason = data.reason;
            if (data.grantStartTime) request.grantStartTime = data.grantStartTime;
            if (data.grantEndTime) request.grantEndTime = data.grantEndTime;
        } else {
            request.rejectionReason = data.reason;
        }

        await request.save();

        logger.info("access_request_status_updated", {
            requestId,
            status,
            updatedBy: adminId,
        });

        return request;
    }
}
