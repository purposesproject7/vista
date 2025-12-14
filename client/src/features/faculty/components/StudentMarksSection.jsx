// src/features/faculty/components/StudentMarksSection.jsx - UPDATE
import React from 'react';
import RubricComponent from './RubricComponent';

const StudentMarksSection = ({ 
  student, 
  rubrics, 
  marks, 
  errors, 
  onMarkChange, 
  total 
}) => {
  return (
    <div className="mb-8 pb-6 border-b border-slate-700 last:border-b-0">
      <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-slate-800 to-slate-700 p-4 rounded-xl border border-slate-600">
        <div>
          <h3 className="text-lg font-bold text-white">{student.name}</h3>
          <p className="text-sm text-gray-400">Roll No: {student.rollNumber}</p>
        </div>
        
        <div className="text-right">
          <div className="text-xs text-gray-400 mb-1">Total Marks</div>
          <div className="text-3xl font-bold text-blue-300">
            {total.toFixed(1)}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {rubrics.map(rubric => (
          <RubricComponent
            key={rubric.id}
            rubric={rubric}
            studentId={student.id}
            marks={marks[student.id] || {}}
            errors={errors}
            onMarkChange={onMarkChange}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
};

export default StudentMarksSection;
