import React, { useState, useEffect } from "react";
import Card from "../../../../shared/components/Card";
import Button from "../../../../shared/components/Button";
import Input from "../../../../shared/components/Input";
import Select from "../../../../shared/components/Select";
import {
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

const ReviewEditor = ({ review, onSave, onCancel, availableComponents }) => {
  const [formData, setFormData] = useState(
    review || {
      reviewName: "", // Backend will auto-generate if empty
      displayName: "",
      facultyType: "guide",
      components: [],
      deadline: { from: "", to: "" },
      pptRequired: false,
      draftRequired: false,
      order: 1,
      isActive: true,
    }
  );

  const [dateError, setDateError] = useState("");

  const facultyTypes = [
    { value: "guide", label: "Guide" },
    { value: "panel", label: "Panel" },
    { value: "both", label: "Both" },
  ];

  const handleAddComponent = () => {
    setFormData((prev) => ({
      ...prev,
      components: [
        ...prev.components,
        {
          componentId: "",
          name: "",
          maxMarks: 0,
          subComponents: [], // Start empty as requested
        },
      ],
    }));
  };

  const handleUpdateComponent = (index, field, value) => {
    const updatedComponents = [...formData.components];
    updatedComponents[index] = { ...updatedComponents[index], [field]: value };

    // Auto-fill details if componentId is selected
    if (field === "componentId") {
      const selected = availableComponents.find((c) => c._id === value);
      if (selected) {
        updatedComponents[index].name = selected.name;
        updatedComponents[index].maxMarks = selected.suggestedWeight || 0;
        updatedComponents[index].description = selected.description;
        // User requested: "components are not defined with the sub components... we can select that component... and add sub components to that"
        // So we initialize subComponents as empty to let user define them unique to this review
        if (!updatedComponents[index].subComponents) {
          updatedComponents[index].subComponents = [];
        }
      }
    }

    setFormData({ ...formData, components: updatedComponents });
  };

  const handleAddSubComponent = (compIndex) => {
    const updatedComponents = [...formData.components];
    if (!updatedComponents[compIndex].subComponents) {
      updatedComponents[compIndex].subComponents = [];
    }
    updatedComponents[compIndex].subComponents.push({
      name: "",
      weight: 0,
      description: "",
    });
    setFormData({ ...formData, components: updatedComponents });
  };

  const handleUpdateSubComponent = (compIndex, subIndex, field, value) => {
    const updatedComponents = [...formData.components];
    updatedComponents[compIndex].subComponents[subIndex] = {
      ...updatedComponents[compIndex].subComponents[subIndex],
      [field]: value,
    };
    setFormData({ ...formData, components: updatedComponents });
  };

  const handleRemoveSubComponent = (compIndex, subIndex) => {
    const updatedComponents = [...formData.components];
    updatedComponents[compIndex].subComponents = updatedComponents[
      compIndex
    ].subComponents.filter((_, i) => i !== subIndex);
    setFormData({ ...formData, components: updatedComponents });
  };

  const handleRemoveComponent = (index) => {
    const updated = formData.components.filter((_, i) => i !== index);
    setFormData({ ...formData, components: updated });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (new Date(formData.deadline.from) > new Date(formData.deadline.to)) {
      setDateError("End date must be after start date");
      return;
    }
    onSave(formData);
  };

  // Safe date helper for input type="datetime-local"
  // Safe date helper for input type="datetime-local"
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    // Format to YYYY-MM-DDThh:mm (local time)
    const pad = (num) => String(num).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const totalMarks = formData.components.reduce(
    (sum, c) => sum + (parseFloat(c.maxMarks) || 0),
    0
  );

  return (
    <Card>
      <div className="p-6">
        <div className="mb-6">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Reviews
          </Button>
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          {review ? "Edit Review" : "Create New Review"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <Input
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                placeholder="e.g., Review 1 - Proposal"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evaluated By
              </label>
              <Select
                value={formData.facultyType}
                onChange={(val) =>
                  setFormData({ ...formData, facultyType: val })
                }
                options={facultyTypes}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order
              </label>
              <Input
                type="number"
                value={formData.order}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    order: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div className="col-span-2 flex items-center gap-6 mt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.pptRequired}
                  onChange={(e) =>
                    setFormData({ ...formData, pptRequired: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="ml-2 text-sm">PPT Required</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.draftRequired}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      draftRequired: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="ml-2 text-sm">Report Draft Required</span>
              </label>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="datetime-local"
                value={formatDateForInput(formData.deadline.from)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deadline: { ...formData.deadline, from: e.target.value },
                  })
                }
                className="w-full border border-gray-300 rounded-lg p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="datetime-local"
                value={formatDateForInput(formData.deadline.to)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deadline: { ...formData.deadline, to: e.target.value },
                  })
                }
                className="w-full border border-gray-300 rounded-lg p-2"
                required
              />
            </div>
            {dateError && (
              <p className="col-span-2 text-sm text-red-600">{dateError}</p>
            )}
          </div>

          {/* Components */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">
                Assessment Components
              </h4>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleAddComponent}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Component
              </Button>
            </div>

            <div className="space-y-6">
              {formData.components.map((comp, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-5 bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="grid grid-cols-2 gap-4 flex-1 mr-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Select Component
                        </label>
                        <Select
                          value={comp.componentId}
                          onChange={(val) =>
                            handleUpdateComponent(idx, "componentId", val)
                          }
                          options={availableComponents.map((c) => ({
                            value: c._id,
                            label: c.name,
                          }))}
                          placeholder="Select from Library"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Max Marks
                        </label>
                        <Input
                          type="number"
                          value={comp.maxMarks}
                          onChange={(e) =>
                            handleUpdateComponent(
                              idx,
                              "maxMarks",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveComponent(idx)}
                      className="text-gray-400 hover:text-red-500 mt-2"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Sub-components Editor - NOW ADDED AS REQUESTED */}
                  <div className="pl-4 border-l-2 border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase">
                        Sub-components (Rubric)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddSubComponent(idx)}
                        className="text-xs text-blue-600 font-medium hover:underline flex items-center"
                      >
                        <PlusIcon className="h-3 w-3 mr-1" /> Add Sub-component
                      </button>
                    </div>

                    <div className="space-y-2">
                      {comp.subComponents?.map((sub, sIdx) => (
                        <div key={sIdx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Criteria Name"
                            value={sub.name}
                            onChange={(e) =>
                              handleUpdateSubComponent(
                                idx,
                                sIdx,
                                "name",
                                e.target.value
                              )
                            }
                            className="flex-1 text-sm border-gray-300 rounded px-2 py-1"
                          />
                          <input
                            type="number"
                            placeholder="Weight"
                            value={sub.weight}
                            onChange={(e) =>
                              handleUpdateSubComponent(
                                idx,
                                sIdx,
                                "weight",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-20 text-sm border-gray-300 rounded px-2 py-1"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveSubComponent(idx, sIdx)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      {(!comp.subComponents ||
                        comp.subComponents.length === 0) && (
                        <p className="text-xs text-gray-400 italic">
                          No sub-components defined.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {formData.components.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4 border-dashed border border-gray-300 rounded">
                  No components added.
                </p>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <p className="font-semibold text-gray-900">
                Total Marks: {totalMarks}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {review ? "Update" : "Create"} Review
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};

export default ReviewEditor;
