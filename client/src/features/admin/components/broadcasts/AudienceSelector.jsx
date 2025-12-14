// src/features/admin/components/broadcasts/AudienceSelector.jsx
import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const AudienceSelector = ({ label, options, selected, onToggle, onReset }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-semibold text-blue-600 hover:underline"
        >
          Target all
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Leave empty to reach every {label.toLowerCase().replace('target ', '')}.
      </p>
      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={`w-full flex items-center justify-between px-4 py-2 rounded-lg border text-sm font-medium transition ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200'
              }`}
            >
              <span>{option}</span>
              {isSelected && <CheckCircleIcon className="h-5 w-5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AudienceSelector;
