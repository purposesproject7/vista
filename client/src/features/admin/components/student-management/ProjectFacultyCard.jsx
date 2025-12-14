// src/features/admin/components/student-management/ProjectFacultyCard.jsx
import React from 'react';
import Card from '../../../../shared/components/Card';
import { 
  DocumentTextIcon, 
  AcademicCapIcon, 
  UserIcon 
} from '@heroicons/react/24/outline';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
    <Icon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-900 break-words">{value || 'N/A'}</p>
    </div>
  </div>
);

const ProjectFacultyCard = ({ student }) => {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <DocumentTextIcon className="w-4 h-4 text-blue-600" />
        Project & Faculty
      </h3>
      <div className="space-y-0">
        {student.projectTitle && (
          <InfoRow 
            icon={DocumentTextIcon} 
            label="Project Title" 
            value={student.projectTitle}
          />
        )}
        <InfoRow 
          icon={AcademicCapIcon} 
          label="Guide" 
          value={student.guide}
        />
        <InfoRow 
          icon={UserIcon} 
          label="Panel Member" 
          value={student.panelMember}
        />
      </div>
    </Card>
  );
};

export default ProjectFacultyCard;
