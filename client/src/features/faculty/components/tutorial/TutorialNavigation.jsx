// src/features/faculty/components/tutorial/TutorialNavigation.jsx
import React from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  HomeIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

const TutorialNavigation = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onClose,
  stepTitle,
  canGoNext = true,
  canGoPrevious = true
}) => {
  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg border-b-2 border-blue-500">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Tutorial info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <BookOpenIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">Faculty Tutorial</h1>
                <p className="text-blue-100 text-sm">{stepTitle}</p>
              </div>
            </div>
          </div>

          {/* Center - Progress */}
          <div className="flex-1 max-w-md mx-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm font-medium">
                Step {currentStep + 1} of {totalSteps}
              </span>
              <span className="text-blue-100 text-sm">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="w-full bg-blue-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Right side - Navigation controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={onPrevious}
              disabled={!canGoPrevious || currentStep === 0}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${!canGoPrevious || currentStep === 0
                  ? 'text-blue-300 bg-blue-800 cursor-not-allowed opacity-50'
                  : 'text-white bg-blue-800 hover:bg-blue-700 active:scale-95'
                }
              `}
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Previous
            </button>

            <button
              onClick={onNext}
              disabled={!canGoNext}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${!canGoNext
                  ? 'text-blue-300 bg-blue-800 cursor-not-allowed opacity-50'
                  : currentStep === totalSteps - 1
                    ? 'text-blue-700 bg-green-400 hover:bg-green-300 active:scale-95'
                    : 'text-blue-700 bg-white hover:bg-gray-100 active:scale-95'
                }
              `}
            >
              {currentStep === totalSteps - 1 ? 'Complete Tutorial' : 'Next'}
              <ChevronRightIcon className="w-4 h-4" />
            </button>

            <div className="w-px h-8 bg-blue-500 mx-2" />

            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-blue-700 rounded-lg transition-colors"
              title="Exit Tutorial"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialNavigation;
