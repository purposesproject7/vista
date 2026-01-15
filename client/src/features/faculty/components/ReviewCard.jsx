import React, { useState } from "react";
import {
  CalendarDaysIcon,
  TrashIcon,
  BeakerIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { formatDate } from "../../../shared/utils/dateHelpers";

const ReviewCard = ({ review, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Review might be a project or a review object.
  // Based on image: "Review 1", "From Date", "To Date", COMPONENTS

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4 transition-all hover:shadow-md">
      <div
        className="p-5 flex items-center justify-between cursor-pointer bg-white hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 text-blue-600 p-2.5 rounded-lg">
            <BeakerIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">
              {review.title || `Review`}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1.5">
                <CalendarDaysIcon className="w-4 h-4" />
                {formatDate(review.startDate)} - {formatDate(review.endDate)}
              </span>
              <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs font-semibold">
                {review.components?.length || 0} Components
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(review.id);
              }}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          )}
          <button className="p-2 text-gray-400">
            {isExpanded ? (
              <ChevronUpIcon className="w-5 h-5" />
            ) : (
              <ChevronDownIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 p-5 bg-gray-50/50">
          <h4 className="flex items-center gap-2 font-bold text-gray-700 mb-4">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
            Components
          </h4>

          <div className="space-y-3">
            {review.components?.map((component, idx) => (
              <div
                key={idx}
                className="bg-white border boundary-gray-200 rounded-lg p-4 flex items-center justify-between"
              >
                <span className="font-semibold text-gray-800">
                  {component.name}
                </span>
                <div className="flex items-center gap-2 text-sm">
                  <div className="bg-gray-100 px-3 py-1 rounded-md font-bold text-gray-700">
                    {component.maxMarks} marks
                  </div>
                </div>
              </div>
            ))}
            {(!review.components || review.components.length === 0) && (
              <p className="text-sm text-gray-500 italic">
                No components defined.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
