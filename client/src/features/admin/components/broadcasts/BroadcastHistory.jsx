// src/features/admin/components/broadcasts/BroadcastHistory.jsx
import React from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import Card from '../../../../shared/components/Card';
import BroadcastHistoryItem from './BroadcastHistoryItem';

const BroadcastHistory = ({
  history,
  loading,
  includeExpired,
  historyLimit,
  onIncludeExpiredChange,
  onLimitChange,
  onEdit,
  onDelete
}) => {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Broadcast History</h2>
            <p className="text-sm text-gray-500">
              {includeExpired
                ? 'Showing all broadcasts including expired ones'
                : 'Only active broadcasts are listed'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={includeExpired}
                onChange={(e) => onIncludeExpiredChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Include expired
            </label>
            <select
              value={historyLimit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={10}>Last 10</option>
              <option value={25}>Last 25</option>
              <option value={50}>Last 50</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Loading broadcast history…</span>
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <CalendarIcon className="h-12 w-12 mb-3" />
            <p className="text-sm font-semibold">No broadcasts recorded yet.</p>
            <p className="text-xs">Send your first message using the form above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <BroadcastHistoryItem
                key={item._id}
                broadcast={item}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default BroadcastHistory;
