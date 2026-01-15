import React, { useState, useEffect } from "react";
import { fetchRequests, updateRequestStatus } from "../../services/adminApi";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  UserIcon,
  ShieldCheckIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../shared/hooks/useAuth";
import AccessRequestList from "./AccessRequestList";
import Card from "../../../../shared/components/Card";
import Button from "../../../../shared/components/Button";
import Badge from "../../../../shared/components/Badge";
import EmptyState from "../../../../shared/components/EmptyState";
import LoadingSpinner from "../../../../shared/components/LoadingSpinner";
import Modal from "../../../../shared/components/Modal";

const RequestList = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("faculty");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtering
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Action Modals
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [actionRemarks, setActionRemarks] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeTab === "faculty") {
      loadRequests();
    }
  }, [activeTab]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await fetchRequests();
      if (data.success) {
        setRequests(data.data || []);
      } else {
        setError("Failed to fetch requests.");
      }
    } catch (err) {
      setError(err.message || "An error occurred fetching requests.");
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (request, type) => {
    setSelectedRequest(request);
    setActionType(type);
    setActionRemarks("");
    setNewDeadline("");
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
    setActionType(null);
    setSubmitting(false);
  };

  const handleSubmitAction = async () => {
    if (!actionRemarks && actionType === "reject") {
      alert("Please provide remarks for rejection.");
      return;
    }

    try {
      setSubmitting(true);
      const status = actionType === "approve" ? "approved" : "rejected";

      const response = await updateRequestStatus(
        selectedRequest._id,
        status,
        actionRemarks,
        newDeadline || null
      );

      if (response.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r._id === selectedRequest._id ? response.data : r
          )
        );
        handleCloseModal();
      } else {
        alert(response.message || "Failed to update request.");
      }
    } catch (err) {
      alert(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return <Badge variant="success">Approved</Badge>;
      case "rejected":
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  const getRequestTypeBadge = (type) => {
    const typeMap = {
      deadline_extension: { label: "Deadline Extension", variant: "primary" },
      mark_edit: { label: "Mark Edit", variant: "warning" },
      resubmission: { label: "Resubmission", variant: "secondary" }
    };
    const config = typeMap[type] || { label: type, variant: "default" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Filter logic
  const filteredRequests = requests.filter((req) => {
    const matchesStatus =
      statusFilter === "all" || req.status === statusFilter;
    const matchesType =
      typeFilter === "all" || req.requestType === typeFilter;
    const matchesSearch =
      req.faculty?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.faculty?.employeeId
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    return matchesStatus && matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Card padding="sm">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "faculty" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setActiveTab("faculty")}
            className="gap-2"
          >
            <UserIcon className="h-4 w-4" />
            Faculty Requests
          </Button>
          <Button
            variant={activeTab === "access" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setActiveTab("access")}
            className="gap-2"
          >
            <ShieldCheckIcon className="h-4 w-4" />
            Access Requests
          </Button>
        </div>
      </Card>

      {activeTab === "access" ? (
        <AccessRequestList />
      ) : (
        <>
          {/* Filters */}
          <Card padding="sm">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search by faculty, student, or employee ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none text-sm"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none text-sm"
              >
                <option value="all">All Types</option>
                <option value="deadline_extension">Deadline Extension</option>
                <option value="mark_edit">Mark Edit</option>
                <option value="resubmission">Resubmission</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <span className="flex items-center text-sm font-medium text-gray-600 px-3">
                {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
              </span>
            </div>
          </Card>

          {/* Request List */}
          {loading ? (
            <Card>
              <div className="py-12">
                <LoadingSpinner />
              </div>
            </Card>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <EmptyState
                icon={DocumentTextIcon}
                title="No requests found"
                description={searchQuery ? "Try adjusting your search criteria" : "No faculty requests match your current filters"}
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((req) => (
                <Card key={req._id} padding="md" className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Faculty & Student Info */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Faculty</p>
                        <p className="text-sm font-semibold text-gray-900">{req.faculty?.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{req.faculty?.employeeId}</p>
                        <p className="text-xs text-gray-600 mt-1">for {req.student?.name}</p>
                      </div>

                      {/* Request Type & Reason */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Request Type</p>
                        {getRequestTypeBadge(req.requestType)}
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2" title={req.reason}>
                          {req.reason}
                        </p>
                      </div>

                      {/* Context */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Context</p>
                        <p className="text-sm text-gray-700">{req.reviewType}</p>
                        <p className="text-xs text-gray-500 mt-1">{req.school}</p>
                      </div>

                      {/* Status & Date */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Status</p>
                        {getStatusBadge(req.status)}
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                          <ClockIcon className="h-3 w-3" />
                          {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {req.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleActionClick(req, "reject")}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleActionClick(req, "approve")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Action Modal */}
      {selectedRequest && activeTab === "faculty" && (
        <Modal
          isOpen={!!selectedRequest}
          onClose={handleCloseModal}
          title={`${actionType === "approve" ? "Approve" : "Reject"} Request`}
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                Request from:{" "}
                <span className="font-semibold text-gray-900">
                  {selectedRequest.faculty?.name}
                </span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Type: {getRequestTypeBadge(selectedRequest.requestType)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Reason: <span className="text-gray-900">{selectedRequest.reason}</span>
              </p>
            </div>

            {actionType === "approve" &&
              selectedRequest.requestType === "deadline_extension" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Deadline (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                  />
                </div>
              )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {actionType === "approve"
                  ? "Remarks (Optional)"
                  : "Reason for Rejection"}
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                rows="3"
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                placeholder={
                  actionType === "approve"
                    ? "Add any notes..."
                    : "Why is this being rejected?"
                }
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={handleCloseModal}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant={actionType === "approve" ? "primary" : "secondary"}
                onClick={handleSubmitAction}
                disabled={submitting}
                className={actionType === "reject" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
              >
                {submitting
                  ? "Processing..."
                  : actionType === "approve"
                    ? "Approve"
                    : "Reject"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default RequestList;
