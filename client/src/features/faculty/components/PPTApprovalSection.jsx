import React, { useState } from 'react';
import { CheckCircleIcon, DocumentCheckIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import Button from '../../../shared/components/Button';
import { approvePPT } from '../services/facultyApi';
import { useToast } from '../../../shared/hooks/useToast';

const PPTApprovalSection = ({ reviews, onRefresh }) => {
    const { showToast } = useToast();
    const [approvingId, setApprovingId] = useState(null);

    // Filter teams that need approval
    // Logic: Active Reviews -> Teams where I am Guide -> reviewType matches -> PPT Not Approved
    const pendingApprovals = reviews.flatMap(review => {
        // Check if this review involves a panel
        // Values can be 'guide', 'panel', 'both'
        // User requirement: "only panel reviews... show approval"
        const isPanelReview = review.type === 'panel' || review.type === 'both' || !review.type;

        if (!isPanelReview) return [];

        return (review.teams || [])
            .filter(team => {
                // Must be Guide
                if (team.role !== 'guide') return false;

                // Check if already approved
                const pptStatus = team.pptApprovals?.find(p => p.reviewType === review.id);
                return !pptStatus || !pptStatus.isApproved;
            })
            .map(team => ({
                ...team,
                reviewId: review.id,
                reviewName: review.name
            }));
    });

    if (pendingApprovals.length === 0) {
        return null; // Hide section if no pending approvals
    }

    const handleApprove = async (team) => {
        if (!window.confirm(`Approve PPT for ${team.name}? This will allow panel members to enter marks.`)) {
            return;
        }

        try {
            setApprovingId(team.id);
            // We need a student ID to call the API. Since approval is team-wide (in our new backend),
            // any student ID from the team will work.
            const studentId = team.students[0]?.student_id;

            if (!studentId) {
                throw new Error("No students in team to link approval.");
            }

            await approvePPT(studentId, team.reviewId);
            showToast("PPT Approved successfully", "success");
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error("Approval failed:", error);
            showToast(error.message || "Failed to approve PPT", "error");
        } finally {
            setApprovingId(null);
        }
    };

    return (
        <section className="animate-slideUp mb-8">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                    <DocumentCheckIcon className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Pending PPT Approvals</h2>
                    <p className="text-sm text-gray-500">Approve presentation materials to unlock grading for the panel.</p>
                </div>
                <span className="ml-auto bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">
                    {pendingApprovals.length} Pending
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {pendingApprovals.map((team) => (
                    <div key={`${team.id}-${team.reviewId}`} className="bg-white border border-orange-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>

                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-gray-900">{team.name}</h3>
                            <span className="text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {team.reviewName}
                            </span>
                        </div>

                        <p className="text-sm text-gray-500 mb-4 line-clamp-1">{team.projectTitle}</p>

                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                            <span className="flex items-center gap-1">
                                <ExclamationCircleIcon className="w-4 h-4 text-orange-500" />
                                Action Required
                            </span>
                            <span>•</span>
                            <span>{team.students.length} Students</span>
                        </div>

                        <Button
                            className="w-full justify-center bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                            onClick={() => handleApprove(team)}
                            isLoading={approvingId === team.id}
                            disabled={approvingId !== null}
                        >
                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                            Approve PPT
                        </Button>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default PPTApprovalSection;
