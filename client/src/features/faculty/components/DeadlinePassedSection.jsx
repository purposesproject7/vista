import React, { useState } from 'react';
import Button from '../../../shared/components/Button';
import TeamsModal from './TeamsModal';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const DeadlinePassedSection = ({ reviews, onEnterMarks }) => {
  const [selectedReview, setSelectedReview] = useState(null);
  const [isTeamsModalOpen, setIsTeamsModalOpen] = useState(false);

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

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending (Deadline Passed)</h2>

        <div className="space-y-3">
          {reviews.map((review) => {
            const completedTeams = review.teams?.filter(t => t.marksEntered).length || 0;
            const totalTeams = review.teams?.length || 0;
            const pendingTeams = totalTeams - completedTeams;

            return (
              <div 
                key={review.id}
                className="bg-orange-50 border border-orange-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 flex-shrink-0" />
                      <h3 className="font-semibold text-gray-900">{review.name}</h3>
                      {pendingTeams > 0 && (
                        <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded border border-orange-300">
                          {pendingTeams} pending
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 ml-8">
                      <span>
                        Expired: {new Date(review.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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

export default DeadlinePassedSection;
