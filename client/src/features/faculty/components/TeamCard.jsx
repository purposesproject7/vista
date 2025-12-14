// src/features/faculty/components/TeamCard.jsx - REPLACE ENTIRE FILE
import React from 'react';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import EditRequestButton from './EditRequestButton';

const TeamCard = ({ team, review, onEnterMarks, showEditRequest = false }) => {
  return (
    <Card className="mb-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <UserGroupIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <div className="min-w-0">
            <h4 className="font-medium text-gray-900 truncate">{team.name}</h4>
            <p className="text-sm text-gray-600">
              {team.students.length} student{team.students.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex-shrink-0">
          {team.isMarked ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircleIcon className="w-5 h-5" />
              <span className="text-sm font-medium whitespace-nowrap">Marks Entered</span>
            </div>
          ) : showEditRequest ? (
            <EditRequestButton review={review} team={team} />
          ) : (
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => onEnterMarks(team)}
            >
              Enter Marks →
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TeamCard;
