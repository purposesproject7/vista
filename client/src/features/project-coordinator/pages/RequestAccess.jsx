// src/features/project-coordinator/pages/RequestAccess.jsx
import React, { useState } from "react";
import Navbar from "../../../shared/components/Navbar";
import CoordinatorTabs from "../components/shared/CoordinatorTabs";
import { useToast } from "../../../shared/hooks/useToast";
import { requestAccess as apiRequestAccess } from "../services/coordinatorApi";
import {
  CalendarIcon,
  ExclamationCircleIcon,
  SwatchIcon,
} from "@heroicons/react/24/outline";

const RequestAccess = () => {
  const [formData, setFormData] = useState({
    featureName: "project_management",
    reason: "",
    priority: "medium",
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const features = [
    { value: "faculty_management", label: "Faculty Management" },
    { value: "project_management", label: "Project Management" },
    { value: "student_management", label: "Student Management" },
    { value: "panel_management", label: "Panel Management" },
  ];

  const priorities = [
    { value: "low", label: "Low - Can wait a week" },
    { value: "medium", label: "Medium - Needed within 3 days" },
    { value: "high", label: "High - Critical / Urgent" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      showToast("Please provide a reason for access", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequestAccess(formData);

      if (response.success) {
        showToast(
          "Access request submitted successfully! Admin will review it.",
          "success"
        );
        // Reset form to defaults
        setFormData({
          featureName: "project_management",
          reason: "",
          priority: "medium",
        });
      } else {
        showToast(response.message || "Failed to send request", "error");
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar />
      <CoordinatorTabs />
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Request Feature Access
          </h1>
          <p className="mt-2 text-gray-600">
            Submit a formal request to unlock management capabilities for your
            coordinator account.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Feature Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start with Feature <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SwatchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      name="featureName"
                      value={formData.featureName}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      {features.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Priority Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ExclamationCircleIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      {priorities.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Reason Textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Justification <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows="5"
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-y"
                  placeholder="Please explain why you need this access and what tasks you intend to perform..."
                  required
                />
              </div>

              <div className="pt-4 flex items-center justify-end border-t border-gray-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {loading ? "Submitting Request..." : "Submit Access Request"}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-amber-50 px-6 py-4 border-t border-amber-100">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon
                  className="h-5 w-5 text-amber-600"
                  aria-hidden="true"
                />
              </div>
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Once approved, access will be granted
                until the deadline set by the admin. You will be notified via
                email upon approval or rejection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestAccess;
