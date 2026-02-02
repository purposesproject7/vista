// src/features/admin/components/student-management/ReviewStatusCard.jsx
import React from 'react';
import Card from '../../../../shared/components/Card';
import Badge from '../../../../shared/components/Badge';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const ReviewStatusCard = ({ reviewStatuses }) => {
  const hasReviews = reviewStatuses && reviewStatuses.length > 0;
  const approvedCount = hasReviews
    ? reviewStatuses.filter(r => r.status === 'approved').length
    : 0;

  const getStatusConfig = (status) => {
    const configs = {
      approved: {
        variant: 'success',
        label: 'Done',
        icon: CheckCircleIcon,
        color: 'text-green-600'
      },
      pending: {
        variant: 'warning',
        label: 'Pending',
        icon: ClockIcon,
        color: 'text-yellow-600'
      },
      rejected: {
        variant: 'danger',
        label: 'Rejected',
        icon: XCircleIcon,
        color: 'text-red-600'
      },
      'not-submitted': {
        variant: 'default',
        label: 'Pending',
        icon: ClockIcon,
        color: 'text-gray-400'
      }
    };
    return configs[status] || configs['not-submitted'];
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <DocumentTextIcon className="w-4 h-4 text-blue-600" />
          Presentation Status
        </h3>
        {hasReviews && (
          <span className="text-xs text-gray-600">
            {approvedCount} / {reviewStatuses.length} Approved
          </span>
        )}
      </div>

      {hasReviews ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 px-3 bg-orange-50 rounded-lg border border-orange-200 mb-3">
            <span className="text-xs font-medium text-orange-700">Approval Status</span>
            <span className="text-xs text-orange-600">{approvedCount} reviews Approved</span>
          </div>

          {reviewStatuses.map((review, index) => {
            const config = getStatusConfig(review.status);
            const Icon = config.icon;

            return (
              <div
                key={index}
                className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <span className="text-sm font-medium text-gray-700">{review.name}</span>
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  <Badge variant={config.variant} size="sm">{config.label}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 px-3 bg-orange-50 rounded-lg border border-orange-200 mb-3">
            <span className="text-xs font-medium text-orange-700">Approval Status</span>
            <span className="text-xs text-orange-600">6 reviews pending approval</span>
          </div>

          {['Review 1', 'Review 2', 'Review 3', 'Review 4', 'Review 5', 'Final Review'].map((reviewName, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <span className="text-sm font-medium text-gray-700">{reviewName}</span>
              <div className="flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4 text-gray-400" />
                <Badge variant="default" size="sm">Pending</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default ReviewStatusCard;
