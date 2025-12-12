// src/features/admin/pages/ProjectManagement.jsx
import React from 'react';
import Navbar from '../../../shared/components/Navbar';
import AdminTabs from '../components/shared/AdminTabs';
import Card from '../../../shared/components/Card';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const ProjectManagement = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <AdminTabs />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Oversee student projects, timelines, and deliverables
          </p>
        </div>

        <Card className="text-center py-12">
          <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
          <p className="text-sm text-gray-600">Project management features will be available here</p>
        </Card>
      </div>
    </div>
  );
};

export default ProjectManagement;
