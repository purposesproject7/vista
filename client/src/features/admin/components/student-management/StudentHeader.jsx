// src/features/admin/components/student-management/StudentHeader.jsx
import React from 'react';
import Card from '../../../../shared/components/Card';
import { UserIcon } from '@heroicons/react/24/outline';

const StudentHeader = ({ student }) => {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
          <UserIcon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
          <p className="text-sm font-mono text-gray-600">{student.regNo}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-600">{student.school || 'N/A'}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-600">{student.programme || 'N/A'}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-600">{student.year || 'N/A'}</span>
            {student.PAT !== undefined && (
              <>
                <span className="text-xs text-gray-400">•</span>
                <span className={`text-xs font-semibold ${student.PAT ? 'text-purple-600' : 'text-gray-500'}`}>
                  {student.PAT ? 'PAT' : 'NO PAT'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StudentHeader;
