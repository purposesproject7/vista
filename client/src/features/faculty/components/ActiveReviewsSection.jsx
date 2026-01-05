import React, { useState } from 'react';
import Button from '../../../shared/components/Button';
import TeamsModal from './TeamsModal';
import { ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const ActiveReviewsSection = ({ reviews, onEnterMarks }) => {
  const [selectedReview, setSelectedReview] = useState(null);
  const [isTeamsModalOpen, setIsTeamsModalOpen] = useState(false);

  if (!reviews || reviews.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-8 text-center">
        <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No active reviews at the moment</p>
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
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Reviews</h2>

        <div className="space-y-3">
          {reviews.map((review) => {
            const completedTeams = review.teams?.filter(t => t.marksEntered).length || 0;
            const totalTeams = review.teams?.length || 0;
            const isComplete = completedTeams === totalTeams && totalTeams > 0;

            return (
              <div 
                key={review.id}
                className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{review.name}</h3>
                      {isComplete && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-200">
                          <CheckCircleIcon className="w-3 h-3" />
                          Complete
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        Ends: {new Date(review.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
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
