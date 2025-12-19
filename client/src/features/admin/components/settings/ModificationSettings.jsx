// src/features/admin/components/settings/ModificationSettings.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Card from '../../../../shared/components/Card';
import Button from '../../../../shared/components/Button';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';
import LoadingSpinner from '../../../../shared/components/LoadingSpinner';
import EmptyState from '../../../../shared/components/EmptyState';
import Badge from '../../../../shared/components/Badge';
import Modal from '../../../../shared/components/Modal';
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import api from '../../../../services/api';

const ModificationSettings = () => {
  // Academic context state
  const [academicContext, setAcademicContext] = useState({
    school: '',
    department: '',
    academicYear: '',
    semester: ''
  });
  
  const [contextOptions, setContextOptions] = useState({
    schools: [],
    departments: [],
    academicYears: [],
    semesters: []
  });

  // Faculty selection state
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [facultySearch, setFacultySearch] = useState('');
  
  // Projects state
  const [guideProjects, setGuideProjects] = useState([]);
  const [panelProjects, setPanelProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  
  // Reassignment state
  const [reassignMode, setReassignMode] = useState(null); // 'guide' | 'panel'
  const [targetFaculty, setTargetFaculty] = useState(null);
  const [targetPanel, setTargetPanel] = useState(null);
  const [availablePanels, setAvailablePanels] = useState([]);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [panelAssignType, setPanelAssignType] = useState('existing'); // 'existing' | 'faculty'
  
  // Loading states
  const [loading, setLoading] = useState({
    context: false,
    faculty: false,
    projects: false,
    reassigning: false
  });

  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch initial context options (schools, departments, academic years)
  useEffect(() => {
    fetchContextOptions();
  }, []);

  const fetchContextOptions = async () => {
    setLoading(prev => ({ ...prev, context: true }));
    try {
      // TODO: Replace with actual API calls
      // const response = await api.get('/admin/master-data');
      
      // Dummy data for now
      setContextOptions({
        schools: [
          { value: 'SCOPE', label: 'SCOPE' },
          { value: 'SENSE', label: 'SENSE' },
          { value: 'SELECT', label: 'SELECT' }
        ],
        departments: [
          { value: 'CSE', label: 'Computer Science and Engineering' },
          { value: 'IT', label: 'Information Technology' },
          { value: 'ECE', label: 'Electronics and Communication' }
        ],
        academicYears: [
          { value: '2025-26', label: '2025-26' },
          { value: '2024-25', label: '2024-25' },
          { value: '2023-24', label: '2023-24' }
        ],
        semesters: [
          { value: 'Fall', label: 'Fall Semester' },
          { value: 'Winter', label: 'Winter Semester' },
          { value: 'Summer', label: 'Summer Semester' }
        ]
      });
    } catch (error) {
      console.error('Error fetching context options:', error);
      setMessage({ type: 'error', text: 'Failed to load context options' });
    } finally {
      setLoading(prev => ({ ...prev, context: false }));
    }
  };

  // Fetch faculty list when context is complete
  useEffect(() => {
    if (academicContext.school && academicContext.department && academicContext.academicYear && academicContext.semester) {
      fetchFacultyList();
    }
  }, [academicContext]);

  const fetchFacultyList = async () => {
    setLoading(prev => ({ ...prev, faculty: true }));
    try {
      // TODO: Replace with actual API call
      // const response = await api.get('/admin/faculty', { params: academicContext });
      
      // Dummy data for now
      setFacultyList([
        { employeeId: 'FAC001', name: 'Dr. John Smith', email: 'john.smith@university.edu', guideCount: 5, panelCount: 3 },
        { employeeId: 'FAC002', name: 'Dr. Jane Doe', email: 'jane.doe@university.edu', guideCount: 4, panelCount: 5 },
        { employeeId: 'FAC003', name: 'Prof. Robert Wilson', email: 'robert.wilson@university.edu', guideCount: 6, panelCount: 2 },
        { employeeId: 'FAC004', name: 'Dr. Emily Brown', email: 'emily.brown@university.edu', guideCount: 3, panelCount: 4 },
        { employeeId: 'FAC005', name: 'Prof. Michael Chen', email: 'michael.chen@university.edu', guideCount: 7, panelCount: 6 }
      ]);
    } catch (error) {
      console.error('Error fetching faculty:', error);
      setMessage({ type: 'error', text: 'Failed to load faculty list' });
    } finally {
      setLoading(prev => ({ ...prev, faculty: false }));
    }
  };

  // Fetch projects when faculty is selected
  useEffect(() => {
    if (selectedFaculty) {
      fetchFacultyProjects();
    }
  }, [selectedFaculty]);

  const fetchFacultyProjects = async () => {
    if (!selectedFaculty) return;
    
    setLoading(prev => ({ ...prev, projects: true }));
    setSelectedProjects([]);
    
    try {
      // TODO: Replace with actual API calls
      // const guideResponse = await api.get(`/projects/guide/${selectedFaculty.employeeId}`);
      // const panelResponse = await api.get(`/projects/panel/${selectedFaculty.employeeId}`);
      
      // Dummy data for now
      setGuideProjects([
        { _id: 'p1', name: 'AI-Based Traffic Management', students: ['John Doe', 'Jane Smith'], status: 'active', specialization: 'Machine Learning' },
        { _id: 'p2', name: 'Smart Home Automation', students: ['Mike Wilson', 'Sarah Brown'], status: 'active', specialization: 'IoT' },
        { _id: 'p3', name: 'Blockchain Voting System', students: ['Alex Johnson'], status: 'active', specialization: 'Blockchain' }
      ]);
      
      setPanelProjects([
        { _id: 'p4', name: 'Cloud Resource Optimizer', students: ['Tom Hardy', 'Lisa Ray'], status: 'active', specialization: 'Cloud Computing', panelName: 'Panel A' },
        { _id: 'p5', name: 'NLP Chatbot Platform', students: ['Chris Evans'], status: 'active', specialization: 'NLP', panelName: 'Panel B' }
      ]);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setMessage({ type: 'error', text: 'Failed to load projects' });
    } finally {
      setLoading(prev => ({ ...prev, projects: false }));
    }
  };

  // Fetch available panels for reassignment
  const fetchAvailablePanels = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await api.get('/admin/panels', { params: academicContext });
      
      // Dummy data
      setAvailablePanels([
        { _id: 'panel1', name: 'Panel A', members: ['Dr. John Smith', 'Dr. Jane Doe'] },
        { _id: 'panel2', name: 'Panel B', members: ['Prof. Robert Wilson', 'Dr. Emily Brown'] },
        { _id: 'panel3', name: 'Panel C', members: ['Prof. Michael Chen', 'Dr. Sarah Lee'] }
      ]);
    } catch (error) {
      console.error('Error fetching panels:', error);
    }
  };

  // Filter faculty by search
  const filteredFaculty = useMemo(() => {
    if (!facultySearch.trim()) return facultyList;
    const search = facultySearch.toLowerCase();
    return facultyList.filter(f => 
      f.name.toLowerCase().includes(search) || 
      f.employeeId.toLowerCase().includes(search) ||
      f.email.toLowerCase().includes(search)
    );
  }, [facultyList, facultySearch]);

  // Handle project selection
  const toggleProjectSelection = (projectId, type) => {
    setSelectedProjects(prev => {
      const exists = prev.find(p => p.id === projectId);
      if (exists) {
        return prev.filter(p => p.id !== projectId);
      }
      return [...prev, { id: projectId, type }];
    });
  };

  const isProjectSelected = (projectId) => {
    return selectedProjects.some(p => p.id === projectId);
  };

  // Open reassign modal
  const openReassignModal = (mode) => {
    if (selectedProjects.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one project to reassign' });
      return;
    }
    
    setReassignMode(mode);
    if (mode === 'panel') {
      fetchAvailablePanels();
    }
    setShowReassignModal(true);
  };

  // Handle reassignment
  const handleReassign = async () => {
    if (reassignMode === 'guide' && !targetFaculty) {
      setMessage({ type: 'error', text: 'Please select a target faculty' });
      return;
    }
    if (reassignMode === 'panel' && !targetPanel && !targetFaculty) {
      setMessage({ type: 'error', text: 'Please select a target panel or faculty' });
      return;
    }

    setLoading(prev => ({ ...prev, reassigning: true }));
    
    try {
      // TODO: Replace with actual API calls
      // For each selected project, call the appropriate reassign API
      // await Promise.all(selectedProjects.map(project => 
      //   reassignMode === 'guide' 
      //     ? api.put(`/projects/${project.id}/reassign-guide`, { guideFacultyEmpId: targetFaculty.employeeId })
      //     : api.post('/panels/assign', { projectId: project.id, panelId: targetPanel._id })
      // ));

      // Simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const targetName = reassignMode === 'guide' 
        ? targetFaculty.name 
        : (panelAssignType === 'existing' ? targetPanel?.name : targetFaculty?.name);
      
      setMessage({ 
        type: 'success', 
        text: `Successfully reassigned ${selectedProjects.length} project(s) to ${targetName}` 
      });
      
      // Reset states
      setSelectedProjects([]);
      setShowReassignModal(false);
      setTargetFaculty(null);
      setTargetPanel(null);
      setPanelAssignType('existing');
      
      // Refresh projects
      fetchFacultyProjects();
    } catch (error) {
      console.error('Error reassigning projects:', error);
      setMessage({ type: 'error', text: 'Failed to reassign projects' });
    } finally {
      setLoading(prev => ({ ...prev, reassigning: false }));
    }
  };

  // Available faculty for reassignment (excluding current faculty)
  const availableFacultyForReassign = useMemo(() => {
    return facultyList.filter(f => f.employeeId !== selectedFaculty?.employeeId);
  }, [facultyList, selectedFaculty]);

  const isContextComplete = academicContext.school && academicContext.department && academicContext.academicYear && academicContext.semester;

  return (
    <div className="space-y-6">
      {/* Message Banner */}
      {message.text && (
        <div className={`p-3 rounded-lg flex items-center justify-between ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
          <button onClick={() => setMessage({ type: '', text: '' })} className="p-1 hover:bg-white/50 rounded">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Academic Context Selection */}
      <Card>
        <div className="p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AcademicCapIcon className="w-5 h-5 text-blue-600" />
            Academic Context
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="School"
              options={contextOptions.schools}
              value={academicContext.school}
              onChange={(value) => setAcademicContext(prev => ({ ...prev, school: value, department: '' }))}
              placeholder="Select school..."
            />
            
            <Select
              label="Department"
              options={contextOptions.departments}
              value={academicContext.department}
              onChange={(value) => setAcademicContext(prev => ({ ...prev, department: value }))}
              placeholder="Select department..."
              disabled={!academicContext.school}
            />
            
            <Select
              label="Academic Year"
              options={contextOptions.academicYears}
              value={academicContext.academicYear}
              onChange={(value) => setAcademicContext(prev => ({ ...prev, academicYear: value }))}
              placeholder="Select year..."
            />
            
            <Select
              label="Semester"
              options={contextOptions.semesters}
              value={academicContext.semester}
              onChange={(value) => setAcademicContext(prev => ({ ...prev, semester: value }))}
              placeholder="Select semester..."
              disabled={!academicContext.academicYear}
            />
          </div>
        </div>
      </Card>

      {/* Faculty Selection */}
      {isContextComplete && (
        <Card>
          <div className="p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-blue-600" />
              Select Faculty
            </h3>
            
            {/* Search Bar */}
            <div className="relative mb-4">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={facultySearch}
                onChange={(e) => setFacultySearch(e.target.value)}
                placeholder="Search faculty by name, ID, or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            
            {/* Faculty List */}
            {loading.faculty ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
                {filteredFaculty.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">No faculty found</div>
                ) : (
                  filteredFaculty.map((faculty) => (
                    <button
                      key={faculty.employeeId}
                      onClick={() => setSelectedFaculty(faculty)}
                      className={`w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                        selectedFaculty?.employeeId === faculty.employeeId ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div>
                        <p className="font-medium text-gray-900">{faculty.name}</p>
                        <p className="text-xs text-gray-500">{faculty.employeeId} • {faculty.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="info" size="sm">Guide: {faculty.guideCount}</Badge>
                        <Badge variant="secondary" size="sm">Panel: {faculty.panelCount}</Badge>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Projects Display */}
      {selectedFaculty && (
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">
                Projects under {selectedFaculty.name}
              </h3>
              
              {selectedProjects.length > 0 && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => openReassignModal('guide')}
                  >
                    <ArrowRightIcon className="w-4 h-4 mr-1" />
                    Reassign Guide ({selectedProjects.filter(p => p.type === 'guide').length})
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => openReassignModal('panel')}
                  >
                    <ArrowRightIcon className="w-4 h-4 mr-1" />
                    Reassign Panel ({selectedProjects.filter(p => p.type === 'panel').length})
                  </Button>
                </div>
              )}
            </div>

            {loading.projects ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Guide Projects */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    As Guide ({guideProjects.length})
                  </h4>
                  
                  {guideProjects.length === 0 ? (
                    <p className="text-sm text-gray-500 pl-4">No projects as guide</p>
                  ) : (
                    <div className="space-y-2">
                      {guideProjects.map((project) => (
                        <div
                          key={project._id}
                          onClick={() => toggleProjectSelection(project._id, 'guide')}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            isProjectSelected(project._id)
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isProjectSelected(project._id)}
                                onChange={() => {}}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300"
                              />
                              <div>
                                <p className="font-medium text-gray-900">{project.name}</p>
                                <p className="text-xs text-gray-500">
                                  Students: {project.students.join(', ')} • {project.specialization}
                                </p>
                              </div>
                            </div>
                            <Badge variant="success" size="sm">{project.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Panel Projects */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    As Panel Member ({panelProjects.length})
                  </h4>
                  
                  {panelProjects.length === 0 ? (
                    <p className="text-sm text-gray-500 pl-4">No projects as panel member</p>
                  ) : (
                    <div className="space-y-2">
                      {panelProjects.map((project) => (
                        <div
                          key={project._id}
                          onClick={() => toggleProjectSelection(project._id, 'panel')}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            isProjectSelected(project._id)
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isProjectSelected(project._id)}
                                onChange={() => {}}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300"
                              />
                              <div>
                                <p className="font-medium text-gray-900">{project.name}</p>
                                <p className="text-xs text-gray-500">
                                  Students: {project.students.join(', ')} • {project.panelName}
                                </p>
                              </div>
                            </div>
                            <Badge variant="success" size="sm">{project.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Reassignment Modal */}
      <Modal
        isOpen={showReassignModal}
        onClose={() => {
          setShowReassignModal(false);
          setTargetFaculty(null);
          setTargetPanel(null);
          setPanelAssignType('existing');
        }}
        title={`Reassign ${reassignMode === 'guide' ? 'Guide' : 'Panel'}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {selectedProjects.length} project(s) selected for reassignment
          </p>

          {reassignMode === 'guide' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select New Guide Faculty
              </label>
              <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                {availableFacultyForReassign.map((faculty) => (
                  <button
                    key={faculty.employeeId}
                    onClick={() => setTargetFaculty(faculty)}
                    className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                      targetFaculty?.employeeId === faculty.employeeId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <p className="font-medium text-gray-900">{faculty.name}</p>
                    <p className="text-xs text-gray-500">{faculty.employeeId}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Toggle between existing panel and single faculty */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => { setPanelAssignType('existing'); setTargetFaculty(null); }}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    panelAssignType === 'existing' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Existing Panel
                </button>
                <button
                  onClick={() => { setPanelAssignType('faculty'); setTargetPanel(null); }}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    panelAssignType === 'faculty' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Single Faculty
                </button>
              </div>

              {panelAssignType === 'existing' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Target Panel
                  </label>
                  <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                    {availablePanels.map((panel) => (
                      <button
                        key={panel._id}
                        onClick={() => setTargetPanel(panel)}
                        className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                          targetPanel?._id === panel._id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <p className="font-medium text-gray-900">{panel.name}</p>
                        <p className="text-xs text-gray-500">Members: {panel.members.join(', ')}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Faculty as Panel
                  </label>
                  <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                    {availableFacultyForReassign.map((faculty) => (
                      <button
                        key={faculty.employeeId}
                        onClick={() => setTargetFaculty(faculty)}
                        className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                          targetFaculty?.employeeId === faculty.employeeId ? 'bg-blue-50' : ''
                        }`}
                      >
                        <p className="font-medium text-gray-900">{faculty.name}</p>
                        <p className="text-xs text-gray-500">{faculty.employeeId} • Will be assigned as single-member panel</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => {
                setShowReassignModal(false);
                setTargetFaculty(null);
                setTargetPanel(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              size="sm"
              onClick={handleReassign}
              disabled={loading.reassigning || (reassignMode === 'guide' ? !targetFaculty : (panelAssignType === 'existing' ? !targetPanel : !targetFaculty))}
            >
              {loading.reassigning ? 'Reassigning...' : 'Confirm Reassignment'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ModificationSettings;
