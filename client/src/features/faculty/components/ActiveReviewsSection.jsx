// src/features/faculty/components/ActiveReviewsSection.jsx - REPLACE (Light Mode)
import React, { useState } from 'react';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import { ChevronDownIcon, ChevronRightIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const ActiveReviewsSection = ({ reviews, onEnterMarks }) => {
  const [expandedReview, setExpandedReview] = useState(null);

  if (!reviews || reviews.length === 0) {
    return (
      <Card className="text-center py-8 bg-blue-50 border-2 border-blue-200">
        <p className="text-gray-600">No active reviews found.</p>
      </Card>
    );
  }

  const toggleReview = (reviewId) => {
    setExpandedReview(expandedReview === reviewId ? null : reviewId);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
        <h2 className="text-xl font-bold text-gray-900">Active Reviews ({reviews.length})</h2>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => {
          const isExpanded = expandedReview === review.id;
          const completedTeams = review.teams?.filter(t => t.marksEntered).length || 0;
          const totalTeams = review.teams?.length || 0;

          return (
            <div key={review.id} className="bg-white rounded-xl shadow-md border-2 border-blue-200 overflow-hidden hover:shadow-lg transition-all">
              {/* Review Header */}
              <div
                onClick={() => toggleReview(review.id)}
                className="flex items-center justify-between p-4 cursor-pointer bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 hover:to-blue-50 transition-all"
              >
                <div className="flex items-center gap-3 flex-1">
                  <button className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors">
                    {isExpanded ? (
                      <ChevronDownIcon className="w-5 h-5" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{review.name}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <ClockIcon className="w-4 h-4 text-orange-500" />
                        <span>Deadline: {new Date(review.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                          {completedTeams}/{totalTeams} Teams
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Teams List */}
              {isExpanded && (
                <div className="p-4 bg-gray-50 border-t-2 border-gray-200">
                  <div className="space-y-2">
                    {review.teams?.map((team) => (
                      <div 
                        key={team.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          {team.marksEntered ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-600" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">{team.name}</div>
                            <div className="text-xs text-gray-600">
                              {team.students?.length} student{team.students?.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          variant={team.marksEntered ? 'secondary' : 'primary'}
                          onClick={() => onEnterMarks(team)}
                        >
                          {team.marksEntered ? '✏️ Edit Marks' : '📝 Enter Marks'}
                        </Button>
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

export default ActiveReviewsSection;
