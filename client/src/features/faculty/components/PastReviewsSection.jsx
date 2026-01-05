import React, { useState } from 'react';
import Button from '../../../shared/components/Button';
import { CheckCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const PastReviewsSection = ({ reviews }) => {
  const [expandedReview, setExpandedReview] = useState(null);

  if (!reviews || reviews.length === 0) {
    return null;
  }

  const toggleExpand = (reviewId) => {
    setExpandedReview(expandedReview === reviewId ? null : reviewId);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Completed Reviews</h2>

      <div className="space-y-3">
        {reviews.map((review) => {
          const isExpanded = expandedReview === review.id;
          const totalTeams = review.teams?.length || 0;

          return (
            <div 
              key={review.id}
              className="bg-white border rounded-lg overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <h3 className="font-semibold text-gray-900">{review.name}</h3>
                      <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-200">
                        Completed
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 ml-8">
                      <span>
                        Completed: {new Date(review.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span>
                        {totalTeams} team{totalTeams !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => toggleExpand(review.id)}
                  >
                    {isExpanded ? 'Hide Teams' : 'View Teams'}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t bg-gray-50">
                  <div className="pt-4 space-y-2">
                    {review.teams?.map((team) => (
                      <div 
                        key={team.id}
                        className="flex items-center gap-3 p-3 bg-white rounded border"
                      >
                        <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">{team.name}</div>
                          {team.projectTitle && (
                            <div className="text-xs text-gray-600">{team.projectTitle}</div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {team.students?.length} member{team.students?.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PastReviewsSection;
