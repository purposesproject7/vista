import React, { useState, useEffect } from "react";
import { fetchRequests, updateRequestStatus } from "../../services/adminApi";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ExclamationCircleIcon,
  UserIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../shared/hooks/useAuth";
import AccessRequestList from "./AccessRequestList"; // Import the new component

const RequestList = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("faculty"); // 'faculty' or 'access'
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtering
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Action Modals
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [actionRemarks, setActionRemarks] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeTab === "faculty") {
      loadRequests();
    }
  }, [activeTab]);

  const loadRequests = async () => {
    // ... existing loadRequests logic ...
    try {
      setLoading(true);
      // Pass filters if needed, currently fetching all suitable for admin view
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

  // ... existing handler functions ...

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
        // Update local state
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
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
    }
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
      <div className="bg-white rounded-lg p-1 shadow-sm inline-flex">
        <button
          onClick={() => setActiveTab("faculty")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "faculty"
            ? "bg-indigo-50 text-indigo-700 shadow-sm"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
        >
          <UserIcon className="h-4 w-4" />
          Faculty Requests
        </button>
        <button
          onClick={() => setActiveTab("access")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "access"
            ? "bg-indigo-50 text-indigo-700 shadow-sm"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
        >
          <ShieldCheckIcon className="h-4 w-4" />
          Access Requests
        </button>
      </div>

      {activeTab === "access" ? (
        <AccessRequestList />
      ) : (
        <div className="bg-white rounded-lg shadow">
          {/* Header & Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">
                  Faculty Requests
                </h2>
                <p className="text-sm text-gray-500">
                  Manage requests from guides and panelists
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search requests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Types</option>
                  <option value="deadline_extension">Deadline Extension</option>
                  <option value="mark_edit">Mark Edit</option>
                  <option value="resubmission">Resubmission</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Request Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Faculty & Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Context
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <ExclamationCircleIcon className="h-10 w-10 text-gray-300 mb-3" />
                        <p>No requests found matching your filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {req.faculty?.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            for {req.student?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                            {req.requestType?.replace("_", " ").toUpperCase()}
                          </span>
                          <p
                            className="text-xs text-gray-500 max-w-xs truncate"
                            title={req.reason}
                          >
                            {req.reason}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          <span>{req.reviewType}</span>
                          <span className="text-xs text-gray-400">
                            {req.school}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {req.status === "pending" && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleActionClick(req, "reject")}
                              className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                              title="Reject"
                            >
                              <XCircleIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleActionClick(req, "approve")}
                              className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                              title="Approve"
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Modal (Only for Faculty Requests) */}
      {selectedRequest && activeTab === "faculty" && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-5 border w-full max-w-md shadow-lg rounded-lg bg-white">
            <div className="mt-3 text-center sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900 capitalize">
                {actionType} Request
              </h3>

              <div className="mt-2 text-sm text-gray-500 mb-4">
                <p>
                  Request from:{" "}
                  <span className="font-semibold">
                    {selectedRequest.faculty?.name}
                  </span>
                </p>
                <p>Type: {selectedRequest.requestType}</p>
                <p>Reason: {selectedRequest.reason}</p>
              </div>

              <div className="mt-4 space-y-4">
                {actionType === "approve" &&
                  selectedRequest.requestType === "deadline_extension" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        New Deadline (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={newDeadline}
                        onChange={(e) => setNewDeadline(e.target.value)}
                        className="w-full border rounded px-2 py-1.5 text-sm"
                      />
                    </div>
                  )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {actionType === "approve"
                      ? "Remarks (Optional)"
                      : "Reason for Rejection"}
                  </label>
                  <textarea
                    className="w-full border rounded p-2 text-sm"
                    rows="3"
                    value={actionRemarks}
                    onChange={(e) => setActionRemarks(e.target.value)}
                    placeholder={
                      actionType === "approve"
                        ? "Add any notes..."
                        : "Why is this being rejected?"
                    }
                  ></textarea>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-white text-gray-500 border border-gray-300 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAction}
                  className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${actionType === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                    }`}
                  disabled={submitting}
                >
                  {submitting
                    ? "Processing..."
                    : actionType === "approve"
                      ? "Approve"
                      : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestList;
