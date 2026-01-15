// src/features/project-coordinator/components/request-management/RequestList.jsx
import React, { useState, useMemo } from "react";
import Card from "../../../../../shared/components/Card";
import Button from "../../../../../shared/components/Button";
import Modal from "../../../../../shared/components/Modal";
import { useToast } from "../../../../../shared/hooks/useToast";
import { useAuth } from "../../../../../shared/hooks/useAuth";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import RequestFilters from "./RequestFilters";
import FacultyRequestCard from "./FacultyRequestCard";
import { groupRequestsByFaculty, applyFilters } from "./requestUtils";
import {
  fetchRequests,
  approveRequest as apiApproveRequest,
  rejectRequest as apiRejectRequest,
  approveMultipleRequests as apiApproveMultipleRequests,
} from "../../../services/coordinatorApi";

const RequestList = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "",
    status: "",
  });

  const [showApproveAllModal, setShowApproveAllModal] = useState(false);
  const [selectedFacultyId, setSelectedFacultyId] = useState(null);
  const [approvalReason, setApprovalReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch requests from API
  React.useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        const response = await fetchRequests({
          school: user?.school,
          program: user?.program,
        });

        if (response.success) {
          setRequests(response.requests || []);
        } else {
          showToast(response.message || "Failed to load requests", "error");
        }
      } catch (error) {
        console.error("Error fetching requests:", error);
        showToast(
          error.response?.data?.message || "Failed to load requests",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    if (user?.school && user?.department) {
      loadRequests();
    }
  }, [user, showToast]);

  // Apply filters and group by faculty
  const filteredRequests = useMemo(() => {
    return applyFilters(requests, filters);
  }, [requests, filters]);

  const facultyGroups = useMemo(() => {
    return groupRequestsByFaculty(filteredRequests);
  }, [filteredRequests]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      category: "",
      status: "",
    });
  };

  const handleApproveRequest = async (requestId) => {
    try {
      const response = await apiApproveRequest(
        requestId,
        "Approved by coordinator"
      );

      if (response.success) {
        setRequests((prevRequests) =>
          prevRequests.map((request) =>
            request.id === requestId || request._id === requestId
              ? {
                ...request,
                status: "approved",
                approvalReason: "Approved by coordinator",
              }
              : request
          )
        );
        showToast("Request approved successfully", "success");
      } else {
        showToast(response.message || "Failed to approve request", "error");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      showToast(
        error.response?.data?.message || "Failed to approve request",
        "error"
      );
    }
  };

  const handleRejectRequest = async (requestId) => {
    const reason = window.prompt("Please provide a reason for rejection:");
    if (!reason) return;

    try {
      const response = await apiRejectRequest(requestId, reason);

      if (response.success) {
        setRequests((prevRequests) =>
          prevRequests.map((request) =>
            request.id === requestId || request._id === requestId
              ? { ...request, status: "rejected", rejectionReason: reason }
              : request
          )
        );
        showToast("Request rejected", "success");
      } else {
        showToast(response.message || "Failed to reject request", "error");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      showToast(
        error.response?.data?.message || "Failed to reject request",
        "error"
      );
    }
  };

  const handleOpenApproveAllModal = (facultyId) => {
    setSelectedFacultyId(facultyId);
    setShowApproveAllModal(true);
  };

  const handleApproveAllForFaculty = async () => {
    if (!approvalReason.trim()) {
      showToast("Please provide a reason for approval", "error");
      return;
    }

    setIsProcessing(true);

    try {
      const requestIds = pendingRequestsForFaculty.map((r) => r.id || r._id);
      const response = await apiApproveMultipleRequests(
        requestIds,
        approvalReason
      );

      if (response.success) {
        setRequests((prevRequests) =>
          prevRequests.map((request) =>
            requestIds.includes(request.id || request._id)
              ? { ...request, status: "approved", approvalReason }
              : request
          )
        );

        const faculty = facultyGroups.find((f) => f.id === selectedFacultyId);

        showToast(
          `Successfully approved ${requestIds.length} request${requestIds.length !== 1 ? "s" : ""
          } for ${faculty?.name}`,
          "success"
        );

        setShowApproveAllModal(false);
        setSelectedFacultyId(null);
        setApprovalReason("");
      } else {
        showToast(response.message || "Failed to approve requests", "error");
      }
    } catch (error) {
      console.error("Error approving requests:", error);
      showToast(
        error.response?.data?.message || "Failed to approve requests",
        "error"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedFaculty = facultyGroups.find((f) => f.id === selectedFacultyId);
  const pendingRequestsForFaculty =
    selectedFaculty?.requests.filter((r) => r.status === "pending") || [];

  return (
    <>
      {/* Filters */}
      <RequestFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Loading State */}
      {loading ? (
        <Card>
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading requests...</p>
          </div>
        </Card>
      ) : (
        /* Faculty Request Cards */
        <div className="space-y-4">
          {facultyGroups.length === 0 ? (
            <Card>
              <div className="p-8 text-center text-gray-500">
                <p>No requests found matching the selected filters</p>
              </div>
            </Card>
          ) : (
            facultyGroups.map((faculty) => (
              <FacultyRequestCard
                key={faculty.id}
                faculty={faculty}
                requests={faculty.requests}
                onApproveRequest={handleApproveRequest}
                onRejectRequest={handleRejectRequest}
                onApproveAll={handleOpenApproveAllModal}
              />
            ))
          )}
        </div>
      )}

      {/* Approve All Modal */}
      <Modal
        isOpen={showApproveAllModal}
        onClose={() => {
          setShowApproveAllModal(false);
          setSelectedFacultyId(null);
          setApprovalReason("");
        }}
        title={`Approve All Requests for ${selectedFaculty?.name}`}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              You are about to approve{" "}
              <strong>{pendingRequestsForFaculty.length}</strong> pending
              request{pendingRequestsForFaculty.length !== 1 ? "s" : ""} for{" "}
              <strong>{selectedFaculty?.name}</strong>:
            </p>
            <ul className="mt-3 space-y-1 text-sm text-blue-700">
              {pendingRequestsForFaculty.map((req) => (
                <li key={req.id} className="flex items-start gap-2">
                  <CheckCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    {req.studentName} -{" "}
                    {req.category === "guide" ? "Guide" : "Panel"} (
                    {req.projectTitle})
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Approval Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={approvalReason}
              onChange={(e) => setApprovalReason(e.target.value)}
              rows={4}
              placeholder="Please provide a reason for approving all these requests (e.g., 'All requests reviewed and found valid', 'Emergency approval for upcoming deadlines', etc.)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="mt-2 text-xs text-gray-500">
              This reason will be recorded and visible to faculty members.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={() => {
                setShowApproveAllModal(false);
                setSelectedFacultyId(null);
                setApprovalReason("");
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleApproveAllForFaculty}
              disabled={isProcessing || !approvalReason.trim()}
            >
              {isProcessing
                ? "Processing..."
                : `Approve All ${pendingRequestsForFaculty.length} Requests`}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default RequestList;
