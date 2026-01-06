import React, { useState, useEffect } from "react";
import Modal from "../../../shared/components/Modal"; // Assuming generic Modal exists
import Button from "../../../shared/components/Button";
import { getComponentLibrary } from "../../../services/componentLibraryApi";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

const AddReviewModal = ({ isOpen, onClose, onSubmit, academicContext }) => {
  const [formData, setFormData] = useState({
    title: "",
    startDate: "",
    endDate: "",
    components: [],
  });

  const [libraryComponents, setLibraryComponents] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  useEffect(() => {
    if (isOpen && academicContext) {
      fetchLibrary();
    }
  }, [isOpen, academicContext]);

  const fetchLibrary = async () => {
    setLoadingLibrary(true);
    try {
      const data = await getComponentLibrary(academicContext);
      setLibraryComponents(data.components || []); // Backend returns object with 'components' array
    } catch (err) {
      console.error("Failed to fetch component library", err);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addComponent = () => {
    setFormData((prev) => ({
      ...prev,
      components: [...prev.components, { componentId: "", maxMarks: 0 }],
    }));
  };

  const updateComponent = (index, field, value) => {
    const updated = [...formData.components];
    updated[index] = { ...updated[index], [field]: value };

    // If componentId changes, update name for display/logic if needed
    if (field === "componentId") {
      const selected = libraryComponents.find((c) => c._id === value);
      if (selected) {
        updated[index].name = selected.name;
        updated[index].maxMarks = selected.suggestedWeight || 0;
      }
    }
    setFormData({ ...formData, components: updated });
  };

  const removeComponent = (index) => {
    const updated = formData.components.filter((_, i) => i !== index);
    setFormData({ ...formData, components: updated });
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Review" size="lg">
      <div className="space-y-4 p-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Review Name
          </label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2.5"
            placeholder="e.g., Review 1"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="datetime-local"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="datetime-local"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2.5"
            />
          </div>
        </div>

        {/* Components */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Components
            </label>
            <button
              onClick={addComponent}
              className="text-blue-600 text-sm font-semibold flex items-center hover:bg-blue-50 px-2 py-1 rounded"
            >
              <PlusIcon className="w-4 h-4 mr-1" /> Add Component
            </button>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {formData.components.map((comp, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <select
                    value={comp.componentId}
                    onChange={(e) =>
                      updateComponent(idx, "componentId", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                  >
                    <option value="">Select Component</option>
                    {libraryComponents.map((lc) => (
                      <option key={lc._id} value={lc._id}>
                        {lc.name} ({lc.suggestedWeight} marks)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <div className="flex items-center border border-gray-300 rounded-md bg-white">
                    <input
                      type="number"
                      value={comp.maxMarks}
                      onChange={(e) =>
                        updateComponent(idx, "maxMarks", e.target.value)
                      }
                      className="w-full p-2 text-sm text-center border-none focus:ring-0 rounded-md"
                    />
                    <span className="text-xs text-gray-500 pr-2">marks</span>
                  </div>
                </div>
                <button
                  onClick={() => removeComponent(idx)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
            {formData.components.length === 0 && (
              <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-sm">
                No components added. Click the + button.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Create Review
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddReviewModal;
