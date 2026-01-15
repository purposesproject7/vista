import React, { useState } from 'react';
import Button from '../../../shared/components/Button';
import TeamsModal from './TeamsModal';
import { PlayCircleIcon, CalendarIcon } from '@heroicons/react/24/outline';

const ActiveReviewsSection = ({ reviews, onEnterMarks }) => {
    const [selectedReview, setSelectedReview] = useState(null);
    const [isTeamsModalOpen, setIsTeamsModalOpen] = useState(false);

    if (!reviews || reviews.length === 0) {
        return (
            <div className="bg-white border rounded-lg p-8 text-center text-slate-500">
                <p>No active reviews at the moment.</p>
            </div>
        );
    }

    const handleViewTeams = (review) => {
        setSelectedReview(review);
        setIsTeamsModalOpen(true);
    };

    const handleEnterMarks = (team) => {
        setIsTeamsModalOpen(false);
        onEnterMarks(selectedReview, team);
    };

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-lg font-semibold text-gray-900">Active Reviews</h2>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{reviews.length}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reviews.map((review) => {
                        const completedTeams = review.teams?.filter(t => t.marksEntered).length || 0;
                        const totalTeams = review.teams?.length || 0;
                        const progress = totalTeams > 0 ? (completedTeams / totalTeams) * 100 : 0;

                        return (
                            <div
                                key={review.id}
                                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                            <PlayCircleIcon className="w-6 h-6" />
                                        </div>
                                        <span className="bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
                                            Active
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-slate-900 text-lg mb-1">{review.name}</h3>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-6">
                                        <CalendarIcon className="w-4 h-4" />
                                        <span>Ends {new Date(review.endDate).toLocaleDateString()}</span>
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex justify-between text-xs font-medium text-slate-500 mb-2">
                                            <span>Progress</span>
                                            <span>{completedTeams} / {totalTeams} Teams</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    variant="primary"
                                    className="w-full justify-center"
                                    onClick={() => handleViewTeams(review)}
                                >
                                    Enter Marks
                                </Button>
                            </div>
                        );
                    })}
                </div>
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

export default ActiveReviewsSection;
