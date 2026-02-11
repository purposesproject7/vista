// src/features/admin/components/coordinator-management/CoordinatorUploadTab.jsx  
import React, { useState, useEffect } from "react";
import { fetchFaculty, fetchMasterData, assignCoordinator } from "../../services/adminApi";

const CoordinatorUploadTab = ({ onSuccess }) => {
    const [formData, setFormData] = useState({
        facultyId: "",
        school: "",
        programme: "",
        academicYear: "",
        isPrimary: false,
    });
    const [faculties, setFaculties] = useState([]);
    const [masterData, setMasterData] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Load master data
            const masterResponse = await fetchMasterData();
            if (masterResponse.success) {
                setMasterData(masterResponse.data);
            }

            // Load faculties marked as project coordinators
            const facultyResponse = await fetchFaculty({ isProjectCoordinator: true });
            if (facultyResponse.success) {
                setFaculties(facultyResponse.faculty || []);
            }
        } catch (error) {
            console.error("Error loading data:", error);
            setMessage({ type: "error", text: "Failed to load data" });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const response = await assignCoordinator({
                facultyId: formData.facultyId,
                school: formData.school,
                program: formData.programme,
                academicYear: formData.academicYear,
                isPrimary: formData.isPrimary,
            });

            if (response.success) {
                setMessage({ type: "success", text: "Coordinator assigned successfully!" });
                setFormData({
                    facultyId: "",
                    school: "",
                    programme: "",
                    academicYear: "",
                    isPrimary: false,
                });
                setTimeout(() => {
                    if (onSuccess) onSuccess();
                }, 1500);
            } else {
                setMessage({ type: "error", text: response.message || "Failed to assign coordinator" });
            }
        } catch (error) {
            console.error("Error assigning coordinator:", error);
            setMessage({
                type: "error",
                text: error.response?.data?.message || "Failed to assign coordinator",
            });
        } finally {
            setLoading(false);
        }
    };

    const selectedFaculty = faculties.find((f) => f._id === formData.facultyId);

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Assign Project Coordinator
            </h2>

            {message.text && (
                <div
                    className={`mb-6 p-4 rounded-lg ${message.type === "success"
                            ? "bg-green-50 text-green-800"
                            : "bg-red-50 text-red-800"
                        }`}
                >
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Faculty Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Faculty <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.facultyId}
                        onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select Faculty</option>
                        {faculties.map((faculty) => (
                            <option key={faculty._id} value={faculty._id}>
                                {faculty.name} ({faculty.employeeId}) - {faculty.school}
                            </option>
                        ))}
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                        Only showing faculty with project coordinator status enabled
                    </p>
                </div>

                {/* Academic Context */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            School <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.school}
                            onChange={(e) => setFormData({ ...formData, school: e.target.value, programme: "" })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select School</option>
                            {masterData.schools?.map((school) => (
                                <option key={school._id} value={school.name}>
                                    {school.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Programme <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.programme}
                            onChange={(e) => setFormData({ ...formData, programme: e.target.value })}
                            required
                            disabled={!formData.school}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        >
                            <option value="">Select Programme</option>
                            {masterData.programs
                                ?.filter((p) => p.school === formData.school)
                                .map((program) => (
                                    <option key={program._id} value={program.name}>
                                        {program.name}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Academic Year <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.academicYear}
                            onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Year</option>
                            {masterData.academicYears?.map((year) => (
                                <option key={year._id} value={year.year}>
                                    {year.year}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Primary Coordinator */}
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="isPrimary"
                        checked={formData.isPrimary}
                        onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPrimary" className="ml-2 block text-sm text-gray-900">
                        Set as Primary Coordinator for this context
                    </label>
                </div>

                {/* Selected Faculty Info */}
                {selectedFaculty && (
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                            Selected Faculty Details
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-gray-600">Name:</span>{" "}
                                <span className="font-medium">{selectedFaculty.name}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Employee ID:</span>{" "}
                                <span className="font-medium">{selectedFaculty.employeeId}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Email:</span>{" "}
                                <span className="font-medium">{selectedFaculty.email}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">School:</span>{" "}
                                <span className="font-medium">{selectedFaculty.school}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            setFormData({
                                facultyId: "",
                                school: "",
                                programme: "",
                                academicYear: "",
                                isPrimary: false,
                            });
                            setMessage({ type: "", text: "" });
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        disabled={loading}
                    >
                        Clear
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        {loading ? "Assigning..." : "Assign Coordinator"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CoordinatorUploadTab;
