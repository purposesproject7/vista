// src/features/admin/components/panel-management/ProjectPanelAssignment.jsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  LinkIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  UserGroupIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import AcademicFilterSelector from '../student-management/AcademicFilterSelector';
import Card from '../../../../shared/components/Card';
import Button from '../../../../shared/components/Button';
import Input from '../../../../shared/components/Input';
import Badge from '../../../../shared/components/Badge';
import EmptyState from '../../../../shared/components/EmptyState';
import { useToast } from '../../../../shared/hooks/useToast';
import api from '../../../../services/api';

const ProjectPanelAssignment = () => {
  const [filters, setFilters] = useState(null);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [panels, setPanels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const { showToast } = useToast();

  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters(selectedFilters);
    setSelectedProject(null);
    setSelectedPanel(null);
    loadData(selectedFilters);
  }, []);

  const loadData = async (selectedFilters) => {
    try {
      setLoading(true);
      
      const params = {
        school: selectedFilters.school,
        programme: selectedFilters.programme,
        year: selectedFilters.year,
        semester: selectedFilters.semester
      };

      const [projectsRes, panelsRes] = await Promise.all([
        api.get('/admin/projects', { params }),
        api.get('/admin/panels', { params })
      ]);

      if (projectsRes.data.success) {
        setProjects(projectsRes.data.data || []);
      }

      if (panelsRes.data.success) {
        setPanels(panelsRes.data.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleManualAssignment = async () => {
    if (!selectedProject || !selectedPanel) {
      showToast('Please select both a project and a panel', 'error');
      return;
    }

    try {
      setIsAssigning(true);
      
      const response = await api.post('/admin/panels/assign', {
        projectId: selectedProject._id,
        panelId: selectedPanel._id
      });

      if (response.data.success) {
        showToast('Panel assigned to project successfully', 'success');
        setSelectedProject(null);
        setSelectedPanel(null);
        loadData(filters);
      } else {
        showToast(response.data.message || 'Failed to assign panel', 'error');
      }
    } catch (error) {
      console.error('Error assigning panel:', error);
      showToast(error.response?.data?.message || 'Failed to assign panel', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAutoAssignment = async () => {
    if (projects.length === 0 || panels.length === 0) {
      showToast('No projects or panels available for auto-assignment', 'error');
      return;
    }

    try {
      setIsAutoAssigning(true);
      
      const response = await api.post('/admin/panels/auto-assign', {
        school: filters.school,
        programme: filters.programme,
        year: filters.year,
        semester: filters.semester
      });

      if (response.data.success) {
        showToast(
          `Successfully assigned ${response.data.assignedCount || 0} projects to panels`,
          'success'
        );
        loadData(filters);
      } else {
        showToast(response.data.message || 'Failed to auto-assign panels', 'error');
      }
    } catch (error) {
      console.error('Error auto-assigning panels:', error);
      showToast(error.response?.data?.message || 'Failed to auto-assign panels', 'error');
    } finally {
      setIsAutoAssigning(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.name?.toLowerCase().includes(query) ||
      project.students?.some(s => s.name?.toLowerCase().includes(query)) ||
      project.specialization?.toLowerCase().includes(query)
    );
  });

  const unassignedProjects = filteredProjects.filter(p => !p.panelId);
  const assignedProjects = filteredProjects.filter(p => p.panelId);

  const getPanelName = (panel) => {
    if (!panel) return 'Unknown Panel';
    if (panel.members && panel.members.length > 0) {
      return panel.members.map(m => m.faculty?.name || m.name).filter(Boolean).join(' & ');
    }
    return panel.panelName || `Panel ${panel.panelNumber || ''}`;
  };

  if (!filters) {
    return (
      <div className="space-y-6">
        <AcademicFilterSelector onFilterComplete={handleFilterComplete} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">
              {filters.school} - {filters.programme} - {filters.year}-{parseInt(filters.year) + 1}, Semester {filters.semester}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              {unassignedProjects.length} unassigned • {assignedProjects.length} assigned • {panels.length} panels
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAutoAssignment}
              variant="success"
              size="sm"
              loading={isAutoAssigning}
              disabled={isAutoAssigning || unassignedProjects.length === 0 || panels.length === 0}
            >
              <SparklesIcon className="h-4 w-4 mr-2" />
              Auto-Assign All
            </Button>
            <Button
              onClick={() => setFilters(null)}
              variant="secondary"
              size="sm"
            >
              Change Filter
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search projects by name, student, or specialization..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-orange-50 border-orange-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <ExclamationCircleIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-orange-600 font-medium">Unassigned</p>
              <p className="text-2xl font-bold text-orange-900">{unassignedProjects.length}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">Assigned</p>
              <p className="text-2xl font-bold text-green-900">{assignedProjects.length}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Available Panels</p>
              <p className="text-2xl font-bold text-blue-900">{panels.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Manual Assignment Section */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Assignment</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Project
            </label>
            <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
              {unassignedProjects.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No unassigned projects available
                </p>
              ) : (
                unassignedProjects.map(project => (
                  <button
                    key={project._id}
                    onClick={() => setSelectedProject(project)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedProject?._id === project._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900">{project.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="info" size="sm">{project.specialization}</Badge>
                      <Badge variant="secondary" size="sm">
                        {project.students?.length || 0} students
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Guide: {project.guideFaculty?.name || 'Not assigned'}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Panel Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Panel
            </label>
            <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
              {panels.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No panels available
                </p>
              ) : (
                panels.map(panel => (
                  <button
                    key={panel._id}
                    onClick={() => setSelectedPanel(panel)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedPanel?._id === panel._id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-green-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900">{getPanelName(panel)}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="secondary" size="sm">
                        {panel.members?.length || 0} members
                      </Badge>
                      {panel.assignedProjectsCount > 0 && (
                        <Badge variant="info" size="sm">
                          {panel.assignedProjectsCount} projects
                        </Badge>
                      )}
                      {panel.specializations?.length > 0 && (
                        <Badge variant="info" size="sm">
                          {panel.specializations.join(', ')}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Assignment Button */}
        <div className="mt-6 pt-6 border-t">
          {selectedProject && selectedPanel && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <LinkIcon className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Assign <span className="font-semibold">{selectedProject.name}</span>
                    {' → '}
                    <span className="font-semibold">{getPanelName(selectedPanel)}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <Button
            onClick={handleManualAssignment}
            variant="primary"
            size="lg"
            loading={isAssigning}
            disabled={!selectedProject || !selectedPanel || isAssigning}
            className="w-full"
          >
            <LinkIcon className="h-5 w-5 mr-2" />
            Assign Selected Panel to Project
          </Button>
        </div>
      </Card>

      {/* Assigned Projects List */}
      {assignedProjects.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Assigned Projects ({assignedProjects.length})
          </h3>
          <div className="space-y-3">
            {assignedProjects.map(project => {
              const panel = panels.find(p => p._id === project.panelId);
              return (
                <div
                  key={project._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{project.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="info" size="sm">{project.specialization}</Badge>
                      <Badge variant="secondary" size="sm">
                        {project.students?.length || 0} students
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {getPanelName(panel)}
                    </p>
                    <Badge variant="success" size="sm" className="mt-1">
                      Assigned
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <EmptyState
          icon={AcademicCapIcon}
          title="No Projects Found"
          description="No projects match your search criteria."
        />
      )}
    </div>
  );
};

export default ProjectPanelAssignment;
