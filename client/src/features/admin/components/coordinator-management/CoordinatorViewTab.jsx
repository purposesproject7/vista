// src/features/admin/components/coordinator-management/CoordinatorViewTab.jsx
import React, { useState, useEffect } from "react";
import {
    PencilSquareIcon,
    TrashIcon,
    ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { fetchCoordinators, removeCoordinator, updateCoordinator } from "../../services/adminApi";
import CoordinatorPermissionModal from "./CoordinatorPermissionModal";

const CoordinatorViewTab = () => {
    const [coordinators, setCoordinators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        school: "",
        programme: "",
        academicYear: "",
    });
    const [selectedCoordinator, setSelectedCoordinator] = useState(null);
    const [showPermissionModal, setShowPermissionModal] = useState(false);

    useEffect(() => {
        loadCoordinators();
    }, [filters]);

    const loadCoordinators = async () => {
        setLoading(true);
        try {
            const response = await fetchCoordinators({
                school: filters.school || undefined,
                program: filters.programme || undefined,
                academicYear: filters.academicYear || undefined,
            });

            if (response.success) {
                setCoordinators(response.coordinators || []);
            }
        } catch (error) {
            console.error("Error loading coordinators:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveCoordinator = async (id, facultyName) => {
        if (
            !window.confirm(
                `Are you sure you want to remove ${facultyName} as coordinator?`
            )
        ) {
            return;
        }

        try {
            await removeCoordinator(id);
            loadCoordinators();
        } catch (error) {
            console.error("Error removing coordinator:", error);
            alert("Failed to remove coordinator");
        }
    };

    const handleTogglePrimary = async (coordinator) => {
        try {
            await updateCoordinator(coordinator._id, {
                isPrimary: !coordinator.isPrimary,
            });
            loadCoordinators();
        } catch (error) {
            console.error("Error updating coordinator:", error);
            alert("Failed to update coordinator");
        }
    };

    const handleEditPermissions = (coordinator) => {
        setSelectedCoordinator(coordinator);
        setShowPermissionModal(true);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        School
                    </label>
                    <input
                        type="text"
                        value={filters.school}
                        onChange={(e) => setFilters({ ...filters, school: e.target.value })}
                        placeholder="Filter by school"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Programme
                    </label>
                    <input
                        type="text"
                        value={filters.programme}
                        onChange={(e) =>
                            setFilters({ ...filters, programme: e.target.value })
                        }
                        placeholder="Filter by programme"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Academic Year
                    </label>
                    <input
                        type="text"
                        value={filters.academicYear}
                        onChange={(e) =>
                            setFilters({ ...filters, academicYear: e.target.value })
                        }
                        placeholder="Filter by year"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Coordinators List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            ) : coordinators.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    No coordinators found
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Faculty
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    School / Programme
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Academic Year
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Permissions
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {coordinators.map((coordinator) => (
                                <tr key={coordinator._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {coordinator.faculty?.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {coordinator.faculty?.employeeId}
                                                </div>
                                            </div>
                                            {coordinator.isPrimary && (
                                                <ShieldCheckIcon
                                                    className="ml-2 h-5 w-5 text-blue-600"
                                                    title="Primary Coordinator"
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {coordinator.school}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {coordinator.program}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {coordinator.academicYear}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${coordinator.isActive
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                                }`}
                                        >
                                            {coordinator.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex flex-wrap gap-1">
                                            {Object.entries(coordinator.permissions || {}).map(
                                                ([key, value]) =>
                                                    value?.enabled && (
                                                        <span
                                                            key={key}
                                                            className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                                                        >
                                                            {key.replace(/_/g, " ")}
                                                        </span>
                                                    )
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button
                                            onClick={() => handleEditPermissions(coordinator)}
                                            className="text-blue-600 hover:text-blue-900"
                                            title="Edit Permissions"
                                        >
                                            <PencilSquareIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleTogglePrimary(coordinator)}
                                            className="text-purple-600 hover:text-purple-900"
                                            title={
                                                coordinator.isPrimary
                                                    ? "Remove as Primary"
                                                    : "Set as Primary"
                                            }
                                        >
                                            <ShieldCheckIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleRemoveCoordinator(
                                                    coordinator._id,
                                                    coordinator.faculty?.name
                                                )
                                            }
                                            className="text-red-600 hover:text-red-900"
                                            title="Remove Coordinator"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Permission Modal */}
            {showPermissionModal && selectedCoordinator && (
                <CoordinatorPermissionModal
                    coordinator={selectedCoordinator}
                    onClose={() => {
                        setShowPermissionModal(false);
                        setSelectedCoordinator(null);
                    }}
                    onSave={() => {
                        loadCoordinators();
                        setShowPermissionModal(false);
                        setSelectedCoordinator(null);
                    }}
                />
            )}
        </div>
    );
};

export default CoordinatorViewTab;
