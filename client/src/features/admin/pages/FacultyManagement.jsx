// src/features/admin/pages/FacultyManagement.jsx
import React, { useState } from 'react';
import { EyeIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import Navbar from '../../../shared/components/Navbar';
import AdminTabs from '../components/shared/AdminTabs';
import FacultyViewTab from '../components/faculty-management/FacultyViewTab';
import FacultyUploadTab from '../components/faculty-management/FacultyUploadTab';

const FacultyManagement = () => {
  const [activeTab, setActiveTab] = useState('view');

  const facultyTabs = [
    {
      id: 'view',
      label: 'Faculty View',
      icon: EyeIcon,
      description: 'View and manage existing faculty'
    },
    {
      id: 'upload',
      label: 'Faculty Upload',
      icon: ArrowUpTrayIcon,
      description: 'Add faculty via Excel or single entry'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <AdminTabs />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Faculty Management</h1>
        </div>

        {/* Faculty Tabs */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-2">
          <div className="flex gap-2">
            {facultyTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  title={tab.description}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'view' && <FacultyViewTab />}
          {activeTab === 'upload' && <FacultyUploadTab />}
        </div>
      </div>
    </div>
  );
};

export default FacultyManagement;
