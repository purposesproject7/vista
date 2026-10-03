import React, { useState, useEffect } from "react";
import { XMarkIcon, CheckCircleIcon, TrashIcon, UserIcon } from "@heroicons/react/24/outline";
import Button from "../../../../shared/components/Button";
import Input from "../../../../shared/components/Input";
import { fetchFaculty, updatePanel } from "../../services/adminApi";
import { useToast } from "../../../../shared/hooks/useToast";

const EditPanelModal = ({ panel, filters, onClose, onSuccess }) => {
  const [panelName, setPanelName] = useState(panel.panelName || "");
  const [availableFaculties, setAvailableFaculties] = useState([]);
  const [selectedFaculties, setSelectedFaculties] = useState(
    panel.members?.map((m) => m.employeeId || m.faculty?.employeeId) || []
  );
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadAvailableFaculties();
  }, [filters]);

  const loadAvailableFaculties = async () => {
    try {
      setLoadingFaculties(true);
      const response = await fetchFaculty({
        school: filters.school,
        program: filters.program,
      });

      if (response.success) {
        setAvailableFaculties(response.faculty || []);
      }
    } catch (error) {
      console.error("Error fetching faculties:", error);
      showToast("Failed to fetch available faculties", "error");
    } finally {
      setLoadingFaculties(false);
    }
  };

  const handleToggleFaculty = (empId) => {
    setSelectedFaculties((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleRemoveFaculty = (empId) => {
    setSelectedFaculties((prev) => prev.filter((id) => id !== empId));
  };

  const handleSubmit = async () => {
    if (selectedFaculties.length === 0) {
      showToast("Panel must have at least one member", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      await updatePanel(panel.id, {
        panelName: panelName || undefined,
        memberEmployeeIds: selectedFaculties,
      });

      showToast("Panel updated successfully", "success");
      onSuccess();
    } catch (error) {
      console.error("Error updating panel:", error);
      showToast(error.response?.data?.message || "Failed to update panel", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to find full faculty object for rendering
  const getFacultyDetails = (empId) => {
    // Check in available first
    const found = availableFaculties.find((f) => f.employeeId === empId);
    if (found) return found;

    // Check in existing members
    const existing = panel.members?.find(
      (m) => m.employeeId === empId || m.faculty?.employeeId === empId
    );
    if (existing) {
      return existing.faculty || existing; // handle nested
    }

    return { employeeId: empId, name: empId };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm sm:p-0">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <UserIcon className="w-6 h-6 mr-2 text-blue-600" />
            Edit Panel Members
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
          {/* Left Side - Current Selection */}
          <div className="flex-1 space-y-4">
            <h3 className="text-md font-medium text-gray-900 border-b pb-2">
              Panel Information
            </h3>
            <Input
              label="Panel Name"
              value={panelName}
              onChange={(e) => setPanelName(e.target.value)}
              placeholder="e.g. Panel 1"
            />

            <h3 className="text-md font-medium text-gray-900 border-b pb-2 mt-6">
              Selected Members ({selectedFaculties.length})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {selectedFaculties.map((empId) => {
                const fac = getFacultyDetails(empId);
                return (
                  <div
                    key={empId}
                    className="flex justify-between items-center p-3 border rounded-lg bg-blue-50 border-blue-200"
                  >
                    <div>
                      <p className="text-sm font-medium text-blue-900">{fac.name}</p>
                      <p className="text-xs text-blue-700">{fac.employeeId}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveFaculty(empId)}
                      className="text-red-500 hover:text-red-700 bg-white p-1 rounded-full border border-red-100"
                      title="Remove Member"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              {selectedFaculties.length === 0 && (
                <p className="text-sm text-gray-500 italic">No members selected.</p>
              )}
            </div>
          </div>

          {/* Right Side - Available Faculties */}
          <div className="flex-1 space-y-4">
            <h3 className="text-md font-medium text-gray-900 border-b pb-2">
              Available Faculty ({availableFaculties.length})
            </h3>
            {loadingFaculties ? (
              <p className="text-sm text-gray-500">Loading faculties...</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto pr-2">
                {availableFaculties.map((faculty) => {
                  const isSelected = selectedFaculties.includes(faculty.employeeId);
                  return (
                    <button
                      key={faculty.employeeId}
                      onClick={() => handleToggleFaculty(faculty.employeeId)}
                      className={`text-left p-3 border rounded-lg transition-colors ${
                        isSelected
                          ? "bg-blue-100 border-blue-400 cursor-not-allowed opacity-50"
                          : "bg-white border-gray-200 hover:border-blue-400 hover:bg-gray-50"
                      }`}
                      disabled={isSelected}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900 block truncate max-w-[200px]" title={faculty.name}>
                            {faculty.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {faculty.employeeId}
                          </p>
                        </div>
                        {isSelected && <CheckCircleIcon className="w-5 h-5 text-blue-600" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0 rounded-b-xl">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || selectedFaculties.length === 0}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditPanelModal;
