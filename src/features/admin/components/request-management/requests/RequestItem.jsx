// src/features/admin/components/request-management/requests/RequestItem.jsx
import React from 'react';
import Badge from '../../../../../shared/components/Badge';
import Button from '../../../../../shared/components/Button';
import { formatDate } from './requestUtils';

const RequestItem = ({ request, onApprove, onReject }) => {
  const getCategoryBadge = (category) => {
    return category === 'guide' ? (
      <Badge variant="primary">Guide</Badge>
    ) : (
      <Badge variant="secondary">Panel</Badge>
    );
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {getCategoryBadge(request.category)}
            {getStatusBadge(request.status)}
          </div>
          
          <h4 className="font-semibold text-gray-900 mb-1">
            {request.studentName}
          </h4>
          <p className="text-sm text-gray-600 mb-1">
            {request.projectTitle}
          </p>
          
          {/* Request Message/Reason */}
          <div className="mt-2 p-3 bg-white rounded border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 mb-1">Request Reason:</p>
            <p className="text-sm text-gray-700">{request.message}</p>
          </div>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>Requested: {formatDate(request.date)}</span>
            {request.school && <span>• {request.school}</span>}
            {request.program && <span>• {request.program}</span>}
          </div>

          {request.approvalReason && (
            <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
              <p className="text-xs font-semibold text-green-700 mb-1">Approval Reason:</p>
              <p className="text-sm text-green-800">{request.approvalReason}</p>
            </div>
          )}

          {request.rejectionReason && (
            <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
              <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason:</p>
              <p className="text-sm text-red-800">{request.rejectionReason}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {request.status === 'pending' && (
          <div className="flex gap-2 ml-4">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onApprove(request.id)}
            >
              Approve
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onReject(request.id)}
            >
              Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestItem;
