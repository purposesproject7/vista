// src/features/admin/components/request-management/requests/FacultyRequestCard.jsx
import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, UserIcon } from '@heroicons/react/24/outline';
import Card from '../../../../../shared/components/Card';
import Badge from '../../../../../shared/components/Badge';
import Button from '../../../../../shared/components/Button';
import RequestItem from './RequestItem';

const FacultyRequestCard = ({
  faculty,
  requests,
  onApproveRequest,
  onRejectRequest,
  onApproveAll
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <Card className="mb-4">
      <div className="p-4">
        {/* Faculty Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {faculty.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="secondary">{faculty.school}</Badge>
                <Badge variant="secondary">{faculty.program}</Badge>
                <span className="text-sm text-gray-600">
                  {requests.length} request{requests.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Status Summary */}
              <div className="flex items-center gap-3 mt-2">
                {pendingCount > 0 && (
                  <span className="text-sm">
                    <Badge variant="warning">{pendingCount} Pending</Badge>
                  </span>
                )}
                {approvedCount > 0 && (
                  <span className="text-sm">
                    <Badge variant="success">{approvedCount} Approved</Badge>
                  </span>
                )}
                {rejectedCount > 0 && (
                  <span className="text-sm">
                    <Badge variant="danger">{rejectedCount} Rejected</Badge>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onApproveAll(faculty.id)}
              >
                Approve All ({pendingCount})
              </Button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              {isExpanded ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded Request List */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            {requests.map((request) => (
              <RequestItem
                key={request.id}
                request={request}
                onApprove={onApproveRequest}
                onReject={onRejectRequest}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default FacultyRequestCard;
