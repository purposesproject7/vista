// src/features/project-coordinator/pages/ProjectManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircleIcon, EyeIcon } from '@heroicons/react/24/outline';
import Navbar from '../../../shared/components/Navbar';
import CoordinatorTabs from '../components/shared/CoordinatorTabs';
import AcademicFilterSelector from '../components/shared/AcademicFilterSelector';
import ProjectViewTab from '../components/project-management/ProjectViewTab';
import ProjectCreation from '../components/project-management/ProjectCreation';
import Card from '../../../shared/components/Card';
import { useToast } from '../../../shared/hooks/useToast';
import { useAuth } from '../../../shared/hooks/useAuth';
import { fetchProjects as apiFetchProjects } from '../services/coordinatorApi';

const ProjectManagement = () => {
  const [activeTab, setActiveTab] = useState('view');
  const [isPrimary, setIsPrimary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(null);
  const [projects, setProjects] = useState([]);
  const { showToast } = useToast();
  const { user } = useAuth();

  // 1. Fetch coordinator permissions on mount
  useEffect(() => {
    const fetchCoordinatorPermissions = async () => {
      try {
        setLoading(true);
        // Mock API call delay
        await new Promise(resolve => setTimeout(resolve, 400));
        setIsPrimary(true); // Mock: Grant primary access
      } catch (error) {
        console.error('Error fetching permissions:', error);
        showToast('Error loading permissions', 'error');
      } finally {
        setLoading(false); // CRITICAL: This allows the main UI to render
      }
    };

    fetchCoordinatorPermissions();
  }, [showToast]);

  // 2. Memoize handleFilterComplete to prevent infinite loops in AcademicFilterSelector
  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters(prev => {
      if (JSON.stringify(prev) === JSON.stringify(selectedFilters)) return prev;
      return selectedFilters;
    });
  }, []);

  // 3. Memoize fetchProjects for use in the useEffect dependency array
  const fetchProjects = useCallback(async () => {
    if (!filters) return;
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const filteredProjects = getFilteredData(filters.year, filters.semester, 'projects');
      setProjects(filteredProjects);
      
      showToast(`Loaded ${filteredProjects.length} projects`, 'success');
    } catch (error) {
      console.error('Error fetching projects:', error);
      showToast(error.response?.data?.message || 'Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  // 4. Trigger data fetch when filters or tab changes
  useEffect(() => {
    if (filters && activeTab === 'view') {
      fetchProjects();
    }
  }, [filters, activeTab, fetchProjects]);

  const projectTabs = [
    {
      id: 'view',
      label: 'Project View',
      icon: EyeIcon,
      description: 'View existing projects',
      enabled: true
    },
    {
      id: 'create',
      label: 'Project Create',
      icon: PlusCircleIcon,
      description: 'Create new projects',
      enabled: isPrimary 
    }
  ];

  // Global Loading State (Permissions check)
  if (loading && !filters && projects.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            {isPrimary ? 'You have full access to project management' : 'You have view-only access'}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-2">
          <div className="flex gap-2 flex-wrap">
            {projectTabs.map((tab) => {
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
                  title={isDisabled ? `Only primary coordinators can ${tab.label.toLowerCase()}` : tab.description}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'view' && (
          <div className="space-y-6">
            <AcademicFilterSelector onFilterComplete={handleFilterComplete} />

            {filters && (
              <>
                {loading ? (
                  <Card>
                    <div className="py-12 flex justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  </Card>
                ) : (
                  <ProjectViewTab projects={projects} isPrimary={isPrimary} />
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'create' && isPrimary && (
          <ProjectCreation />
        )}
      </div>
    </div>
  );
};

export default ProjectManagement;