// src/features/project-coordinator/components/rubrics/PCRubricSettings.jsx
// PC version of RubricSettings - Components are READ-ONLY, Reviews are editable
import React, { useState, useEffect } from "react";
import Card from "../../../../shared/components/Card";
import Button from "../../../../shared/components/Button";
import Select from "../../../../shared/components/Select";
import LoadingSpinner from "../../../../shared/components/LoadingSpinner";
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    BookOpenIcon,
    ClipboardDocumentListIcon,
    EyeIcon,
} from "@heroicons/react/24/outline";
// Reuse Admin's ReviewEditor - it already uses dropdown for component selection
import ReviewEditor from "../../../admin/components/settings/ReviewEditor";
import { useToast } from "../../../../shared/hooks/useToast";
import {
    getComponentLibrary,
    getMarkingSchema,
    createOrUpdateMarkingSchema,
} from "../../services/coordinatorRubricsApi";
import { formatDate } from "../../../../shared/utils/dateHelpers";

const PCRubricSettings = ({ filters }) => {
    const [componentLibrary, setComponentLibrary] = useState(null);
    const [markingSchema, setMarkingSchema] = useState(null);

    const [activeView, setActiveView] = useState("schema"); // 'schema' (Reviews) or 'library' (Components - READ ONLY)
    const [showReviewEditor, setShowReviewEditor] = useState(false);

    const [editingReview, setEditingReview] = useState(null);
    const [editingReviewIndex, setEditingReviewIndex] = useState(null);

    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    // Use filters from parent (academic context)
    const selectedContext = {
        academicYear: filters?.year || "2024-25",
        school: filters?.school || "",
        program: filters?.program || "",
    };

    // Fetch data when context changes
    useEffect(() => {
        if (
            selectedContext.academicYear &&
            selectedContext.school &&
            selectedContext.program
        ) {
            loadData();
        }
    }, [selectedContext.academicYear, selectedContext.school, selectedContext.program]);

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

    // --- Render ---

    if (!selectedContext.school || !selectedContext.program) {
        return (
            <Card>
                <div className="p-8 text-center text-gray-500">
                    <BookOpenIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Please select an academic context using the filters above.</p>
                </div>
            </Card>
        );
    }

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

    return (
        <Card>
            <div className="p-6">
                {/* View Toggle */}
                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeView === "schema"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                        onClick={() => setActiveView("schema")}
                    >
                        <ClipboardDocumentListIcon className="w-4 h-4 inline mr-2" />
                        Marking Schema (Reviews)
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeView === "library"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                        onClick={() => setActiveView("library")}
                    >
                        <EyeIcon className="w-4 h-4 inline mr-2" />
                        Component Library (View Only)
                    </button>
                </div>

                {/* MARKING SCHEMA VIEW - Full Edit Access */}
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
                            <div className="flex justify-center py-8">
                                <LoadingSpinner />
                            </div>
                        ) : !markingSchema?.reviews?.length ? (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                                <p className="text-gray-500">No reviews defined yet.</p>
                                <p className="text-sm text-gray-400 mt-1">Click "Add Review" to create your first review.</p>
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
                                                            <strong>By:</strong> {review.facultyType?.toUpperCase()}
                                                        </span>
                                                        <span>
                                                            {formatDate(review.deadline?.from)} - {formatDate(review.deadline?.to)}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-2 mt-2 flex-wrap">
                                                        {review.components?.map((c, i) => (
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

                {/* COMPONENT LIBRARY VIEW - READ ONLY for PC */}
                {activeView === "library" && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Assessment Components
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Predefined components from Admin. Select these when creating reviews.
                                </p>
                            </div>
                            {/* NO Add Component button for PC - READ ONLY */}
                            <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                                <span className="text-xs font-medium text-amber-700">
                                    <EyeIcon className="w-4 h-4 inline mr-1" />
                                    View Only - Contact Admin to modify components
                                </span>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-8">
                                <LoadingSpinner />
                            </div>
                        ) : !componentLibrary?.components?.length ? (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                                <BookOpenIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500">No components defined by Admin yet.</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Contact your administrator to create assessment components.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {componentLibrary.components.map((comp) => (
                                    <div
                                        key={comp._id}
                                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h5 className="font-semibold text-gray-900">
                                                    {comp.name}
                                                </h5>
                                                <p className="text-xs text-gray-500 mb-2">
                                                    {comp.category} • Suggested Weight: {comp.suggestedWeight}
                                                </p>
                                                {comp.description && (
                                                    <p className="text-sm text-gray-600 mt-1">{comp.description}</p>
                                                )}

                                                {/* Display Sub-components - Removed */}
                                            </div>
                                            {/* NO Edit/Delete buttons - READ ONLY */}
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

export default PCRubricSettings;
