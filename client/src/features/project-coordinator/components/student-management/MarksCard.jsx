// src/features/project-coordinator/components/student-management/MarksCard.jsx
import React from 'react';
import Card from '../../../../shared/components/Card';
import { ChartBarIcon } from '@heroicons/react/24/outline';

const MarksCard = ({ marks, onClick }) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <ChartBarIcon className="w-4 h-4 text-blue-600" />
        Marks
        <span className="text-xs text-gray-500 font-normal ml-auto">(Click for details)</span>
      </h3>
      <div className="space-y-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Total Marks</p>
          <p className="text-2xl font-bold text-gray-900">
            {marks.total}/100
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-1">Guide Marks</p>
            <p className="text-sm font-semibold text-blue-700">{marks.guide}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Panel Marks</p>
            <p className="text-sm font-semibold text-purple-700">{marks.panel}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MarksCard;
