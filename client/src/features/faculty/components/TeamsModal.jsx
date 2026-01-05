import React from 'react';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import { CheckCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const TeamsModal = ({ isOpen, onClose, review, onEnterMarks }) => {
  if (!isOpen || !review) return null;

  const completedTeams = review.teams?.filter(t => t.marksEntered).length || 0;
  const totalTeams = review.teams?.length || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={review.name}
    >
      <div className="p-6">
        {/* Header Info */}
        <div className="mb-6 pb-4 border-b">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Deadline: <span className="font-semibold text-gray-900">{new Date(review.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></span>
            <span>Progress: <span className="font-semibold text-gray-900">{completedTeams}/{totalTeams} teams completed</span></span>
          </div>
        </div>

        {/* Teams List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {review.teams?.map((team) => (
            <div 
              key={team.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:border-gray-400 hover:shadow-sm transition-all bg-white"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-shrink-0">
                  {team.marksEntered ? (
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center border border-green-200">
                      <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                      <UserGroupIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">{team.name}</div>
                  {team.projectTitle && (
                    <div className="text-sm text-gray-600 truncate">{team.projectTitle}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {team.students?.length} member{team.students?.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              
              <Button
                size="sm"
                variant={team.marksEntered ? 'secondary' : 'primary'}
                onClick={() => onEnterMarks(team)}
              >
                {team.marksEntered ? 'Edit Marks' : 'Enter Marks'}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default TeamsModal;
