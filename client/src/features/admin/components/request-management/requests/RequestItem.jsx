// src/features/admin/components/request-management/requests/RequestItem.jsx
import React, { useState, useRef, useEffect } from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import Badge from '../../../../../shared/components/Badge';
import Button from '../../../../../shared/components/Button';
import { formatDate } from './requestUtils';

const RequestItem = ({ request, onApprove, onReject }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    <div className="p-4 bg-gray-50 rounded-lg relative">
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

        {/* Action Menu - Context Menu */}
        {request.status === 'pending' && (
          <div className="ml-4 relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              title="Actions"
            >
              <EllipsisVerticalIcon className="h-6 w-6 text-gray-500" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200 ring-1 ring-black ring-opacity-5">
                <button
                  onClick={() => {
                    onApprove(request.id);
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                >
                  Approve Request
                </button>
                <button
                  onClick={() => {
                    onReject(request.id);
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  Reject Request
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestItem;
