// src/features/admin/components/student-management/TeamMembersCard.jsx
import React from 'react';
import Card from '../../../../shared/components/Card';
import Button from '../../../../shared/components/Button';
import { UserGroupIcon } from '@heroicons/react/24/outline';

const TeamMembersCard = ({ teammates, onNavigateToStudent, onCloseModal }) => {
  if (!teammates || teammates.length === 0) return null;

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <UserGroupIcon className="w-4 h-4 text-blue-600" />
        Team Members ({teammates.length})
      </h3>
      <div className="space-y-2">
        {teammates.map((teammate) => (
          <div
            key={teammate.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{teammate.name}</p>
              <p className="text-xs text-gray-600 font-mono">{teammate.regNo}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onCloseModal();
                onNavigateToStudent({ id: teammate.id });
              }}
              className="ml-2"
            >
              View
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default TeamMembersCard;
