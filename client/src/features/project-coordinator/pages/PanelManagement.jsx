// src/features/project-coordinator/pages/PanelManagement.jsx
import React, { useState, useEffect } from 'react';
import { PlusCircleIcon, EyeIcon, LinkIcon } from '@heroicons/react/24/outline';
import Navbar from '../../../shared/components/Navbar';
import CoordinatorTabs from '../components/shared/CoordinatorTabs';
import PanelViewTab from '../components/panel-management/PanelViewTab';
import PanelCreation from '../components/panel-management/PanelCreation';
import ProjectPanelAssignment from '../components/panel-management/ProjectPanelAssignment';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import { useToast } from '../../../shared/hooks/useToast';
import { useAuth } from '../../../shared/hooks/useAuth';

const PanelManagement = () => {
  const [activeTab, setActiveTab] = useState('view');
  const [isPrimary, setIsPrimary] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { user } = useAuth();

  // Load coordinator permissions
  useEffect(() => {
    const fetchCoordinatorPermissions = async () => {
      try {
        setLoading(true);
        // Get isPrimary from user context
        setIsPrimary(user?.isPrimary || false);
      } catch (error) {
        console.error('Error fetching coordinator permissions:', error);
        showToast('Error loading permissions', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchCoordinatorPermissions();
  }, [user, showToast]);

  const panelTabs = [
    {
      id: 'view',
      label: 'Panel View',
      icon: EyeIcon,
      description: 'View existing panels',
      enabled: true
    },
    {
      id: 'create',
      label: 'Panel Create',
      icon: PlusCircleIcon,
      description: 'Create new panels',
      enabled: true
    },
    {
      id: 'assign',
      label: 'Project Assignment',
      icon: LinkIcon,
      description: 'Assign projects to panels',
      enabled: true
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <CoordinatorTabs />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Panel Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage assessment panels, create new panels, and assign projects.
          </p>
        </div>

        {/* Panel Tabs */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-2">
          <div className="flex gap-2 flex-wrap">
            {panelTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isDisabled = !tab.enabled;

              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id)}
                  disabled={isDisabled}
                  className={`
                    flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all
                    ${isDisabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                      : isActive
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
          {activeTab === 'view' && <PanelViewTab isPrimary={isPrimary} />}
          {activeTab === 'create' && <PanelCreation />}
          {activeTab === 'assign' && <ProjectPanelAssignment />}
        </div>
      </div>
    </div>
  );
};

export default PanelManagement;
