// src/features/project-coordinator/pages/RequestManagement.jsx
import React from 'react';
import Navbar from '../../../shared/components/Navbar';
import CoordinatorTabs from '../components/shared/CoordinatorTabs';
import RequestList from '../components/request-management/requests/RequestList';

const RequestManagement = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <CoordinatorTabs />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Request Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Review and manage faculty requests for extensions, reschedules, and other approvals
          </p>
        </div>

        {/* Request List Component */}
        <RequestList />
      </div>
    </div>
  );
};

export default RequestManagement;
