// src/features/project-coordinator/pages/PanelAssignment.jsx
import React, { useState, useCallback } from "react";
import {
  SparklesIcon,
  DocumentPlusIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import AcademicFilterSelector from "../components/shared/AcademicFilterSelector";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import Input from "../../../shared/components/Input";
import Select from "../../../shared/components/Select";
import Badge from "../../../shared/components/Badge";
import { useToast } from "../../../shared/hooks/useToast";
import { autoAssignPanels as apiAutoAssignPanels } from "../services/coordinatorApi";

const PanelAssignment = () => {
  const [filters, setFilters] = useState(null);
  const [activeMode, setActiveMode] = useState(null); // 'manual' or 'auto'
  const [assignedPanels, setAssignedPanels] = useState([]);
  const { showToast } = useToast();

  // Manual assignment state
  const [manualForm, setManualForm] = useState({
    panelId: "",
    projectId: "",
    studentIds: "",
  });
  const [manualError, setManualError] = useState(null);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Auto assignment state
  const [autoForm, setAutoForm] = useState({
    assignmentStrategy: "even_distribution", // even_distribution, specialization_match, balanced_load
    autoAssign: false,
  });
  const [isProcessingAuto, setIsProcessingAuto] = useState(false);

  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters(selectedFilters);
    setActiveMode(null);
    setAssignedPanels([]);
    setManualForm({
      panelId: "",
      projectId: "",
      studentIds: "",
    });
    setAutoForm({
      assignmentStrategy: "even_distribution",
      autoAssign: false,
    });
  }, []);

  // ==================== MANUAL ASSIGNMENT ====================
  const handleManualFormChange = (e) => {
    const { name, value } = e.target;
    setManualForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setManualError(null);
  };

  const handleManualAssign = async () => {
    setManualError(null);

    if (!manualForm.panelId.trim()) {
      setManualError("Panel ID is required");
      return;
    }

    if (!manualForm.projectId.trim()) {
      setManualError("Project ID is required");
      return;
    }

    if (!manualForm.studentIds.trim()) {
      setManualError("At least one student ID is required");
      return;
    }

    try {
      setIsSubmittingManual(true);

      const studentIds = manualForm.studentIds
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);

      const newAssignment = {
        id: Date.now(),
        panelId: manualForm.panelId,
        projectId: manualForm.projectId,
        studentIds,
        studentCount: studentIds.length,
        school: filters.school,
        department: filters.programme,
        academicYear: filters.year,
        semester: filters.semester,
        assignmentType: "manual",
        assignedAt: new Date().toLocaleString(),
      };

      setAssignedPanels((prev) => [...prev, newAssignment]);

      // Reset form
      setManualForm({
        panelId: "",
        projectId: "",
        studentIds: "",
      });

      showToast(
        `Project assigned to panel with ${studentIds.length} student(s)`,
        "success"
      );
    } catch (error) {
      console.error("Error assigning panel:", error);
      showToast("Failed to assign panel", "error");
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // ==================== AUTO ASSIGNMENT ====================
  const handleAutoFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === "checkbox" ? checked : value;

    setAutoForm((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleAutoAssign = async () => {
    if (!autoForm.autoAssign) {
      showToast("Please enable auto-assignment", "error");
      return;
    }

    try {
      setIsProcessingAuto(true);

      const response = await apiAutoAssignPanels({
        school: filters.school,
        department: filters.programme,
        academicYear: filters.year,
        strategy: autoForm.assignmentStrategy,
      });

      if (response.success) {
        showToast(
          response.message || "Auto-assignment completed successfully",
          "success"
        );
      } else {
        showToast(
          response.message || "Failed to complete auto-assignment",
          "error"
        );
      }

      // Reset auto form
      setAutoForm({
        assignmentStrategy: "even_distribution",
        autoAssign: false,
      });
    } catch (error) {
      console.error("Error in auto assignment:", error);
      showToast(
        error.response?.data?.message || "Failed to complete auto-assignment",
        "error"
      );
    } finally {
      setIsProcessingAuto(false);
    }
  };

  const handleRemoveAssignment = useCallback(
    (id) => {
      setAssignedPanels((prev) => prev.filter((a) => a.id !== id));
      showToast("Assignment removed", "info");
    },
    [showToast]
  );

  return (
    <div className="space-y-6">
      {/* Academic Filter Selector */}
      <AcademicFilterSelector onFilterComplete={handleFilterComplete} />

      {filters && !activeMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Manual Assignment */}
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-300"
            onClick={() => setActiveMode("manual")}
          >
            <div className="text-center py-8">
              <DocumentPlusIcon className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Assign Manually
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Manually assign projects to panels
              </p>
            </div>
          </Card>

          {/* Auto Assignment */}
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-300"
            onClick={() => setActiveMode("auto")}
          >
            <div className="text-center py-8">
              <SparklesIcon className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Auto Assign
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Automatically assign using strategies
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* MANUAL ASSIGNMENT MODE */}
      {filters && activeMode === "manual" && (
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Assign Panel Manually
            </h3>
            <Button variant="secondary" onClick={() => setActiveMode(null)}>
              Back
            </Button>
          </div>

          <div className="space-y-4">
            <Input
              label="Panel ID"
              placeholder="Enter panel ID"
              name="panelId"
              value={manualForm.panelId}
              onChange={(e) => handleManualFormChange(e)}
            />

            <Input
              label="Project ID"
              placeholder="Enter project ID"
              name="projectId"
              value={manualForm.projectId}
              onChange={(e) => handleManualFormChange(e)}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student IDs (comma-separated)
              </label>
              <textarea
                placeholder="e.g., STU001, STU002, STU003"
                name="studentIds"
                value={manualForm.studentIds}
                onChange={handleManualFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
              />
            </div>

            {manualError && (
              <p className="text-sm text-red-600 flex items-center">
                <ExclamationCircleIcon className="w-4 h-4 mr-2" />
                {manualError}
              </p>
            )}

            <Button
              onClick={handleManualAssign}
              disabled={isSubmittingManual}
              className="w-full"
            >
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              {isSubmittingManual ? "Assigning..." : "Assign Panel"}
            </Button>
          </div>
        </Card>
      )}

      {/* AUTO ASSIGNMENT MODE */}
      {filters && activeMode === "auto" && (
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Auto Assign Panels
            </h3>
            <Button variant="secondary" onClick={() => setActiveMode(null)}>
              Back
            </Button>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                Auto-assignment will analyze all unassigned panels and projects,
                then distribute students based on your selected strategy.
              </p>
            </div>

            <Select
              label="Assignment Strategy"
              name="assignmentStrategy"
              value={autoForm.assignmentStrategy}
              onChange={(value) =>
                setAutoForm((prev) => ({ ...prev, assignmentStrategy: value }))
              }
              options={[
                {
                  value: "even_distribution",
                  label:
                    "Even Distribution - Distribute students equally across panels",
                },
                {
                  value: "specialization_match",
                  label:
                    "Specialization Matching - Match students to panel specializations",
                },
                {
                  value: "balanced_load",
                  label:
                    "Balanced Load - Consider panel capacity and project requirements",
                },
              ]}
            />

            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="autoAssign"
                  checked={autoForm.autoAssign}
                  onChange={handleAutoFormChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  I confirm to proceed with auto-assignment
                </span>
              </label>
            </div>

            <Button
              onClick={handleAutoAssign}
              disabled={!autoForm.autoAssign || isProcessingAuto}
              className="w-full"
            >
              <SparklesIcon className="w-5 h-5 mr-2" />
              {isProcessingAuto ? "Processing..." : "Start Auto-Assignment"}
            </Button>
          </div>
        </Card>
      )}

      {/* ASSIGNED PANELS LIST */}
      {assignedPanels.length > 0 && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Panel Assignments
              </h3>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                {assignedPanels.length} Assignments
              </span>
            </div>

            <div className="space-y-3">
              {assignedPanels.map((assignment) => (
                <div
                  key={assignment.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          Panel: {assignment.panelId}
                        </h4>
                        <Badge
                          label={
                            assignment.assignmentType === "manual"
                              ? "Manual"
                              : "Auto"
                          }
                          variant={
                            assignment.assignmentType === "manual"
                              ? "blue"
                              : "green"
                          }
                        />
                        {assignment.status === "processing" && (
                          <Badge label="Processing" variant="yellow" />
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wider">
                            Project ID
                          </p>
                          <p className="font-medium text-gray-900">
                            {assignment.projectId}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wider">
                            Students
                          </p>
                          <p className="font-medium text-gray-900">
                            {assignment.studentCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wider">
                            Assignment Type
                          </p>
                          <p className="font-medium text-gray-900 capitalize">
                            {assignment.assignmentType}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wider">
                            Assigned At
                          </p>
                          <p className="font-medium text-gray-900">
                            {assignment.assignedAt}
                          </p>
                        </div>
                      </div>

                      {assignment.strategyLabel && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 uppercase tracking-wider">
                            Strategy
                          </p>
                          <p className="font-medium text-gray-900">
                            {assignment.strategyLabel}
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleRemoveAssignment(assignment.id)}
                      className="ml-4 text-red-600 hover:text-red-800 shrink-0"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PanelAssignment;
