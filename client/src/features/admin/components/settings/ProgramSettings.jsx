// src/features/admin/components/settings/ProgramSettings.jsx
import React, { useState, useEffect } from "react";
import Card from "../../../../shared/components/Card";
import Button from "../../../../shared/components/Button";
import Input from "../../../../shared/components/Input";
import Select from "../../../../shared/components/Select";
import Modal from "../../../../shared/components/Modal";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "../../../../shared/hooks/useToast";
import {
  createProgram,
  updateProgram,
  deleteProgram,
} from "../../services/adminApi";

const ProgramSettings = ({ schools, programs, onUpdate }) => {
  const [programsBySchool, setProgramsBySchool] = useState(programs);

  // Sync with props when they change
  // Group programs by school
  useEffect(() => {
    const grouped = {};
    if (Array.isArray(programs)) {
      programs.forEach((prog) => {
        const schoolCode = prog.school;
        if (!grouped[schoolCode]) {
          grouped[schoolCode] = [];
        }
        grouped[schoolCode].push(prog);
      });
    } else if (programs && typeof programs === "object") {
      // Handle case where it might already be grouped or empty
      Object.assign(grouped, programs);
    }
    setProgramsBySchool(grouped);
  }, [programs]);
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [formData, setFormData] = useState({
    schoolCode: "",
    name: "",
    code: "",
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const handleAdd = () => {
    setEditingProgram(null);
    setFormData({ schoolCode: schools[0]?.code || "", name: "", code: "" });
    setShowModal(true);
  };

  const handleEdit = (program, schoolCode) => {
    setEditingProgram({ ...program, schoolCode });
    setFormData({ schoolCode, name: program.name, code: program.code });
    setShowModal(true);
  };

  const handleDelete = async (programId, schoolCode) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this program? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      const response = await deleteProgram(programId);

      if (response.success) {
        const updated = { ...programsBySchool };
        updated[schoolCode] = updated[schoolCode].filter(
          (p) => p.id !== programId
        );
        setProgramsBySchool(updated);
        onUpdate(updated);
        showToast("Program deleted successfully", "success");
      } else {
        showToast(response.message || "Failed to delete program", "error");
      }
    } catch (error) {
      console.error("Error deleting program:", error);
      showToast(
        error.response?.data?.message || "Failed to delete program",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.code.trim() ||
      !formData.schoolCode
    ) {
      showToast("Please fill in all fields", "error");
      return;
    }

    try {
      setSaving(true);
      let response;

      if (editingProgram) {
        // Update existing program
        response = await updateProgram(
          editingProgram.id,
          formData.name.trim(),
          formData.code.trim().toUpperCase(),
          formData.schoolCode
        );
      } else {
        // Create new program
        response = await createProgram(
          formData.name.trim(),
          formData.code.trim().toUpperCase(),
          formData.schoolCode
        );
      }

      if (response.success) {
        // Reload programs from backend
        window.location.reload(); // Simple approach - reload to get fresh data
        showToast(
          editingProgram
            ? "Program updated successfully"
            : "Program added successfully",
          "success"
        );
      } else {
        showToast(response.message || "Operation failed", "error");
      }
    } catch (error) {
      console.error("Error saving program:", error);
      showToast(
        error.response?.data?.message || "Failed to save program",
        "error"
      );
    } finally {
      setSaving(false);
      setShowModal(false);
      setFormData({ schoolCode: "", name: "", code: "" });
    }
  };

  const schoolOptions = schools.map((school) => ({
    value: school.code,
    label: school.name,
  }));

  return (
    <>
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Programs</h3>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAdd}
              disabled={schools.length === 0}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Program
            </Button>
          </div>

          {schools.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AcademicCapIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>Please add schools first before adding programs</p>
            </div>
          ) : (
            <div className="space-y-6">
              {schools.map((school) => (
                <div key={school.id} className="mb-6 last:mb-0">
                  <h4 className="font-semibold text-gray-900 mb-3 text-lg border-b border-gray-200 pb-2">
                    {school.name}
                  </h4>
                  {!programsBySchool[school.code] ||
                  programsBySchool[school.code].length === 0 ? (
                    <p className="text-gray-500 text-sm italic py-2">
                      No programs added for this school yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {programsBySchool[school.code].map((program) => (
                        <div
                          key={program.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div>
                            <span className="text-gray-900 font-medium">
                              {program.name}
                            </span>
                            <span className="text-gray-500 text-sm ml-2">
                              ({program.code})
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEdit(program, school.code)}
                              disabled={saving}
                            >
                              <PencilIcon className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                handleDelete(program.id, school.code)
                              }
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={saving}
                            >
                              <TrashIcon className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setFormData({ schoolCode: "", name: "", code: "" });
        }}
        title={editingProgram ? "Edit Program" : "Add Program"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.schoolCode}
              onChange={(value) =>
                setFormData({ ...formData, schoolCode: value })
              }
              options={schoolOptions}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Program Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., B.Tech Computer Science"
              required
              className="text-lg py-3"
            />
            <p className="mt-2 text-sm text-gray-500">
              Enter the full program name (e.g., B.Tech CSE, MBA, M.Tech ECE)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Program Code <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              placeholder="e.g., BTECHCSE, MBA"
              required
              className="text-lg py-3"
            />
            <p className="mt-2 text-sm text-gray-500">
              Enter a short code for the program (will be converted to
              uppercase)
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                setFormData({ schoolCode: "", name: "", code: "" });
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving..." : editingProgram ? "Update" : "Add"} Program
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default ProgramSettings;
