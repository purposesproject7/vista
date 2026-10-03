// src/features/admin/components/coordinator-management/CoordinatorPermissionModal.jsx
import React, { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { updateCoordinatorPermissions } from "../../services/adminApi";

const CoordinatorPermissionModal = ({ coordinator, onClose, onSave }) => {
    const [permissions, setPermissions] = useState({
        student_management: {
            enabled: coordinator.permissions?.student_management?.enabled || false,
            deadline: coordinator.permissions?.student_management?.deadline || "",
        },
        faculty_management: {
            enabled: coordinator.permissions?.faculty_management?.enabled || false,
            deadline: coordinator.permissions?.faculty_management?.deadline || "",
        },
        project_management: {
            enabled: coordinator.permissions?.project_management?.enabled || false,
            deadline: coordinator.permissions?.project_management?.deadline || "",
        },
        panel_management: {
            enabled: coordinator.permissions?.panel_management?.enabled || false,
            deadline: coordinator.permissions?.panel_management?.deadline || "",
        },
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleTogglePermission = (permissionKey) => {
        setPermissions({
            ...permissions,
            [permissionKey]: {
                ...permissions[permissionKey],
                enabled: !permissions[permissionKey].enabled,
            },
        });
    };

    const handleDeadlineChange = (permissionKey, deadline) => {
        setPermissions({
            ...permissions,
            [permissionKey]: {
                ...permissions[permissionKey],
                deadline,
            },
        });
    };

    const handleSave = async () => {
        setLoading(true);
        setError("");

        try {
            // Convert deadline strings to Date objects if provided
            const processedPermissions = Object.keys(permissions).reduce((acc, key) => {
                acc[key] = {
                    enabled: permissions[key].enabled,
                    deadline: permissions[key].deadline ? new Date(permissions[key].deadline) : null,
                };
                return acc;
            }, {});

            await updateCoordinatorPermissions(coordinator._id, processedPermissions);
            onSave();
        } catch (err) {
            console.error("Error updating permissions:", err);
            setError(err.response?.data?.message || "Failed to update permissions");
        } finally {
            setLoading(false);
        }
    };

    const permissionLabels = {
        student_management: "Student Management",
        faculty_management: "Faculty Management",
        project_management: "Project Management",
        panel_management: "Panel Management",
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Edit Coordinator Permissions
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Coordinator Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                            Coordinator Details
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-gray-600">Faculty:</span>{" "}
                                <span className="font-medium">{coordinator.faculty?.name}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">School:</span>{" "}
                                <span className="font-medium">{coordinator.school}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Programme:</span>{" "}
                                <span className="font-medium">{coordinator.program}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Academic Year:</span>{" "}
                                <span className="font-medium">{coordinator.academicYear}</span>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Permissions */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">Permissions</h3>
                        {Object.entries(permissionLabels).map(([key, label]) => (
                            <div key={key} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={permissions[key].enabled}
                                            onChange={() => handleTogglePermission(key)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm font-medium text-gray-900">
                                            {label}
                                        </span>
                                    </label>
                                </div>

                                {permissions[key].enabled && (
                                    <div className="mt-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Deadline (Optional)
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={
                                                permissions[key].deadline
                                                    ? new Date(permissions[key].deadline)
                                                        .toISOString()
                                                        .slice(0, 16)
                                                    : ""
                                            }
                                            onChange={(e) =>
                                                handleDeadlineChange(key, e.target.value)
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CoordinatorPermissionModal;
