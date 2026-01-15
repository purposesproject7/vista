import React, { useState } from "react";
import Card from "../../../../shared/components/Card";
import Button from "../../../../shared/components/Button";
import Input from "../../../../shared/components/Input";
import Select from "../../../../shared/components/Select";
import DateTimePicker from "../../../../shared/components/DateTimePicker";
import {
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

const ReviewEditor = ({ review, onSave, onCancel, availableComponents }) => {
  const [formData, setFormData] = useState(() => {
    if (review) {
      // Normalize existing components to ensure description is an array
      const normalizedComponents = (review.components || []).map((comp) => ({
        ...comp,
        description: Array.isArray(comp.description)
          ? comp.description
          : typeof comp.description === "string" &&
            comp.description.trim() !== ""
            ? [{ label: comp.description, marks: "" }]
            : [],
      }));
      return { ...review, components: normalizedComponents };
    }
    return {
      reviewName: "", // Backend will auto-generate if empty
      displayName: "",
      facultyType: "guide",
      components: [],
      deadline: { from: "", to: "" },
      pptRequired: false,
      draftRequired: false,
      order: 1,
      isActive: true,
    };
  });

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

        // Initialize description as an array of criteria if it's a string from library
        if (
          typeof selected.description === "string" &&
          selected.description.trim() !== ""
        ) {
          updatedComponents[index].description = [
            { label: selected.description, marks: "" },
          ];
        } else if (Array.isArray(selected.description)) {
          updatedComponents[index].description = selected.description;
        } else {
          updatedComponents[index].description = [];
        }

        // Populate sub-components from the library component if they exist
        if (
          selected.predefinedSubComponents &&
          selected.predefinedSubComponents.length > 0
        ) {
          updatedComponents[index].subComponents =
            selected.predefinedSubComponents.map((sub) => ({
              name: sub.name,
              weight: sub.weight,
              description: sub.description,
            }));
        } else {
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

  // Description Criteria Handlers
  const handleAddDescriptionCriteria = (compIndex) => {
    const updatedComponents = [...formData.components];
    if (!Array.isArray(updatedComponents[compIndex].description)) {
      updatedComponents[compIndex].description = [];
    }
    updatedComponents[compIndex].description.push({ label: "", marks: "" });
    setFormData({ ...formData, components: updatedComponents });
  };

  const handleUpdateDescriptionCriteria = (
    compIndex,
    critIndex,
    field,
    value
  ) => {
    const updatedComponents = [...formData.components];
    if (!Array.isArray(updatedComponents[compIndex].description)) {
      updatedComponents[compIndex].description = []; // Safety check
    }
    updatedComponents[compIndex].description[critIndex] = {
      ...updatedComponents[compIndex].description[critIndex],
      [field]: value,
    };
    setFormData({ ...formData, components: updatedComponents });
  };

  const handleRemoveDescriptionCriteria = (compIndex, critIndex) => {
    const updatedComponents = [...formData.components];
    if (Array.isArray(updatedComponents[compIndex].description)) {
      updatedComponents[compIndex].description = updatedComponents[
        compIndex
      ].description.filter((_, i) => i !== critIndex);
      setFormData({ ...formData, components: updatedComponents });
    }
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

    // Validate component marks - Sub-Component validation removed
    // for (const comp of formData.components) {
    //   if (comp.subComponents && comp.subComponents.length > 0) {
    //     const subTotal = comp.subComponents.reduce(
    //       (sum, sub) => sum + (parseFloat(sub.weight) || 0),
    //       0
    //     );
    //     if (Math.abs(subTotal - comp.maxMarks) > 0.01) {
    //       // Floating point tolerance
    //       setDateError(
    //         `Total marks for "${comp.name}" (${comp.maxMarks}) do not match sum of sub-components (${subTotal})`
    //       );
    //       return;
    //     }
    //   }
    // }

    setDateError(""); // Clear any previous errors
    onSave(formData);
  };

  const handleDeadlineChange = (type, value) => {
    setFormData({
      ...formData,
      deadline: { ...formData.deadline, [type]: value },
    });
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

          <div className="flex items-center gap-6">
            {/* Order field removed as requested */}
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.pptRequired}
                onChange={(e) =>
                  setFormData({ ...formData, pptRequired: e.target.checked })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">PPT Required</span>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.draftRequired}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    draftRequired: e.target.checked,
                  })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Report Draft Required
              </span>
            </div>
          </div>

          {/* Dates */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DateTimePicker
                label="Deadline Start"
                value={formData.deadline.from}
                onChange={(value) => handleDeadlineChange("from", value)}
                placeholder="Select start date and time"
                required
              />
              <DateTimePicker
                label="Deadline End"
                value={formData.deadline.to}
                onChange={(value) => handleDeadlineChange("to", value)}
                placeholder="Select end date and time"
                required
              />
            </div>
            {dateError && (
              <p className="mt-3 text-sm text-red-600">{dateError}</p>
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
                          options={availableComponents
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((c) => ({
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

                  {/* Component Description (Criteria) - Key/Value pairs */}
                  <div className="mb-4 pl-4 border-l-2 border-yellow-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase">
                        Description Criteria (JSON)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddDescriptionCriteria(idx)}
                        className="text-xs text-blue-600 font-medium hover:underline flex items-center"
                      >
                        <PlusIcon className="h-3 w-3 mr-1" /> Add Criteria
                      </button>
                    </div>

                    <div className="space-y-2">
                      {Array.isArray(comp.description) &&
                        comp.description.map((crit, cIdx) => (
                          <div key={cIdx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              placeholder="Label (e.g. Implemented 5 papers)"
                              value={crit.label || ""}
                              onChange={(e) =>
                                handleUpdateDescriptionCriteria(
                                  idx,
                                  cIdx,
                                  "label",
                                  e.target.value
                                )
                              }
                              className="flex-1 text-sm border-gray-300 rounded px-2 py-1"
                            />
                            <input
                              type="text"
                              placeholder="Marks"
                              value={crit.marks || ""}
                              onChange={(e) =>
                                handleUpdateDescriptionCriteria(
                                  idx,
                                  cIdx,
                                  "marks",
                                  e.target.value
                                )
                              }
                              className="w-20 text-sm border-gray-300 rounded px-2 py-1"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveDescriptionCriteria(idx, cIdx)
                              }
                              className="text-gray-400 hover:text-red-500"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      {(!Array.isArray(comp.description) ||
                        comp.description.length === 0) && (
                          <p className="text-xs text-gray-400 italic">
                            No description criteria added.
                          </p>
                        )}
                    </div>
                  </div>

                  {/* Sub-components Editor - Removed */}
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
