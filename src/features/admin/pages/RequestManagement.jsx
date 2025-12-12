// src/features/admin/pages/RequestManagement.jsx
import React from 'react';
import Navbar from '../../../shared/components/Navbar';
import AdminTabs from '../components/shared/AdminTabs';
import RequestList from '../components/request-management/RequestList';

const RequestManagement = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <AdminTabs />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Request Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Review and approve faculty review requests
          </p>
        </div>

        <RequestList />
      </div>
    </div>
  );
};

export default RequestManagement;
