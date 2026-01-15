import React, { useState } from 'react';
import Button from '../../../shared/components/Button';
import TeamsModal from './TeamsModal';
import { ExclamationTriangleIcon, LockOpenIcon, ClockIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const DeadlinePassedSection = ({ reviews, onEnterMarks }) => {
    const [selectedReview, setSelectedReview] = useState(null);
    const [isTeamsModalOpen, setIsTeamsModalOpen] = useState(false);
    const [isOpen, setIsOpen] = useState(false); // Collapsible state

    if (!reviews || reviews.length === 0) {
        return null;
    }

    const handleViewTeams = (review) => {
        setSelectedReview(review);
        setIsTeamsModalOpen(true);
    };

    const handleEnterMarks = (team) => {
        setIsTeamsModalOpen(false);
        onEnterMarks(selectedReview, team);
    };

    // Calculate Aggregates for Header
    const totalPendingRequests = reviews.reduce((sum, r) => sum + (r.teams?.filter(t => t.requestStatus === 'pending').length || 0), 0);
    const totalUnlocked = reviews.reduce((sum, r) => sum + (r.teams?.filter(t => t.isUnlocked).length || 0), 0);

    return (
        <>
            <div className="bg-white border rounded-lg overflow-hidden shadow-sm transition-all">
                {/* Accordion Header */}
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors select-none"
                >
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
                            Deadline Passed
                            <span className="text-slate-400 font-normal text-sm ml-2">({reviews.length} reviews)</span>
                        </h2>

                        {/* Summary Badges - Visible even when collapsed */}
                        {totalUnlocked > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wide rounded-full border border-green-200 animate-pulse">
                                <LockOpenIcon className="w-3 h-3" /> {totalUnlocked} Unlocked
                            </span>
                        )}
                        {totalPendingRequests > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold uppercase tracking-wide rounded-full border border-yellow-200">
                                <ClockIcon className="w-3 h-3" /> {totalPendingRequests} Pending Req
                            </span>
                        )}
                    </div>

                    <button className="text-slate-400">
                        {isOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                    </button>
                </div>

                {/* Collapsible Content */}
                {isOpen && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3">
                        {reviews.map((review) => {
                            const completedTeams = review.teams?.filter(t => t.marksEntered).length || 0;
                            const totalTeams = review.teams?.length || 0;
                            const pendingTeams = totalTeams - completedTeams;

                            // Badge Logic
                            const unlockedCount = review.teams?.filter(t => t.isUnlocked).length || 0;
                            const pendingRequests = review.teams?.filter(t => t.requestStatus === 'pending').length || 0;

                            return (
                                <div
                                    key={review.id}
                                    className="bg-white border border-orange-200 rounded-lg p-4 transition-all hover:shadow-md"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-semibold text-gray-900">{review.name}</h3>
                                                {pendingTeams > 0 && (
                                                    <span className="inline-flex items-center px-2 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded border border-orange-200">
                                                        {pendingTeams} pending
                                                    </span>
                                                )}

                                                {/* Unlocked Badge */}
                                                {unlockedCount > 0 && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wide rounded border border-green-200">
                                                        <LockOpenIcon className="w-3 h-3" /> {unlockedCount} Unlocked
                                                    </span>
                                                )}

                                                {/* Pending Request Badge */}
                                                {pendingRequests > 0 && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold uppercase tracking-wide rounded border border-yellow-200">
                                                        <ClockIcon className="w-3 h-3" /> {pendingRequests} Request{pendingRequests !== 1 ? 's' : ''} Pending
                                                    </span>
                                                )}

                                            </div>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 ml-0 pl-0">
                                                <span className="text-orange-600 font-medium text-xs uppercase tracking-wide">
                                                    Expired: {new Date(review.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                                <span>•</span>
                                                <span>
                                                    {completedTeams}/{totalTeams} teams completed
                                                </span>
                                            </div>
                                        </div>

                                        <Button
                                            size="sm"
                                            variant="primary"
                                            onClick={() => handleViewTeams(review)}
                                        >
                                            View Teams
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <TeamsModal
                isOpen={isTeamsModalOpen}
                onClose={() => setIsTeamsModalOpen(false)}
                review={selectedReview}
                onEnterMarks={handleEnterMarks}
            />
        </>
    );
};

export default DeadlinePassedSection;
