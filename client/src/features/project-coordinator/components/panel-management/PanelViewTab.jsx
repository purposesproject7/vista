// src/features/project-coordinator/components/panel-management/PanelViewTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  UsersIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import AcademicFilterSelector from '../shared/AcademicFilterSelector';
import Card from '../../../../shared/components/Card';
import Badge from '../../../../shared/components/Badge';
import EmptyState from '../../../../shared/components/EmptyState';
import LoadingSpinner from '../../../../shared/components/LoadingSpinner';
import { useToast } from '../../../../shared/hooks/useToast';
import { useAuth } from '../../../../shared/hooks/useAuth';
import { fetchPanels as apiFetchPanels } from '../../services/coordinatorApi';

const PanelViewTab = ({ isPrimary = false }) => {
  const [filters, setFilters] = useState(null);
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [markingFilter, setMarkingFilter] = useState('all');
  const { showToast } = useToast();
  const { user } = useAuth();

  // Fetch panels when filters change
  useEffect(() => {
    if (filters) {
      fetchPanels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchPanels = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await apiFetchPanels({
        school: user?.school,
        department: user?.department,
        academicYear: filters?.academicYear
      });
      
      if (response.success) {
        setPanels(response.panels || []);
        showToast(`Loaded ${response.panels?.length || 0} panels`, 'success');
      } else {
        showToast(response.message || 'Failed to load panels', 'error');
      }
    } catch (error) {
      console.error('Error fetching panels:', error);
      showToast(error.response?.data?.message || 'Failed to load panels', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, user, showToast]);

  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters(selectedFilters);
    setSearchQuery('');
    setMarkingFilter('all');
    setExpandedPanel(null);
  }, []);

  const togglePanelExpansion = useCallback((panelId) => {
    setExpandedPanel(prev => prev === panelId ? null : panelId);
  }, []);

  const formatPanelName = (panel) => {
    return `Panel ${panel.panelNumber}`;
  };

  const getMarkingStatusColor = (status) => {
    const colors = {
      full: 'bg-green-100 text-green-800 border border-green-300',
      partial: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      none: 'bg-red-100 text-red-800 border border-red-300'
    };
    return colors[status] || colors.none;
  };

  const getMarkingStatusLabel = (status) => {
    const labels = {
      full: 'Fully Marked',
      partial: 'Partially Marked',
      none: 'Not Marked'
    };
    return labels[status] || 'Unknown';
  };

  // Filter panels
  const filteredPanels = panels.filter(panel => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      formatPanelName(panel).toLowerCase().includes(searchLower) ||
      panel.faculty?.some(f => 
        f.name?.toLowerCase().includes(searchLower) ||
        f.employeeId?.toLowerCase().includes(searchLower)
      ) ||
      panel.teams?.some(t => 
        t.projectTitle?.toLowerCase().includes(searchLower) ||
        t.students?.some(s => 
          s.name?.toLowerCase().includes(searchLower) ||
          s.regNo?.toLowerCase().includes(searchLower)
        )
      );

    const matchesMarking = markingFilter === 'all' || panel.markingStatus === markingFilter;

    return matchesSearch && matchesMarking;
  });

  // Generate mock panels
  function generateMockPanels() {
    const facultyNames = [
      ['Dr. Rajesh Kumar', 'Dr. Priya Sharma', 'Dr. Amit Patel'],
      ['Dr. Sneha Reddy', 'Dr. Vikram Singh', 'Dr. Anita Desai'],
      ['Dr. Suresh Iyer', 'Dr. Kavita Nair', 'Dr. Ramesh Gupta'],
      ['Dr. Meera Joshi', 'Dr. Arun Verma', 'Dr. Deepa Shah'],
      ['Dr. Kiran Rao', 'Dr. Sanjay Mehta', 'Dr. Pooja Kapoor']
    ];
    
    return Array.from({ length: 5 }, (_, i) => ({
      id: `panel-${i + 1}`,
      panelNumber: i + 1,
      markingStatus: ['full', 'partial', 'none'][i % 3],
      faculty: facultyNames[i].map((name, j) => ({
        employeeId: `EMP00${i * 3 + j + 1}`,
        name: name,
        email: `${name.toLowerCase().replace(/\s+/g, '.').replace('dr.', '')}@vit.ac.in`,
        department: 'CSE'
      })),
      teams: Array.from({ length: 4 }, (_, j) => ({
        id: `team-${i}-${j}`,
        projectTitle: `Project ${i * 4 + j + 1}`,
        markingStatus: ['full', 'partial', 'none'][j % 3],
        students: Array.from({ length: 3 }, (_, k) => ({
          regNo: `21BCE${1000 + i * 12 + j * 3 + k}`,
          name: `Student ${i * 12 + j * 3 + k + 1}`,
          email: `student${i * 12 + j * 3 + k + 1}@vitstudent.ac.in`
        }))
      }))
    }));
  }

  return (
    <div className="space-y-6">
      {/* Academic Context Selector */}
      <AcademicFilterSelector onFilterComplete={handleFilterComplete} />

      {/* Panel Management Section */}
      {filters && (
        <>
          {/* Search and Filter Controls */}
          <Card>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search panels, faculty, or projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Marking Status Filter */}
              <div className="sm:w-64">
                <div className="relative">
                  <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={markingFilter}
                    onChange={(e) => setMarkingFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    <option value="all">All Panels</option>
                    <option value="full">Fully Marked</option>
                    <option value="partial">Partially Marked</option>
                    <option value="none">Not Marked</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Panels List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : filteredPanels.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title="No panels found"
              description={searchQuery || markingFilter !== 'all' 
                ? "Try adjusting your search or filters"
                : "No panels have been created for this academic context yet"
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredPanels.map((panel) => (
                <Card key={panel.id} className="overflow-hidden">
                  {/* Panel Header */}
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-4 -m-4"
                    onClick={() => togglePanelExpansion(panel.id)}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <UsersIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {formatPanelName(panel)}
                        </h3>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-600">
                            {panel.faculty?.length || 0} Faculty
                          </span>
                          <span className="text-sm text-gray-400">•</span>
                          <span className="text-sm text-gray-600">
                            {panel.teams?.length || 0} Projects
                          </span>
                        </div>
                      </div>
                      <Badge className={getMarkingStatusColor(panel.markingStatus)}>
                        {getMarkingStatusLabel(panel.markingStatus)}
                      </Badge>
                      {expandedPanel === panel.id ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Panel Details (Expanded) */}
                  {expandedPanel === panel.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {/* Faculty List */}
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                          <UserIcon className="w-4 h-4 mr-2" />
                          Panel Faculty
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {panel.faculty?.map((faculty) => (
                            <div 
                              key={faculty.employeeId}
                              className="bg-gray-50 rounded-lg p-3"
                            >
                              <p className="text-sm font-medium text-gray-900">
                                {faculty.name}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {faculty.employeeId}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {faculty.email}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Projects List */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                          <DocumentTextIcon className="w-4 h-4 mr-2" />
                          Assigned Projects
                        </h4>
                        <div className="space-y-3">
                          {panel.teams?.map((team) => (
                            <div 
                              key={team.id}
                              className="bg-gray-50 rounded-lg p-4"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="text-sm font-medium text-gray-900">
                                  {team.projectTitle}
                                </h5>
                                <Badge className={getMarkingStatusColor(team.markingStatus)}>
                                  {getMarkingStatusLabel(team.markingStatus)}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {team.students?.map((student) => (
                                  <span 
                                    key={student.regNo}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-white text-gray-700 border border-gray-200"
                                  >
                                    {student.regNo}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PanelViewTab;
