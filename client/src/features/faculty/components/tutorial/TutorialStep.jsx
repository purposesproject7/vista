// src/features/faculty/components/tutorial/TutorialStep.jsx
import React from 'react';
import {
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LightBulbIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const TutorialStep = ({
  title,
  description,
  tips = [],
  warnings = [],
  nextSteps = [],
  children,
  className = '',
  variant = 'default' // default, highlight, warning, success
}) => {
  const variantStyles = {
    default: 'bg-white border-gray-200',
    highlight: 'bg-blue-50 border-blue-300 shadow-lg',
    warning: 'bg-orange-50 border-orange-300',
    success: 'bg-green-50 border-green-300'
  };

  return (
    <div className={`rounded-xl border-2 p-6 ${variantStyles[variant]} ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-700 leading-relaxed">{description}</p>
      </div>

      {/* Content Area */}
      {children && (
        <div className="mb-6">
          {children}
        </div>
      )}

      {/* Tips Section */}
      {tips.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <LightBulbIcon className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900">Tips:</h4>
          </div>
          <ul className="space-y-2">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0" />
                <span className="text-gray-700 text-sm">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings Section */}
      {warnings.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
            <h4 className="font-semibold text-gray-900">Important Notes:</h4>
          </div>
          <ul className="space-y-2">
            {warnings.map((warning, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 shrink-0" />
                <span className="text-gray-700 text-sm">{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Steps Section */}
      {nextSteps.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <ArrowRightIcon className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-900">What's Next:</h4>
          </div>
          <ol className="space-y-2">
            {nextSteps.map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="bg-green-100 text-green-700 font-bold text-xs px-2 py-1 rounded-full min-w-6 h-6 flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-gray-700 text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default TutorialStep;
