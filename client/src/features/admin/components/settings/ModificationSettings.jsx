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
import {
  getFacultyList as apiFetchFacultyList,
  getGuideProjects,
  getPanelProjects,
  getPanels,
  batchReassignGuide,
  batchReassignPanel,
  batchAssignFacultyAsPanel,
  getMarkingSchema
} from '../../../../services/modificationApi';
import { useAdminContext } from '../../context/AdminContext';


const ModificationSettings = () => {
  // Use global context instead of local state
  const { academicContext, updateAcademicContext } = useAdminContext();

  const [contextOptions, setContextOptions] = useState({
    schools: [],
    programs: [],
    academicYears: []
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
  const [ignoreSpecialization, setIgnoreSpecialization] = useState(false);
  const [showAllPrograms, setShowAllPrograms] = useState(false);

  // Search states for reassignment modal
  const [reassignFacultySearch, setReassignFacultySearch] = useState('');
  const [reassignPanelSearch, setReassignPanelSearch] = useState('');

  // New state for flexible panel assignment
  const [panelAssignmentScope, setPanelAssignmentScope] = useState('main'); // 'main' | 'review'
  const [selectedReviewType, setSelectedReviewType] = useState('');
  const [availableReviews, setAvailableReviews] = useState([]);

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
      // Fetch master data from API
      const response = await api.get('/admin/master-data');

      console.log('Master data response:', response.data);

      if (response.data?.success && response.data?.data) {
        const masterData = response.data.data;

        // Transform schools
        const schools = (masterData.schools || [])
          .filter(school => school.isActive !== false)
          .map(school => ({
            value: school.code || school.name,
            label: school.name
          }));

        // Transform programs (will be filtered by school later)
        const allPrograms = (masterData.programs || masterData.departments || [])
          .filter(prog => prog.isActive !== false)
          .map(prog => ({
            value: prog.code || prog.name,
            label: prog.name,
            school: prog.school
          }));

        // Transform academic years
        const academicYears = (masterData.academicYears || [])
          .filter(year => year.isActive !== false)
          .map(year => ({
            value: year.year,
            label: year.year
          }));

        console.log('Transformed data:', { schools, allPrograms, academicYears });

        setContextOptions({
          schools,
          programs: allPrograms,
          academicYears
        });
      } else {
        console.warn('Invalid master data response, using fallback');
        // Fallback to dummy data if API fails
        setContextOptions({
          schools: [
            { value: 'SCOPE', label: 'SCOPE' },
            { value: 'SENSE', label: 'SENSE' },
            { value: 'SELECT', label: 'SELECT' }
          ],
          programs: [
            { value: 'CSE', label: 'Computer Science and Engineering', school: 'SCOPE' },
            { value: 'IT', label: 'Information Technology', school: 'SCOPE' },
            { value: 'ECE', label: 'Electronics and Communication', school: 'SENSE' }
          ],
          academicYears: [
            { value: '2025-26 Fall', label: '2025-26 Fall' },
            { value: '2025-26 Winter', label: '2025-26 Winter' },
            { value: '2024-25 Fall', label: '2024-25 Fall' },
            { value: '2024-25 Winter', label: '2024-25 Winter' }
          ]
        });
      }
    } catch (error) {
      console.error('Error fetching context options:', error);
      setMessage({ type: 'error', text: 'Failed to load context options' });

      // Set fallback dummy data
      setContextOptions({
        schools: [
          { value: 'SCOPE', label: 'SCOPE' },
          { value: 'SENSE', label: 'SENSE' },
          { value: 'SELECT', label: 'SELECT' }
        ],
        programs: [
          { value: 'CSE', label: 'Computer Science and Engineering', school: 'SCOPE' },
          { value: 'IT', label: 'Information Technology', school: 'SCOPE' },
          { value: 'ECE', label: 'Electronics and Communication', school: 'SENSE' }
        ],
        academicYears: [
          { value: '2025-26 Fall', label: '2025-26 Fall' },
          { value: '2025-26 Winter', label: '2025-26 Winter' },
          { value: '2024-25 Fall', label: '2024-25 Fall' },
          { value: '2024-25 Winter', label: '2024-25 Winter' }
        ]
      });
    } finally {
      setLoading(prev => ({ ...prev, context: false }));
    }
  };

  // Fetch faculty list when context is complete
  useEffect(() => {
    // Check if we have all necessary context (year instead of academicYear)
    const programValid = showAllPrograms || academicContext.program;
    if (academicContext.school && programValid && academicContext.year) {
      fetchFacultyList();
    }
  }, [academicContext.school, academicContext.program, academicContext.year, showAllPrograms]);

  // Fetch marking schema to get available reviews
  useEffect(() => {
    if (academicContext.school && academicContext.program && academicContext.year) {
      fetchReviews();
    }
  }, [academicContext.school, academicContext.program, academicContext.year]);

  const fetchReviews = async () => {
    try {
      const response = await getMarkingSchema(
        academicContext.year,
        academicContext.school,
        academicContext.program
      );
      if (response && response.data && response.data.reviews) {
        // Map reviews to { value: reviewName, label: displayName }
        const reviews = response.data.reviews.map(r => ({
          value: r.reviewName,
          label: r.displayName || r.reviewName
        }));
        setAvailableReviews(reviews);
        if (reviews.length > 0) {
          setSelectedReviewType(reviews[0].value);
        }
      }
    } catch (error) {
      console.error('Error fetching marking schema:', error);
      // Don't block UI but maybe log
    }
  };

  const fetchFacultyList = async () => {
    setLoading(prev => ({ ...prev, faculty: true }));
    setFacultyList([]);
    setSelectedFaculty(null);
    try {
      const response = await apiFetchFacultyList(
        academicContext.school,
        showAllPrograms ? 'all' : academicContext.program
      );

      if (!response.data || response.data.length === 0) {
        setFacultyList([]);
        setLoading(prev => ({ ...prev, faculty: false }));
        return;
      }

      // Fetch all guide and panel projects once for counting
      let allGuideData = [];
      let allPanelData = [];

      try {
        const [guideResponse, panelResponse] = await Promise.all([
          getGuideProjects(
            academicContext.year, // Use year from context
            academicContext.school,
            showAllPrograms ? 'all' : academicContext.program
          ),
          getPanelProjects(
            academicContext.year, // Use year from context
            academicContext.school,
            showAllPrograms ? 'all' : academicContext.program
          )
        ]);

        allGuideData = guideResponse.data || [];
        allPanelData = panelResponse.data || [];
        console.log('ModificationSettings: Loaded project data', {
          guideCount: allGuideData.length,
          panelCount: allPanelData.length,
          guideSample: allGuideData[0]
        });
      } catch (err) {
        console.error('Error fetching project data:', err);
      }

      // Transform faculty data with project counts and project names
      const facultyWithCounts = response.data.map((faculty) => {
        // Collect guide projects
        let guideCount = 0;
        const guideProjectNames = [];
        const guideEntry = allGuideData.find(g => g.faculty?.employeeId === faculty.employeeId);
        if (guideEntry) {
          guideCount = guideEntry.guidedProjects?.length || 0;
          guideEntry.guidedProjects?.forEach(proj => {
            if (proj.name) guideProjectNames.push(proj.name);
          });
        }

        // Collect panel projects
        let panelCount = 0;
        const panelProjectNames = [];
        allPanelData.forEach(panelGroup => {
          const isMember = panelGroup.members?.some(member => {
            const memberId = member.faculty?._id || member.faculty;
            return memberId === faculty._id || member.faculty?.employeeId === faculty.employeeId;
          });
          if (isMember) {
            panelCount += panelGroup.projects?.length || 0;
            panelGroup.projects?.forEach(proj => {
              if (proj.name) panelProjectNames.push(proj.name);
            });
          }
        });

        return {
          ...faculty,
          guideCount,
          panelCount,
          guideProjectNames,
          panelProjectNames,
          allProjectNames: [...guideProjectNames, ...panelProjectNames]
        };
      });

      setFacultyList(facultyWithCounts);
    } catch (error) {
      console.error('Error fetching faculty:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load faculty list' });
    } finally {
      setLoading(prev => ({ ...prev, faculty: false }));
    }
  };

  // Fetch projects when faculty is selected
  useEffect(() => {
    if (selectedFaculty) {
      fetchFacultyProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFaculty]);

  const fetchFacultyProjects = async () => {
    if (!selectedFaculty) return;

    setLoading(prev => ({ ...prev, projects: true }));
    setSelectedProjects([]);

    try {
      console.log('Fetching projects for faculty:', selectedFaculty.employeeId);

      // Fetch all guide projects for the academic context
      const guideResponse = await getGuideProjects(
        academicContext.year, // Use year from context
        academicContext.school,
        showAllPrograms ? 'all' : academicContext.program
      );

      // Fetch all panel projects for the academic context
      const panelResponse = await getPanelProjects(
        academicContext.year, // Use year from context
        academicContext.school,
        showAllPrograms ? 'all' : academicContext.program
      );

      console.log('Guide response:', guideResponse);
      console.log('Panel response:', panelResponse);

      // Filter guide projects for the selected faculty
      const guideProjs = [];
      if (guideResponse.data && Array.isArray(guideResponse.data)) {
        guideResponse.data.forEach(facultyGroup => {
          // Check if this faculty group matches the selected faculty
          if (facultyGroup.faculty?.employeeId === selectedFaculty.employeeId) {
            console.log('Found matching faculty group for guide:', facultyGroup);
            facultyGroup.guidedProjects?.forEach(project => {
              guideProjs.push({
                _id: project._id,
                name: project.name,
                students: project.students?.map(s => s.name || s.regNo) || [],
                status: project.status,
                specialization: project.specialization
              });
            });
          }
        });
      }

      // Filter panel projects for the selected faculty
      const panelProjs = [];
      if (panelResponse.data && Array.isArray(panelResponse.data)) {
        panelResponse.data.forEach(panelGroup => {
          // Check if the selected faculty is a member of this panel
          const isMember = panelGroup.members?.some(member => {
            const memberId = member.faculty?._id || member.faculty;
            return memberId === selectedFaculty._id || member.faculty?.employeeId === selectedFaculty.employeeId;
          });

          if (isMember) {
            console.log('Found matching panel group:', panelGroup);
            panelGroup.projects?.forEach(project => {
              panelProjs.push({
                _id: project._id,
                name: project.name,
                students: project.students?.map(s => s.name || s.regNo) || [],
                status: project.status,
                specialization: project.specialization,
                panelName: panelGroup.panelName || `Panel ${panelGroup.panelId?.toString().slice(-4) || 'Unknown'}`,
                assignmentType: project.assignmentType, // Capture assignment type
                reviewType: project.reviewType // Capture review type
              });
            });
          }
        });
      }

      console.log('Filtered guide projects:', guideProjs);
      console.log('Filtered panel projects:', panelProjs);

      setGuideProjects(guideProjs);
      setPanelProjects(panelProjs);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load projects' });
    } finally {
      setLoading(prev => ({ ...prev, projects: false }));
    }
  };

  // Fetch available panels for reassignment
  const fetchAvailablePanels = async (ignoreRestrictions = false) => {
    try {
      console.log('Fetching panels with ignoreRestrictions:', ignoreRestrictions);
      console.log('Program parameter:', ignoreRestrictions ? 'all' : academicContext.program);

      const response = await getPanels(
        academicContext.year, // Use year from context
        ignoreRestrictions ? 'all' : academicContext.school, // Fetch all schools if ignoring restrictions
        ignoreRestrictions ? 'all' : academicContext.program // Fetch all programs if ignoring restrictions
      );

      console.log('Panels response:', response);

      const panels = (response.data || []).map(panel => ({
        _id: panel._id,
        name: panel.panelName || `Panel ${panel._id.slice(-4)}`,
        members: panel.members?.map(m => m.faculty?.name || 'Unknown') || [],
        program: panel.program // Include program info for display
      }));

      console.log('Mapped panels:', panels);
      setAvailablePanels(panels);
    } catch (error) {
      console.error('Error fetching panels:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load panels' });
    }
  };

  // Filter faculty by search (including project names)
  const filteredFaculty = useMemo(() => {
    if (!facultySearch.trim()) return facultyList;
    const search = facultySearch.toLowerCase();
    return facultyList.filter(f =>
      f.name.toLowerCase().includes(search) ||
      f.employeeId.toLowerCase().includes(search) ||
      (f.emailId && f.emailId.toLowerCase().includes(search)) ||
      (f.allProjectNames && f.allProjectNames.some(projName => projName.toLowerCase().includes(search)))
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
  const openReassignModal = async (mode) => {
    setReassignMode(mode);
    if (mode === 'panel') {
      await fetchAvailablePanels(ignoreSpecialization);
    }
    setShowReassignModal(true);
  };

  // Re-fetch panels when ignoreSpecialization changes (for panel reassignment)
  useEffect(() => {
    console.log('useEffect triggered:', { showReassignModal, reassignMode, panelAssignType, ignoreSpecialization });
    if (showReassignModal && reassignMode === 'panel' && panelAssignType === 'existing') {
      console.log('Re-fetching panels due to ignoreSpecialization change');
      fetchAvailablePanels(ignoreSpecialization);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ignoreSpecialization, showReassignModal, reassignMode, panelAssignType]);

  // Handle batch reassignment
  const handleBatchReassign = async () => {
    try {
      const projectIds = selectedProjects.map(p => p.id);
      let results;

      if (reassignMode === 'guide') {
        // Batch reassign guide
        results = await batchReassignGuide(projectIds, targetFaculty.employeeId, ignoreSpecialization);
      } else {
        // Panel reassignment
        if (panelAssignType === 'existing') {
          // Assign to existing panel
          results = await batchReassignPanel(
            projectIds,
            targetPanel._id,
            ignoreSpecialization,
            panelAssignmentScope,
            panelAssignmentScope === 'review' ? selectedReviewType : null
          );
        } else {
          // Create temporary panels with single faculty
          results = await batchAssignFacultyAsPanel(
            projectIds,
            targetFaculty.employeeId,
            academicContext.year, // Use year from context
            academicContext.school,
            academicContext.program,
            ignoreSpecialization, // Added ignoreSpecialization
            panelAssignmentScope, // Added scope
            panelAssignmentScope === 'review' ? selectedReviewType : null // Added review type
          );
        }
      }

      // Count successes and failures
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.filter(r => r.status === 'rejected').length;

      const targetName = reassignMode === 'guide'
        ? targetFaculty.name
        : (panelAssignType === 'existing' ? targetPanel?.name : targetFaculty?.name);

      if (failureCount === 0) {
        setMessage({
          type: 'success',
          text: `Successfully reassigned ${successCount} project(s) to ${targetName}`
        });
      } else {
        setMessage({
          type: 'error',
          text: `Reassigned ${successCount} project(s), ${failureCount} failed`
        });
      }

      // Reset states
      setSelectedProjects([]);
      setShowReassignModal(false);
      setTargetFaculty(null);
      setTargetPanel(null);
      setPanelAssignType('existing');

      // Refresh projects
      await fetchFacultyProjects();
      // Refresh faculty list counts
      await fetchFacultyList();
    } catch (error) {
      console.error('Error reassigning projects:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to reassign projects' });
    }
  };

  // Available faculty for reassignment (excluding current faculty)
  const availableFacultyForReassign = useMemo(() => {
    return facultyList.filter(f => f.employeeId !== selectedFaculty?.employeeId);
  }, [facultyList, selectedFaculty]);

  // Filtered faculty for reassignment modal with search
  const filteredReassignFaculty = useMemo(() => {
    if (!reassignFacultySearch.trim()) return availableFacultyForReassign;
    const search = reassignFacultySearch.toLowerCase();
    return availableFacultyForReassign.filter(f =>
      f.name.toLowerCase().includes(search) ||
      f.employeeId.toLowerCase().includes(search) ||
      (f.emailId && f.emailId.toLowerCase().includes(search))
    );
  }, [availableFacultyForReassign, reassignFacultySearch]);

  // Filtered panels for reassignment modal with search
  const filteredReassignPanels = useMemo(() => {
    if (!reassignPanelSearch.trim()) return availablePanels;
    const search = reassignPanelSearch.toLowerCase();
    return availablePanels.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.members.some(m => m.toLowerCase().includes(search))
    );
  }, [availablePanels, reassignPanelSearch]);

  // Filter programs based on selected school
  const filteredPrograms = useMemo(() => {
    if (!academicContext.school) return [];
    return contextOptions.programs.filter(prog => prog.school === academicContext.school);
  }, [academicContext.school, contextOptions.programs]);

  const isContextComplete = academicContext.school && (showAllPrograms || academicContext.program) && academicContext.year; // Use year

  return (
    <div className="space-y-6">
      {/* Message Banner */}
      {message.text && (
        <div className={`p-3 rounded-lg flex items-center justify-between ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="School"
              options={contextOptions.schools}
              value={academicContext.school}
              onChange={(value) => updateAcademicContext({ school: value, program: '' })} // Use updateAcademicContext
              placeholder="Select school..."
            />

            <Select
              label="Program"
              options={filteredPrograms}
              value={academicContext.program}
              onChange={(value) => updateAcademicContext({ program: value })} // Use updateAcademicContext
              placeholder="Select program..."
              disabled={!academicContext.school || showAllPrograms}
            />

            <div className="flex items-center mt-2 md:mt-0">
              <input
                type="checkbox"
                id="showAllPrograms"
                checked={showAllPrograms}
                onChange={(e) => setShowAllPrograms(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="showAllPrograms" className="ml-2 block text-sm text-gray-900">
                Show All Faculties
              </label>
            </div>

            <Select
              label="Academic Year"
              options={contextOptions.academicYears}
              value={academicContext.year} // Use year from context
              onChange={(value) => updateAcademicContext({ year: value })} // Use updateAcademicContext and map to year
              placeholder="Select year..."
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
                placeholder="Search faculty by name, ID, email, or project name..."
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
                      className={`w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedFaculty?.employeeId === faculty.employeeId ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                    >
                      <div>
                        <p className="font-medium text-gray-900">{faculty.name}</p>
                        <p className="text-xs text-gray-500">{faculty.employeeId} • {faculty.emailId}</p>
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
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${isProjectSelected(project._id)
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isProjectSelected(project._id)}
                                onChange={() => { }}
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
                      {panelProjects.map((project, idx) => (
                        <div
                          key={`${project._id}-${idx}`} // Unique key for potential duplicates across roles
                          onClick={() => toggleProjectSelection(project._id, 'panel')}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${isProjectSelected(project._id)
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isProjectSelected(project._id)}
                                onChange={() => { }}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300"
                              />
                              <div>
                                <p className="font-medium text-gray-900">{project.name}</p>
                                <p className="text-xs text-gray-500">
                                  Students: {project.students.join(', ')} • {project.panelName}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {project.assignmentType === 'Review' && (
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                  {project.reviewType || 'Review'}
                                </span>
                              )}
                              {(!project.assignmentType || project.assignmentType === 'Regular') && (
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                  Main Panel
                                </span>
                              )}
                              <Badge variant="success" size="sm">{project.status}</Badge>
                            </div>
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
          setIgnoreSpecialization(false);
          setReassignFacultySearch('');
          setReassignPanelSearch('');
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
              {/* Search bar for faculty */}
              <div className="relative mb-3">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={reassignFacultySearch}
                  onChange={(e) => setReassignFacultySearch(e.target.value)}
                  placeholder="Search faculty by name, ID, or email..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                {filteredReassignFaculty.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">No faculty found</div>
                ) : (
                  filteredReassignFaculty.map((faculty) => (
                    <button
                      key={faculty.employeeId}
                      onClick={() => setTargetFaculty(faculty)}
                      className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${targetFaculty?.employeeId === faculty.employeeId ? 'bg-blue-50' : ''
                        }`}
                    >
                      <p className="font-medium text-gray-900">{faculty.name}</p>
                      <p className="text-xs text-gray-500">{faculty.employeeId} • {faculty.emailId}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Toggle between existing panel and single faculty */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => { setPanelAssignType('existing'); setTargetFaculty(null); }}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${panelAssignType === 'existing' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Existing Panel
                </button>
                <button
                  onClick={() => { setPanelAssignType('faculty'); setTargetPanel(null); }}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${panelAssignType === 'faculty' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Single Faculty
                </button>
              </div>

              {/* Assignment Scope Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Assignment Scope</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="panelScope"
                      value="main"
                      checked={panelAssignmentScope === 'main'}
                      onChange={(e) => setPanelAssignmentScope(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    Main Project Panel
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="panelScope"
                      value="review"
                      checked={panelAssignmentScope === 'review'}
                      onChange={(e) => setPanelAssignmentScope(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    Specific Review Only
                  </label>
                </div>
              </div>

              {/* Review Type Selection */}
              {panelAssignmentScope === 'review' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Review</label>
                  <Select
                    options={availableReviews}
                    value={selectedReviewType}
                    onChange={setSelectedReviewType}
                    placeholder="Select a review..."
                  />
                </div>
              )}

              {panelAssignType === 'existing' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Target Panel
                  </label>
                  {/* Info message when showing cross-program panels */}
                  {ignoreSpecialization && (
                    <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700">
                        ℹ️ Showing panels from all programs. Cross-program panels are marked.
                      </p>
                    </div>
                  )}
                  {/* Search bar for panels */}
                  <div className="relative mb-3">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={reassignPanelSearch}
                      onChange={(e) => setReassignPanelSearch(e.target.value)}
                      placeholder="Search panels by name or members..."
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                    {filteredReassignPanels.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">No panels found</div>
                    ) : (
                      filteredReassignPanels.map((panel) => (
                        <button
                          key={panel._id}
                          onClick={() => setTargetPanel(panel)}
                          className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${targetPanel?._id === panel._id ? 'bg-blue-50' : ''
                            }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{panel.name}</p>
                              <p className="text-xs text-gray-500">Members: {panel.members.join(', ')}</p>
                              {ignoreSpecialization && panel.program && panel.program !== academicContext.program && (
                                <p className="text-xs text-amber-600 font-medium mt-1">
                                  📍 {panel.program} (Different Program)
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Faculty as Panel
                  </label>
                  {/* Search bar for faculty */}
                  <div className="relative mb-3">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={reassignFacultySearch}
                      onChange={(e) => setReassignFacultySearch(e.target.value)}
                      placeholder="Search faculty by name, ID, or email..."
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                    {filteredReassignFaculty.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">No faculty found</div>
                    ) : (
                      filteredReassignFaculty.map((faculty) => (
                        <button
                          key={faculty.employeeId}
                          onClick={() => setTargetFaculty(faculty)}
                          className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${targetFaculty?.employeeId === faculty.employeeId ? 'bg-blue-50' : ''
                            }`}
                        >
                          <p className="font-medium text-gray-900">{faculty.name}</p>
                          <p className="text-xs text-gray-500">{faculty.employeeId} • Will be assigned as single-member panel</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Department Override UI */}
          <div className="pt-2 border-t">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="ignoreSpecialization" className="text-sm font-medium text-amber-900">
                    Override Department/Specialization Restrictions
                  </label>
                  <button
                    type="button"
                    onClick={() => setIgnoreSpecialization(!ignoreSpecialization)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${ignoreSpecialization ? 'bg-amber-600' : 'bg-gray-200'
                      }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${ignoreSpecialization ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-amber-700">
                  {ignoreSpecialization
                    ? 'Warning: Projects will be reassigned even if the target faculty has a different department or specialization. Use with caution.'
                    : 'Enable this to allow reassignment across different departments/specializations.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowReassignModal(false);
                setTargetFaculty(null);
                setTargetPanel(null);
                setIgnoreSpecialization(false);
                setReassignFacultySearch('');
                setReassignPanelSearch('');
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleBatchReassign}
              disabled={loading.reassigning || (reassignMode === 'guide' ? !targetFaculty : (panelAssignType === 'existing' ? !targetPanel : !targetFaculty))}
            >
              {loading.reassigning ? 'Reassigning...' : 'Confirm Reassignment'}
            </Button>
          </div>
        </div>
      </Modal>
    </div >
  );
};

export default ModificationSettings;
