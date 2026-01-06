// src/features/faculty/components/PastReviewsSection.jsx - REPLACE (Light Mode)
import React, { useState } from "react";
import Card from "../../../shared/components/Card";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

const PastReviewsSection = ({ reviews }) => {
  const [expandedReview, setExpandedReview] = useState(null);

  if (!reviews || reviews.length === 0) {
    return null;
  }

  const toggleReview = (reviewId) => {
    setExpandedReview(expandedReview === reviewId ? null : reviewId);
  };

  return (
    <div data-tutorial="past-reviews">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-6 bg-green-600 rounded-full"></div>
        <h2 className="text-xl font-bold text-gray-900">
          Completed ({reviews.length})
        </h2>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => {
          const isExpanded = expandedReview === review.id;
          const totalTeams = review.teams?.length || 0;

          return (
            <div
              key={review.id}
              className="bg-white rounded-xl shadow-md border-2 border-green-200 overflow-hidden hover:shadow-lg transition-all"
            >
              <div
                onClick={() => toggleReview(review.id)}
                className="flex items-center justify-between p-4 cursor-pointer bg-gradient-to-r from-green-50 to-white hover:from-green-100 hover:to-green-50 transition-all"
              >
                <div className="flex items-center gap-3 flex-1">
                  <button className="text-green-600 hover:bg-green-100 p-2 rounded-lg transition-colors">
                    {isExpanded ? (
                      <ChevronDownIcon className="w-5 h-5" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">
                      {review.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1 text-sm text-green-600 font-semibold">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>
                          Completed:{" "}
                          {new Date(review.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                        {totalTeams} Teams
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 bg-green-50 border-t-2 border-green-200">
                  <div className="space-y-2">
                    {review.teams?.map((team) => (
                      <div
                        key={team.id}
                        className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200"
                      >
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="font-semibold text-gray-900">
                            {team.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {team.students?.length} student
                            {team.students?.length !== 1 ? "s" : ""} - Marks
                            Submitted
                          </div>
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
