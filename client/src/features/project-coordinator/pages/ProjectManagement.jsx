// src/features/project-coordinator/pages/ProjectManagement.jsx
import React, { useState, useEffect } from 'react';
import { PlusCircleIcon, EyeIcon } from '@heroicons/react/24/outline';
import Navbar from '../../../shared/components/Navbar';
import CoordinatorTabs from '../components/shared/CoordinatorTabs';
import AcademicFilterSelector from '../components/shared/AcademicFilterSelector';
import ProjectViewTab from '../components/project-management/ProjectViewTab';
import ProjectCreation from '../components/project-management/ProjectCreation';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import { useToast } from '../../../shared/hooks/useToast';
import { getFilteredData } from '../data/sampleData';

const ProjectManagement = () => {
  const [activeTab, setActiveTab] = useState('view');
  const [isPrimary, setIsPrimary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const { showToast } = useToast();

  // Load coordinator permissions
  useEffect(() => {
    const fetchCoordinatorPermissions = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        setIsPrimary(true); // Mock: assuming user is primary coordinator
      } catch (error) {
        console.error('Error fetching coordinator permissions:', error);
        showToast('Error loading permissions', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchCoordinatorPermissions();
  }, [showToast]);

  // Fetch projects when filters change
  useEffect(() => {
    if (filters && activeTab === 'view') {
      fetchProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, activeTab]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Get filtered projects based on selected year and semester
      if (filters) {
        const filteredProjects = getFilteredData(filters.year, filters.semester, 'projects');
        setProjects(filteredProjects);
        showToast(`Loaded ${filteredProjects.length} projects for ${filters.year}-26, Semester ${filters.semester}`, 'success');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      showToast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterComplete = (selectedFilters) => {
    setFilters(selectedFilters);
    setSelectedProject(null);
  };

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
      enabled: isPrimary // Only primary coordinators can create
    }
  ];

  if (loading && !isPrimary) {
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

        {/* Tabs */}
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
            {/* Filter Selector */}
            <AcademicFilterSelector onFilterComplete={handleFilterComplete} />

            {/* Projects List */}
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
