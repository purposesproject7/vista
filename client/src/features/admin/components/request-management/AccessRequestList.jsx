import React, { useState, useEffect } from "react";
import {
    fetchAccessRequests,
    updateAccessRequestStatus,
} from "../../services/adminApi";
import {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ExclamationCircleIcon
} from "@heroicons/react/24/outline";

/**
 * AccessRequestList Component
 * Displays a list of access requests from project coordinators.
 * Allows admins to approve or reject requests.
 */
const AccessRequestList = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filtering
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Action Modals
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
    const [actionReason, setActionReason] = useState("");
    const [grantStartTime, setGrantStartTime] = useState("");
    const [grantEndTime, setGrantEndTime] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const data = await fetchAccessRequests();
            if (data.success) {
                setRequests(data.data || []);
            } else {
                setError("Failed to fetch access requests.");
            }
        } catch (err) {
            setError(err.message || "An error occurred fetching requests.");
        } finally {
            setLoading(false);
        }
    };

    const filteredRequests = requests.filter((req) => {
        const matchesStatus = statusFilter === "all" || req.status === statusFilter;
        const matchesSearch =
            (req.requestedBy?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (req.requestedBy?.employeeId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (req.featureName || "").toLowerCase().includes(searchQuery.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    const handleActionClick = (request, type) => {
        setSelectedRequest(request);
        setActionType(type);
        setActionReason("");

        if (type === 'approve') {
            const now = new Date();
            // Adjust to local ISO string for datetime-local input
            const localStart = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            setGrantStartTime(localStart);

            const nextWeek = new Date(now);
            nextWeek.setDate(now.getDate() + 7);
            const localEnd = new Date(nextWeek.getTime() - (nextWeek.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            setGrantEndTime(localEnd);
        } else {
            setGrantStartTime("");
            setGrantEndTime("");
        }
    };

    const handleCloseModal = () => {
        setSelectedRequest(null);
        setActionType(null);
        setSubmitting(false);
    };

    const handleSubmitAction = async () => {
        if (!actionReason && actionType === 'reject') {
            alert("Please provide a reason for rejection.");
            return;
        }

        try {
            setSubmitting(true);
            const status = actionType === 'approve' ? 'approved' : 'rejected';

            const payload = {
                status,
                reason: actionReason,
            };

            if (actionType === 'approve') {
                if (grantStartTime) payload.grantStartTime = grantStartTime;
                if (grantEndTime) payload.grantEndTime = grantEndTime;
            }

            const response = await updateAccessRequestStatus(
                selectedRequest._id,
                status,
                actionReason,
                grantStartTime || null,
                grantEndTime || null
            );

            if (response.success) {
                // Update local state
                setRequests(prev =>
                    prev.map(r => r._id === selectedRequest._id ? response.data : r)
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

    const getPriorityBadge = (priority) => {
        const colors = {
            high: "text-red-600 bg-red-50",
            medium: "text-yellow-600 bg-yellow-50",
            low: "text-blue-600 bg-blue-50"
        };
        return (
            <span className={`px-2 py-1 text-xs font-semibold rounded ${colors[priority] || colors.medium}`}>
                {priority?.toUpperCase()}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
                <span className="font-medium">Error!</span> {error}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Header & Filters */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold text-gray-900">Project Coordinator Requests</h2>
                        <p className="text-sm text-gray-500">Manage feature access requests from coordinators</p>
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature & Priority</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredRequests.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
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
                                            <span className="text-sm font-medium text-gray-900">{req.requestedBy?.name || "Unknown"}</span>
                                            <span className="text-xs text-gray-500">{req.requestedBy?.employeeId}</span>
                                            <span className="text-xs text-gray-400">{req.program}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm text-gray-900 font-medium whitespace-pre-wrap">
                                                {req.featureName ? req.featureName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "Unknown Feature"}
                                            </span>
                                            <div>{getPriorityBadge(req.priority)}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-600 max-w-xs truncate" title={req.reason}>
                                            {req.reason}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <ClockIcon className="h-4 w-4" />
                                            {new Date(req.submittedAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(req.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {req.status === 'pending' && (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleActionClick(req, 'reject')}
                                                    className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                                                    title="Reject"
                                                >
                                                    <XCircleIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleActionClick(req, 'approve')}
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

            {/* Action Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                    <div className="relative p-5 border w-full max-w-md shadow-lg rounded-lg bg-white">
                        <div className="mt-3 text-center sm:text-left">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 capitalize">
                                {actionType} Request
                            </h3>

                            <div className="mt-2 text-sm text-gray-500 mb-4">
                                <p>Request from: <span className="font-semibold">{selectedRequest.requestedBy?.name}</span></p>
                                <p className="mt-1">Feature: {selectedRequest.featureName}</p>
                                <p className="mt-1">Reason: {selectedRequest.reason}</p>
                            </div>

                            <div className="mt-4 space-y-4">
                                {actionType === 'approve' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Grant Start Time</label>
                                            <input
                                                type="datetime-local"
                                                value={grantStartTime}
                                                onChange={(e) => setGrantStartTime(e.target.value)}
                                                className="w-full border rounded px-2 py-1.5 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Grant End Time</label>
                                            <input
                                                type="datetime-local"
                                                value={grantEndTime}
                                                onChange={(e) => setGrantEndTime(e.target.value)}
                                                className="w-full border rounded px-2 py-1.5 text-sm"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        {actionType === 'approve' ? 'Approval Remarks (Optional)' : 'Rejection Reason (Required)'}
                                    </label>
                                    <textarea
                                        className="w-full border rounded p-2 text-sm"
                                        rows="3"
                                        value={actionReason}
                                        onChange={(e) => setActionReason(e.target.value)}
                                        placeholder={actionType === 'approve' ? "Add any notes..." : "Why is this being rejected?"}
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
                                    className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${actionType === 'approve'
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccessRequestList;
