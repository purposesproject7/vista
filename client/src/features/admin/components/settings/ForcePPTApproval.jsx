// src/features/admin/components/settings/ForcePPTApproval.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from '../../../../shared/components/Button';
import { forcePPTApproval } from '../../services/adminApi';
import { useToast } from '../../../../shared/hooks/useToast';
import api from '../../../../services/api';

const ForcePPTApproval = ({ schools, programs, years }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState('');
    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedReview, setSelectedReview] = useState('');
    const [reviews, setReviews] = useState([]);
    const [projectCount, setProjectCount] = useState(null);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Get programs for selected school
    const availablePrograms = selectedSchool && programs[selectedSchool]
        ? programs[selectedSchool]
        : [];

    // Fetch reviews when academic context is selected
    useEffect(() => {
        const fetchReviews = async () => {
            if (!selectedSchool || !selectedProgram || !selectedYear) {
                setReviews([]);
                setProjectCount(null);
                return;
            }

            try {
                const response = await api.get('/admin/marking-schema', {
                    params: {
                        school: selectedSchool,
                        program: selectedProgram,
                        academicYear: selectedYear,
                    },
                });

                if (response.data.success && response.data.data) {
                    // Filter to panel reviews only
                    const panelReviews = response.data.data.reviews?.filter(
                        (r) => r.facultyType === 'panel' || r.facultyType === 'both'
                    ) || [];
                    setReviews(panelReviews);
                } else {
                    setReviews([]);
                    showToast('No marking schema found for this context', 'warning');
                }
            } catch (error) {
                console.error('Error fetching reviews:', error);
                setReviews([]);
                showToast('Failed to load reviews', 'error');
            }
        };

        fetchReviews();
    }, [selectedSchool, selectedProgram, selectedYear]);

    // Fetch project count when review is selected
    useEffect(() => {
        const fetchProjectCount = async () => {
            if (!selectedSchool || !selectedProgram || !selectedYear || !selectedReview) {
                setProjectCount(null);
                return;
            }

            try {
                const response = await api.get('/admin/projects', {
                    params: {
                        school: selectedSchool,
                        program: selectedProgram,
                        academicYear: selectedYear,
                        status: 'active',
                    },
                });

                if (response.data.success) {
                    const allProjects = response.data.data || [];

                    // Filter projects that don't have PPT approval for this review
                    const projectsNeedingApproval = allProjects.filter((project) => {
                        const existingApproval = project.pptApprovals?.find(
                            (a) => a.reviewType === selectedReview
                        );
                        return !existingApproval || !existingApproval.isApproved;
                    });

                    setProjectCount({
                        total: allProjects.length,
                        needingApproval: projectsNeedingApproval.length,
                        alreadyApproved: allProjects.length - projectsNeedingApproval.length,
                    });
                }
            } catch (error) {
                console.error('Error fetching project count:', error);
                setProjectCount(null);
            }
        };

        fetchProjectCount();
    }, [selectedSchool, selectedProgram, selectedYear, selectedReview]);

    const handleApproveAll = async () => {
        if (!selectedSchool || !selectedProgram || !selectedYear || !selectedReview) {
            showToast('Please select all fields', 'error');
            return;
        }

        if (projectCount && projectCount.needingApproval === 0) {
            showToast('All projects already have PPT approval', 'info');
            return;
        }

        setShowConfirmation(true);
    };

    const confirmApproval = async () => {
        try {
            setLoading(true);
            setShowConfirmation(false);

            const response = await forcePPTApproval({
                school: selectedSchool,
                program: selectedProgram,
                academicYear: selectedYear,
                reviewType: selectedReview,
            });

            if (response.success) {
                showToast(
                    `Successfully approved PPT for ${response.data.newlyApproved} project(s)`,
                    'success'
                );

                // Refresh project count
                setProjectCount({
                    ...projectCount,
                    needingApproval: 0,
                    alreadyApproved: projectCount.total,
                });
            } else {
                showToast(response.message || 'Failed to approve PPT', 'error');
            }
        } catch (error) {
            console.error('Error approving PPT:', error);
            showToast(
                error.response?.data?.message || 'Failed to approve PPT',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const selectedReviewData = reviews.find((r) => r.reviewName === selectedReview);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                        <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            Force PPT Approval (Super Admin Only)
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                            This feature allows bulk approval of PPT submissions for all projects in a specific academic context.
                        </p>
                        <div className="bg-white border border-orange-200 rounded-md p-3 text-xs text-gray-700">
                            <strong>Warning:</strong> This action will approve PPT for ALL projects matching the selected criteria.
                            This cannot be easily undone. Use with caution.
                        </div>
                    </div>
                </div>
            </div>

            {/* Selection Form */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Select Academic Context</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* School */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            School
                        </label>
                        <select
                            value={selectedSchool}
                            onChange={(e) => {
                                setSelectedSchool(e.target.value);
                                setSelectedProgram('');
                                setSelectedReview('');
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select School</option>
                            {schools.map((school) => (
                                <option key={school.id} value={school.code || school.name}>
                                    {school.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Program */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Program
                        </label>
                        <select
                            value={selectedProgram}
                            onChange={(e) => {
                                setSelectedProgram(e.target.value);
                                setSelectedReview('');
                            }}
                            disabled={!selectedSchool}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            <option value="">Select Program</option>
                            {availablePrograms.map((program) => (
                                <option key={program.id} value={program.code || program.name}>
                                    {program.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Academic Year */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Academic Year
                        </label>
                        <select
                            value={selectedYear}
                            onChange={(e) => {
                                setSelectedYear(e.target.value);
                                setSelectedReview('');
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select Year</option>
                            {years.map((year) => (
                                <option key={year.id} value={year.name}>
                                    {year.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Review Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Review Type (Panel Only)
                        </label>
                        <select
                            value={selectedReview}
                            onChange={(e) => setSelectedReview(e.target.value)}
                            disabled={reviews.length === 0}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            <option value="">Select Review</option>
                            {reviews.map((review) => (
                                <option key={review.reviewName} value={review.reviewName}>
                                    {review.displayName || review.reviewName}
                                </option>
                            ))}
                        </select>
                        {selectedSchool && selectedProgram && selectedYear && reviews.length === 0 && (
                            <p className="mt-1 text-xs text-gray-500">
                                No panel reviews found for this context
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Project Count Display */}
            {projectCount && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-blue-600">{projectCount.total}</div>
                            <div className="text-xs text-gray-600">Total Projects</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-orange-600">{projectCount.needingApproval}</div>
                            <div className="text-xs text-gray-600">Needing Approval</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-600">{projectCount.alreadyApproved}</div>
                            <div className="text-xs text-gray-600">Already Approved</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleApproveAll}
                    disabled={!selectedReview || loading || (projectCount && projectCount.needingApproval === 0)}
                    isLoading={loading}
                    className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                >
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    Approve All PPT
                </Button>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    Confirm Bulk PPT Approval
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    You are about to approve PPT for <strong>{projectCount?.needingApproval}</strong> project(s) in:
                                </p>
                                <div className="bg-gray-50 rounded-md p-3 text-sm space-y-1">
                                    <div><strong>School:</strong> {selectedSchool}</div>
                                    <div><strong>Program:</strong> {selectedProgram}</div>
                                    <div><strong>Year:</strong> {selectedYear}</div>
                                    <div><strong>Review:</strong> {selectedReviewData?.displayName || selectedReview}</div>
                                </div>
                                <p className="text-xs text-orange-600 mt-3">
                                    This action cannot be easily undone. Are you sure you want to proceed?
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="secondary"
                                onClick={() => setShowConfirmation(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmApproval}
                                isLoading={loading}
                                className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                            >
                                Yes, Approve All
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ForcePPTApproval;
