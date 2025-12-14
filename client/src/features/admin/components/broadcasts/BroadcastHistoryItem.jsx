// src/features/admin/components/broadcasts/BroadcastHistoryItem.jsx
import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Badge from '../../../../shared/components/Badge';
import Button from '../../../../shared/components/Button';
import { formatTimestamp } from './broadcastUtils';

const BroadcastHistoryItem = ({ broadcast, onEdit, onDelete }) => {
  const isExpired = broadcast.expiresAt && new Date(broadcast.expiresAt) < new Date();
  const isBlocking = broadcast.action === 'block';

  return (
    <div
      className={`p-4 rounded-lg border ${
        isExpired
          ? 'border-gray-200 bg-gray-50'
          : isBlocking
            ? 'border-red-200 bg-red-50/50'
            : 'border-blue-100 bg-blue-50/50'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900">
            {broadcast.title?.trim() || 'Broadcast'}
          </h3>
          <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">
            {broadcast.message}
          </p>
        </div>
        <div className="ml-4 text-right">
          <div className="text-xs text-gray-500 space-y-1">
            <div>Created {formatTimestamp(broadcast.createdAt)}</div>
            {broadcast.expiresAt && (
              <div>Expires {formatTimestamp(broadcast.expiresAt)}</div>
            )}
            <div>Status: <strong>{broadcast.isActive ? 'Active' : 'Inactive'}</strong></div>
            <div>Action: <strong>{broadcast.action || 'notice'}</strong></div>
          </div>
          {isExpired && (
            <Badge variant="secondary" className="mt-2">Expired</Badge>
          )}
          {isBlocking && !isExpired && (
            <Badge variant="danger" className="mt-2">Blocking access</Badge>
          )}
          {broadcast.isActive && !isExpired && (
            <Badge variant="success" className="mt-2">Currently shown</Badge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Badge variant="secondary">
          Schools: {broadcast.targetSchools?.length ? broadcast.targetSchools.join(', ') : 'All'}
        </Badge>
        <Badge variant="secondary">
          Departments: {broadcast.targetDepartments?.length ? broadcast.targetDepartments.join(', ') : 'All'}
        </Badge>
        {broadcast.createdByName && (
          <Badge variant="secondary">By {broadcast.createdByName}</Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onEdit(broadcast)}
        >
          <PencilIcon className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onDelete(broadcast._id)}
        >
          <TrashIcon className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
};

export default BroadcastHistoryItem;
