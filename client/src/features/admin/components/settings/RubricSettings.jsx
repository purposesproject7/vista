// src/features/admin/components/settings/RubricSettings.jsx
import React, { useState, useEffect } from "react";
import Card from "../../../../shared/components/Card";
import Button from "../../../../shared/components/Button";
import Select from "../../../../shared/components/Select";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import RubricEditor from "./RubricEditor";
import ReviewEditor from "./ReviewEditor";
import { useToast } from "../../../../shared/hooks/useToast";
import {
  getComponentLibrary,
  createComponentLibrary,
  updateComponentLibrary,
} from "../../../../services/componentLibraryApi";
import {
  getMarkingSchema,
  createOrUpdateMarkingSchema,
} from "../../../../services/markingSchemaApi";
import { formatDate } from "../../../../shared/utils/dateHelpers";

const RubricSettings = ({
  rubrics,
  onUpdate,
  schools = [],
  programs = {},
  years = [],
}) => {
  const [componentLibrary, setComponentLibrary] = useState(null);
  const [markingSchema, setMarkingSchema] = useState(null);

  const [activeView, setActiveView] = useState("schema"); // 'schema' (Reviews) or 'library' (Components)
  const [showComponentEditor, setShowComponentEditor] = useState(false);
  const [showReviewEditor, setShowReviewEditor] = useState(false);

  const [editingComponent, setEditingComponent] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [editingReviewIndex, setEditingReviewIndex] = useState(null);

  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // Academic context selection
  const [selectedContext, setSelectedContext] = useState({
    academicYear: "2024-25",
    school: "SCOPE",
    program: "CSE",
  });

  // Fetch data when context changes
  useEffect(() => {
    if (
      selectedContext.academicYear &&
      selectedContext.school &&
      selectedContext.program
    ) {
      loadData();
    }
  }, [
    selectedContext.academicYear,
    selectedContext.school,
    selectedContext.program,
  ]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchComponentLibrary(), fetchMarkingSchema()]);
    setLoading(false);
  };

  const fetchComponentLibrary = async () => {
    try {
      const response = await getComponentLibrary(
        selectedContext.academicYear,
        selectedContext.school,
        selectedContext.program
      );
      setComponentLibrary(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setComponentLibrary(null);
      } else {
        console.error("Failed to load component library", error);
      }
    }
  };

  const fetchMarkingSchema = async () => {
    try {
      const response = await getMarkingSchema(
        selectedContext.academicYear,
        selectedContext.school,
        selectedContext.program
      );
      setMarkingSchema(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setMarkingSchema(null);
      } else {
        console.error("Failed to load marking schema", error);
      }
    }
  };

  // --- Marking Schema (Reviews) Handlers ---

  const handleAddReview = () => {
    setEditingReview(null);
    setEditingReviewIndex(null);
    setShowReviewEditor(true);
  };

  const handleEditReview = (review, index) => {
    setEditingReview(review);
    setEditingReviewIndex(index);
    setShowReviewEditor(true);
  };

  const handleDeleteReview = async (index) => {
    if (!markingSchema || !window.confirm("Delete this review?")) return;

    const updatedReviews = markingSchema.reviews.filter((_, i) => i !== index);
    await saveMarkingSchema(updatedReviews);
  };

  const handleSaveReview = async (reviewData) => {
    let updatedReviews = markingSchema?.reviews
      ? [...markingSchema.reviews]
      : [];

    if (editingReviewIndex !== null) {
      updatedReviews[editingReviewIndex] = reviewData;
    } else {
      updatedReviews.push(reviewData);
    }

    await saveMarkingSchema(updatedReviews);
    setShowReviewEditor(false);
  };

  const saveMarkingSchema = async (updatedReviews) => {
    try {
      setLoading(true);
      const payload = {
        academicYear: selectedContext.academicYear,
        school: selectedContext.school,
        program: selectedContext.program,
        reviews: updatedReviews,
      };

      await createOrUpdateMarkingSchema(payload);
      showToast("Marking schema saved successfully", "success");
      await fetchMarkingSchema();
    } catch (error) {
      showToast("Failed to save marking schema", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- Component Library Handlers ---

  const handleAddComponent = () => {
    setEditingComponent(null);
    setShowComponentEditor(true);
  };

  const handleEditComponent = (component) => {
    setEditingComponent(component);
    setShowComponentEditor(true);
  };

  const handleDeleteComponent = async (componentId) => {
    if (!window.confirm("Are you sure?")) return;

    try {
      const updatedComponents = componentLibrary.components.filter(
        (c) => c._id !== componentId
      );

      await updateComponentLibrary(componentLibrary._id, {
        components: updatedComponents,
      });

      await fetchComponentLibrary();
      showToast("Component deleted", "success");
    } catch (error) {
      showToast("Failed to delete component", "error");
    }
  };

  const handleSaveComponent = async (component) => {
    try {
      setLoading(true);

      if (!componentLibrary) {
        const newLibrary = {
          academicYear: selectedContext.academicYear,
          school: selectedContext.school,
          program: selectedContext.program,
          components: [component],
        };
        await createComponentLibrary(newLibrary);
      } else {
        let updatedComponents;
        if (editingComponent) {
          updatedComponents = componentLibrary.components.map((c) =>
            c._id === editingComponent._id ? { ...component, _id: c._id } : c
          );
        } else {
          updatedComponents = [...componentLibrary.components, component];
        }

        await updateComponentLibrary(componentLibrary._id, {
          components: updatedComponents,
        });
      }

      await fetchComponentLibrary();
      setShowComponentEditor(false);
      showToast("Component saved", "success");
    } catch (error) {
      showToast("Failed to save component", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---

  if (showReviewEditor) {
    return (
      <ReviewEditor
        review={editingReview}
        onSave={handleSaveReview}
        onCancel={() => setShowReviewEditor(false)}
        availableComponents={componentLibrary?.components || []}
      />
    );
  }

  if (showComponentEditor) {
    return (
      <RubricEditor
        component={editingComponent}
        onSave={handleSaveComponent}
        onCancel={() => setShowComponentEditor(false)}
      />
    );
  }

  return (
    <Card>
      <div className="p-6">
        {/* Context Selection */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Academic Context
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Academic Year
              </label>
              <Select
                value={selectedContext.academicYear}
                onChange={(val) =>
                  setSelectedContext({ ...selectedContext, academicYear: val })
                }
                options={years.map((y) => ({ value: y.name, label: y.name }))}
                placeholder="Select Year"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                School
              </label>
              <Select
                value={selectedContext.school}
                onChange={(val) =>
                  setSelectedContext({
                    ...selectedContext,
                    school: val,
                    program: "",
                  })
                }
                options={schools.map((s) => ({ value: s.code, label: s.code }))}
                placeholder="Select School"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Department
              </label>
              <Select
                value={selectedContext.program}
                onChange={(val) =>
                  setSelectedContext({ ...selectedContext, program: val })
                }
                options={(programs[selectedContext.school] || []).map((p) => ({
                  value: p.code,
                  label: p.name,
                }))}
                placeholder="Select Department"
                disabled={!selectedContext.school}
              />
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeView === "schema"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveView("schema")}
          >
            Marking Schema (Reviews)
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeView === "library"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveView("library")}
          >
            Component Library
          </button>
        </div>

        {/* MARKING SCHEMA VIEW */}
        {activeView === "schema" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Reviews & Assessments
                </h3>
                <p className="text-sm text-gray-500">
                  Define the timeline and structure of evaluations.
                </p>
              </div>
              <Button onClick={handleAddReview} disabled={loading}>
                <PlusIcon className="w-4 h-4 mr-2" /> Add Review
              </Button>
            </div>

            {loading && !markingSchema ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : !markingSchema?.reviews?.length ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                <p className="text-gray-500">No reviews defined yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {markingSchema.reviews
                  .sort((a, b) => a.order - b.order)
                  .map((review, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded">
                              #{review.order}
                            </span>
                            <h4 className="font-bold text-gray-900 text-lg">
                              {review.displayName}
                            </h4>
                            <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                              {review.reviewName}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>
                              <strong>By:</strong>{" "}
                              {review.facultyType.toUpperCase()}
                            </span>
                            <span>
                              {formatDate(review.deadline.from)} -{" "}
                              {formatDate(review.deadline.to)}
                            </span>
                          </div>
                          <div className="flex gap-2 mt-2">
                            {review.components.map((c, i) => (
                              <span
                                key={i}
                                className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 border border-gray-200"
                              >
                                {c.name} ({c.maxMarks})
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditReview(review, idx)}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDeleteReview(idx)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* COMPONENT LIBRARY VIEW */}
        {activeView === "library" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Assessment Components
                </h3>
                <p className="text-sm text-gray-500">
                  Reusable components (rubrics) for reviews.
                </p>
              </div>
              <Button onClick={handleAddComponent} disabled={loading}>
                <PlusIcon className="w-4 h-4 mr-2" /> Add Component
              </Button>
            </div>

            {!componentLibrary?.components?.length ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                <p className="text-gray-500">No components created yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {componentLibrary.components.map((comp) => (
                  <div
                    key={comp._id}
                    className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50"
                  >
                    <div>
                      <h5 className="font-semibold text-gray-900">
                        {comp.name}
                      </h5>
                      <p className="text-xs text-gray-500">
                        {comp.category} • Weight: {comp.suggestedWeight}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditComponent(comp)}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteComponent(comp._id)}
                        className="text-red-600"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default RubricSettings;
