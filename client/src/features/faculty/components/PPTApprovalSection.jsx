import React, { useState } from 'react';
import { CheckCircleIcon, DocumentCheckIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import Button from '../../../shared/components/Button';
import { approvePPT } from '../services/facultyApi';
import { useToast } from '../../../shared/hooks/useToast';
import { findPPTApproval } from '../../../shared/utils/reviewHelpers';

const SDG_GOALS = [
    "All",
    "1. No Poverty",
    "2. Zero Hunger",
    "3. Good Health and Well-being",
    "4. Quality Education",
    "5. Gender Equality",
    "6. Clean Water and Sanitation",
    "7. Affordable and Clean Energy",
    "8. Decent Work and Economic Growth",
    "9. Industry, Innovation and Infrastructure",
    "10. Reduced Inequality",
    "11. Sustainable Cities and Communities",
    "12. Responsible Consumption and Production",
    "13. Climate Action",
    "14. Life Below Water",
    "15. Life on Land",
    "16. Peace and Justice Strong Institutions",
    "17. Partnerships to achieve the Goal"
];

const PPTApprovalSection = ({ reviews, onRefresh }) => {
    const { showToast } = useToast();
    const [approvingId, setApprovingId] = useState(null);
    const [selectedTeamForApproval, setSelectedTeamForApproval] = useState(null);
    const [selectedGoal, setSelectedGoal] = useState("");

    // Filter teams that need approval
    // Logic: Active Reviews -> Teams where I am Guide -> reviewType matches -> PPT Not Approved
    const pendingApprovals = reviews.flatMap(review => {
        // STRICT REQUIREMENT: Only show PPT Approval for Panel reviews (and 'both' type which involves panel).
        // User explicitly stated: "it shd work for panel review only".
        // BUT Review 1 is "both", and requires PPT. So we must allow "both" too if it involves Panel logic.
        if (!review.pptRequired) return [];
        if (review.facultyType !== 'panel' && review.facultyType !== 'both') return [];

        return (review.teams || [])
            .filter(team => {
                // Must be Guide
                if (team.role !== 'guide') return false;

                // Check if already approved (using flexible matching for review names)
                const pptApprovalsArray = Array.isArray(team.pptApprovals) ? team.pptApprovals : [];
                const pptStatus = findPPTApproval(pptApprovalsArray, review.id);
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

    const handleApprove = async () => {
        if (!selectedTeamForApproval || !selectedGoal) {
            showToast("Please select an SDG Goal", "error");
            return;
        }

        try {
            setApprovingId(selectedTeamForApproval.id);
            const studentId = selectedTeamForApproval.students[0]?.student_id;

            if (!studentId) {
                throw new Error("No students in team to link approval.");
            }

            await approvePPT(studentId, selectedTeamForApproval.reviewId, [selectedGoal]);
            showToast("PPT Approved successfully", "success");
            if (onRefresh) onRefresh();
            setSelectedTeamForApproval(null);
            setSelectedGoal("");
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
                            <h3 className="font-bold text-gray-900 line-clamp-2 break-words mr-2 flex-1">{team.name}</h3>
                            <span className="text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-600 px-2 py-1 rounded shrink-0">
                                {team.reviewName}
                            </span>
                        </div>

                        {team.projectTitle && 
                         team.name.toLowerCase().replace(/\s+/g, '') !== team.projectTitle.toLowerCase().replace(/\s+/g, '') && 
                         !team.name.toLowerCase().includes(team.projectTitle.toLowerCase().substring(0, 15)) ? (
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2 break-words">{team.projectTitle}</p>
                        ) : (
                            <div className="mb-4"></div>
                        )}

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
                            onClick={() => setSelectedTeamForApproval(team)}
                            isLoading={approvingId === team.id}
                            disabled={approvingId !== null}
                        >
                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                            Approve PPT
                        </Button>
                    </div>
                ))}
            </div>

            {/* SDG Goal Selection Modal */}
            {selectedTeamForApproval && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Select SDG Goal</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    Approve PPT for <span className="font-semibold text-gray-700">{selectedTeamForApproval.name}</span>
                                </p>
                            </div>
                        </div>
                        
                        <div className="p-5 overflow-y-auto">
                            <p className="text-sm text-gray-600 mb-4 bg-orange-50 text-orange-800 p-3 rounded border border-orange-100 flex gap-2 items-start">
                                <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <span>Please select an appropriate SDG Goal that aligns with this project before approving the PPT. This is mandatory.</span>
                            </p>
                            
                            <div className="space-y-2">
                                {SDG_GOALS.map((goal, idx) => (
                                    <label 
                                        key={idx} 
                                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                                            selectedGoal === goal ? 'bg-orange-50 border-orange-300 ring-1 ring-orange-300' : 'hover:bg-gray-50 border-gray-200'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="sdgGoal"
                                            value={goal}
                                            checked={selectedGoal === goal}
                                            onChange={(e) => setSelectedGoal(e.target.value)}
                                            className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded-full"
                                        />
                                        <span className="ml-3 text-sm text-gray-700">{goal}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setSelectedTeamForApproval(null);
                                    setSelectedGoal("");
                                }}
                                disabled={approvingId !== null}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                                onClick={handleApprove}
                                isLoading={approvingId !== null}
                                disabled={!selectedGoal || approvingId !== null}
                            >
                                Confirm & Approve
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default PPTApprovalSection;
