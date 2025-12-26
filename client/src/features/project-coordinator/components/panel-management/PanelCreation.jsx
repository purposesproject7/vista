// src/features/project-coordinator/components/panel-management/PanelCreation.jsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  SparklesIcon,
  DocumentPlusIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import AcademicFilterSelector from '../shared/AcademicFilterSelector';
import Card from '../../../../shared/components/Card';
import Button from '../../../../shared/components/Button';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';
import Badge from '../../../../shared/components/Badge';
import EmptyState from '../../../../shared/components/EmptyState';
import { useToast } from '../../../../shared/hooks/useToast';
import { useAuth } from '../../../../shared/hooks/useAuth';
import { 
  fetchFaculty as apiFetchFaculty,
  createPanel as apiCreatePanel,
  bulkCreatePanels as apiBulkCreatePanels
} from '../../services/coordinatorApi';

const PanelCreation = () => {
  const [filters, setFilters] = useState(null);
  const [activeMode, setActiveMode] = useState(null); // 'manual' or 'auto'
  const [loading, setLoading] = useState(false);
  const [createdPanels, setCreatedPanels] = useState([]);
  const [availableFaculty, setAvailableFaculty] = useState([]);
  const { showToast } = useToast();
  const { user } = useAuth();

  // Manual mode state
  const [manualForm, setManualForm] = useState({
    panelName: '',
    venue: '',
    specializations: '',
    type: 'regular',
    panelCount: 1,
    membersPerPanel: 1
  });
  const [manualPanelsToCreate, setManualPanelsToCreate] = useState([]);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Auto mode state
  const [autoForm, setAutoForm] = useState({
    totalPanelCount: 1,
    membersPerPanel: 2,
    specializations: '',
    type: 'regular'
  });
  const [autoSummary, setAutoSummary] = useState(null);
  const [isCreatingAuto, setIsCreatingAuto] = useState(false);

  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters(selectedFilters);
    setActiveMode(null);
    setCreatedPanels([]);
    setManualForm({
      panelName: '',
      venue: '',
      specializations: '',
      type: 'regular',
      panelCount: 1,
      membersPerPanel: 1
    });
    setManualPanelsToCreate([]);
    setAutoForm({
      totalPanelCount: 1,
      membersPerPanel: 2,
      specializations: '',
      type: 'regular'
    });
    setAutoSummary(null);
    
    // Fetch available faculty
    fetchAvailableFaculty(selectedFilters);
  }, []);

  const fetchAvailableFaculty = useCallback(async (selectedFilters) => {
    try {
      setLoading(true);
      
      const response = await apiFetchFaculty({
        school: user?.school,
        department: user?.department,
        academicYear: selectedFilters?.academicYear
      });
      
      if (response.success) {
        setAvailableFaculty(response.faculty || []);
      } else {
        showToast(response.message || 'Failed to fetch available faculty', 'error');
      }
    } catch (error) {
      console.error('Error fetching faculty:', error);
      showToast(error.response?.data?.message || 'Failed to fetch available faculty', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  const generateMockFaculty = (count) => {
    const names = [
      'Dr. Rajesh Kumar', 'Prof. Anjali Singh', 'Dr. Amit Patel', 'Prof. Sneha Sharma',
      'Dr. Vikram Gupta', 'Prof. Priya Desai', 'Dr. Suresh Nair', 'Prof. Meera Iyer',
      'Dr. Arjun Verma', 'Prof. Neha Gupta', 'Dr. Sanjay Sharma', 'Prof. Deepika Singh',
      'Dr. Rohit Kumar', 'Prof. Ananya Chakraborty', 'Dr. Vivek Patel', 'Prof. Ritika Singh',
      'Dr. Nitin Joshi', 'Prof. Pooja Mishra', 'Dr. Sandeep Singh', 'Prof. Kavya Reddy'
    ];
    
    const faculty = [];
    for (let i = 0; i < count; i++) {
      faculty.push({
        id: `FAC${String(i + 1).padStart(4, '0')}`,
        name: names[i % names.length] + ` ${Math.floor(i / names.length) + 1}`,
        email: `faculty${i + 1}@university.edu`,
        specialization: ['AI/ML', 'Web Dev', 'Cloud', 'Database', 'Security'][i % 5]
      });
    }
    return faculty;
  };

  // ====================
  // MANUAL CREATION MODE
  // ====================

  const handleManualFormChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    
    if (name === 'panelCount' || name === 'membersPerPanel') {
      // Allow empty string while typing, but keep as number type when not empty
      finalValue = value === '' ? '' : parseInt(value) || 0;
    }
    
    setManualForm(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleAddManualPanel = () => {
    if (!manualForm.panelName || manualForm.panelCount < 1 || manualForm.membersPerPanel < 1) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const specializations = manualForm.specializations
      ? manualForm.specializations.split(',').map(s => s.trim()).filter(s => s)
      : [];

    const newPanel = {
      id: Date.now(),
      panelName: manualForm.panelName,
      venue: manualForm.venue,
      specializations,
      type: manualForm.type,
      panelCount: manualForm.panelCount,
      membersPerPanel: manualForm.membersPerPanel,
      requiredFaculty: manualForm.panelCount * manualForm.membersPerPanel
    };

    setManualPanelsToCreate(prev => [...prev, newPanel]);
    setManualForm({
      panelName: '',
      venue: '',
      specializations: '',
      type: 'regular',
      panelCount: 1,
      membersPerPanel: 1
    });
    showToast('Panel template added', 'success');
  };

  const handleRemoveManualPanel = (id) => {
    setManualPanelsToCreate(prev => prev.filter(p => p.id !== id));
    showToast('Panel template removed', 'success');
  };

  const handleSubmitManualPanels = async () => {
    if (manualPanelsToCreate.length === 0) {
      showToast('Please add at least one panel template', 'error');
      return;
    }

    // Check if enough faculty available
    const totalFacultyNeeded = manualPanelsToCreate.reduce((sum, p) => sum + p.requiredFaculty, 0);
    if (totalFacultyNeeded > availableFaculty.length) {
      showToast(
        `Not enough faculty available. Need ${totalFacultyNeeded}, but only ${availableFaculty.length} available`,
        'error'
      );
      return;
    }

    try {
      setIsSubmittingManual(true);

      // Create panels by distributing faculty
      const createdData = createPanelsWithFacultyDistribution(manualPanelsToCreate);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In real implementation, send to backend API
      // const response = await api.post('/coordinator/panels/create', {
      //   panels: createdData,
      //   filters
      // });

      setCreatedPanels(prev => [...prev, ...createdData]);
      setManualPanelsToCreate([]);
      showToast(`Successfully created ${createdData.length} panels`, 'success');
    } catch (error) {
      console.error('Error creating panels:', error);
      showToast('Failed to create panels', 'error');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const createPanelsWithFacultyDistribution = (panelTemplates) => {
    const createdPanels = [];
    let facultyIndex = 0;
    const usedFacultyIds = new Set();

    // Shuffle faculty to ensure randomness
    const shuffledFaculty = [...availableFaculty].sort(() => Math.random() - 0.5);

    panelTemplates.forEach(template => {
      for (let i = 0; i < template.panelCount; i++) {
        const members = [];
        const membersNeeded = template.membersPerPanel;

        for (let j = 0; j < membersNeeded; j++) {
          // Get next faculty ensuring no duplicates
          while (facultyIndex < shuffledFaculty.length && usedFacultyIds.has(shuffledFaculty[facultyIndex].id)) {
            facultyIndex++;
          }

          if (facultyIndex < shuffledFaculty.length) {
            const faculty = shuffledFaculty[facultyIndex];
            members.push({
              faculty: faculty.id,
              addedAt: new Date()
            });
            usedFacultyIds.add(faculty.id);
            facultyIndex++;
          }
        }

        if (members.length > 0) {
          createdPanels.push({
            panelName: `${template.panelName} - ${i + 1}`,
            members,
            venue: template.venue,
            academicYear: filters.year + '-' + (parseInt(filters.year) + 1).toString().slice(2),
            school: 'SCOPE', // From coordinator context
            department: 'CSE', // From coordinator context
            specializations: template.specializations,
            type: template.type,
            maxProjects: 10,
            assignedProjectsCount: 0,
            isActive: true
          });
        }
      }
    });

    return createdPanels;
  };

  // ====================
  // AUTO CREATION MODE
  // ====================

  const handleAutoFormChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    
    if (name === 'totalPanelCount' || name === 'membersPerPanel') {
      // Allow empty string while typing, but keep as number type when not empty
      finalValue = value === '' ? '' : parseInt(value) || 0;
    }
    
    setAutoForm(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handlePreviewAutoCreation = () => {
    if (autoForm.totalPanelCount < 1 || autoForm.membersPerPanel < 1) {
      showToast('Please enter valid numbers', 'error');
      return;
    }

    const requiredFaculty = autoForm.totalPanelCount * autoForm.membersPerPanel;
    const availableFacultyCount = availableFaculty.length;

    if (requiredFaculty > availableFacultyCount) {
      showToast(
        `Not enough faculty. Need ${requiredFaculty}, but only ${availableFacultyCount} available`,
        'error'
      );
      return;
    }

    const summary = {
      totalPanels: autoForm.totalPanelCount,
      membersPerPanel: autoForm.membersPerPanel,
      totalFacultyRequired: requiredFaculty,
      availableFaculty: availableFacultyCount,
      specializations: autoForm.specializations ? autoForm.specializations.split(',').map(s => s.trim()).filter(s => s) : [],
      type: autoForm.type
    };

    setAutoSummary(summary);
  };

  const handleCreateAutoPanels = async () => {
    if (!autoSummary) {
      showToast('Please preview auto-creation first', 'error');
      return;
    }

    try {
      setIsCreatingAuto(true);

      // Create auto-distributed panels
      const autoPanels = createAutoPanels(autoSummary);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));

      // In real implementation, send to backend API
      // const response = await api.post('/coordinator/panels/auto-create', {
      //   panels: autoPanels,
      //   filters
      // });

      setCreatedPanels(prev => [...prev, ...autoPanels]);
      setAutoSummary(null);
      setAutoForm({
        totalPanelCount: 1,
        membersPerPanel: 2,
        specializations: '',
        type: 'regular'
      });
      showToast(`Successfully auto-created ${autoPanels.length} panels`, 'success');
    } catch (error) {
      console.error('Error creating panels:', error);
      showToast('Failed to create panels', 'error');
    } finally {
      setIsCreatingAuto(false);
    }
  };

  const createAutoPanels = (summary) => {
    const autoPanels = [];
    const shuffledFaculty = [...availableFaculty].sort(() => Math.random() - 0.5);
    let facultyIndex = 0;

    for (let i = 0; i < summary.totalPanels; i++) {
      const members = [];

      for (let j = 0; j < summary.membersPerPanel; j++) {
        if (facultyIndex < shuffledFaculty.length) {
          const faculty = shuffledFaculty[facultyIndex];
          members.push({
            faculty: faculty.id,
            addedAt: new Date()
          });
          facultyIndex++;
        }
      }

      if (members.length > 0) {
        autoPanels.push({
          panelName: `Auto Panel ${i + 1}`,
          members,
          venue: '',
          academicYear: filters.year + '-' + (parseInt(filters.year) + 1).toString().slice(2),
          school: 'SCOPE', // From coordinator context
          department: 'CSE', // From coordinator context
          specializations: summary.specializations,
          type: summary.type,
          maxProjects: 10,
          assignedProjectsCount: 0,
          isActive: true
        });
      }
    }

    return autoPanels;
  };

  // ====================
  // RENDER
  // ====================

  if (!filters) {
    return (
      <div className="space-y-6">
        <AcademicFilterSelector onFilterComplete={handleFilterComplete} />
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
              Selected: {filters.year}-26, Semester {filters.semester}
            </p>
            <p className="text-xs text-blue-700">Available Faculty: {availableFaculty.length}</p>
          </div>
          <Button
            onClick={() => handleFilterComplete(null)}
            variant="secondary"
            size="sm"
          >
            Change Filter
          </Button>
        </div>
      </div>

      {/* Mode Selection */}
      {!activeMode ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Manual Creation */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setActiveMode('manual')}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DocumentPlusIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Manual Creation</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Create panels manually with custom details. Set panel names, venues, specializations, and faculty assignments.
                </p>
                <Button size="sm" variant="primary">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Manually
                </Button>
              </div>
            </div>
          </Card>

          {/* Auto Creation */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setActiveMode('auto')}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <SparklesIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Auto Creation</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Automatically distribute available faculty into equal panels. System ensures no faculty duplication.
                </p>
                <Button size="sm" variant="success">
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Create Automatically
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {/* Manual Creation Mode */}
      {activeMode === 'manual' && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Manual Panel Creation</h3>
              <Button
                onClick={() => setActiveMode(null)}
                variant="secondary"
                size="sm"
              >
                Back to Options
              </Button>
            </div>

            {/* Form */}
            <div className="space-y-4 mb-6">
              <Input
                label="Panel Name Pattern"
                name="panelName"
                placeholder="e.g., CSE Panel, AI/ML Panel"
                value={manualForm.panelName}
                onChange={handleManualFormChange}
                required
              />

              <Input
                label="Venue (Optional)"
                name="venue"
                placeholder="e.g., Lab 101, Room 202"
                value={manualForm.venue}
                onChange={handleManualFormChange}
              />

              <Input
                label="Specializations (comma-separated)"
                name="specializations"
                placeholder="e.g., AI/ML, Web Dev, Cloud Computing"
                value={manualForm.specializations}
                onChange={handleManualFormChange}
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Panel Type"
                  name="type"
                  value={manualForm.type}
                  onChange={handleManualFormChange}
                  options={[
                    { value: 'regular', label: 'Regular' },
                    { value: 'temporary', label: 'Temporary' }
                  ]}
                />

                <Input
                  label="Number of Panels"
                  name="panelCount"
                  type="number"
                  min="1"
                  value={manualForm.panelCount}
                  onChange={handleManualFormChange}
                  required
                />
              </div>

              <Input
                label="Faculty Members per Panel"
                name="membersPerPanel"
                type="number"
                min="1"
                value={manualForm.membersPerPanel}
                onChange={handleManualFormChange}
                required
              />

              <Button
                onClick={handleAddManualPanel}
                variant="primary"
                className="w-full"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Panel Template
              </Button>
            </div>

            {/* Added Templates */}
            {manualPanelsToCreate.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <h4 className="font-semibold text-gray-900 mb-4">Panel Templates to Create</h4>
                <div className="space-y-3 mb-6">
                  {manualPanelsToCreate.map(panel => (
                    <Card key={panel.id} className="bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{panel.panelName}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="info">{panel.panelCount} panels</Badge>
                            <Badge variant="info">{panel.membersPerPanel} members each</Badge>
                            <Badge variant="secondary">{panel.requiredFaculty} total faculty</Badge>
                            {panel.venue && <Badge variant="secondary">{panel.venue}</Badge>}
                            <Badge variant="secondary">{panel.type}</Badge>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleRemoveManualPanel(panel.id)}
                          variant="secondary"
                          size="sm"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-blue-600 font-medium">TOTAL PANELS</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {manualPanelsToCreate.reduce((sum, p) => sum + p.panelCount, 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-medium">FACULTY REQUIRED</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {manualPanelsToCreate.reduce((sum, p) => sum + p.requiredFaculty, 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-medium">AVAILABLE</p>
                      <p className={`text-2xl font-bold ${manualPanelsToCreate.reduce((sum, p) => sum + p.requiredFaculty, 0) <= availableFaculty.length ? 'text-green-900' : 'text-red-900'}`}>
                        {availableFaculty.length}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSubmitManualPanels}
                  variant="success"
                  size="lg"
                  loading={isSubmittingManual}
                  disabled={isSubmittingManual}
                  className="w-full"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Create {manualPanelsToCreate.reduce((sum, p) => sum + p.panelCount, 0)} Panels
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Auto Creation Mode */}
      {activeMode === 'auto' && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Auto Panel Creation</h3>
              <Button
                onClick={() => {
                  setActiveMode(null);
                  setAutoSummary(null);
                }}
                variant="secondary"
                size="sm"
              >
                Back to Options
              </Button>
            </div>

            {!autoSummary ? (
              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-900">
                    <strong>How it works:</strong> Enter the number of panels needed and faculty members per panel. 
                    The system will automatically distribute {availableFaculty.length} available faculty equally across panels, 
                    ensuring no faculty member appears in multiple panels.
                  </p>
                </div>

                <Input
                  label="Total Number of Panels to Create"
                  name="totalPanelCount"
                  type="number"
                  min="1"
                  value={autoForm.totalPanelCount}
                  onChange={handleAutoFormChange}
                  required
                />

                <Input
                  label="Faculty Members per Panel"
                  name="membersPerPanel"
                  type="number"
                  min="1"
                  value={autoForm.membersPerPanel}
                  onChange={handleAutoFormChange}
                  required
                />

                <Input
                  label="Specializations (comma-separated, optional)"
                  name="specializations"
                  placeholder="e.g., AI/ML, Web Dev, Cloud Computing"
                  value={autoForm.specializations}
                  onChange={handleAutoFormChange}
                />

                <Select
                  label="Panel Type"
                  name="type"
                  value={autoForm.type}
                  onChange={handleAutoFormChange}
                  options={[
                    { value: 'regular', label: 'Regular' },
                    { value: 'temporary', label: 'Temporary' }
                  ]}
                />

                <Button
                  onClick={handlePreviewAutoCreation}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  Preview Auto-Creation
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-900">Auto-Creation Summary</h4>
                      <p className="text-sm text-green-700 mt-1">
                        {autoSummary.totalPanels} panels × {autoSummary.membersPerPanel} faculty = {autoSummary.totalFacultyRequired} faculty required
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium">PANELS TO CREATE</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{autoSummary.totalPanels}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium">FACULTY REQUIRED</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{autoSummary.totalFacultyRequired}</p>
                  </div>
                </div>

                {autoSummary.specializations.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Specializations</p>
                    <div className="flex flex-wrap gap-2">
                      {autoSummary.specializations.map((spec, idx) => (
                        <Badge key={idx} variant="info">{spec}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={handleCreateAutoPanels}
                    variant="success"
                    size="lg"
                    loading={isCreatingAuto}
                    disabled={isCreatingAuto}
                    className="w-full"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Confirm & Create {autoSummary.totalPanels} Panels
                  </Button>
                  <Button
                    onClick={() => setAutoSummary(null)}
                    variant="secondary"
                    className="w-full"
                  >
                    Back to Form
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Created Panels Display */}
      {createdPanels.length > 0 && (
        <Card className="bg-green-50 border border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
            <h4 className="text-lg font-semibold text-green-900">
              {createdPanels.length} Panel{createdPanels.length !== 1 ? 's' : ''} Created Successfully
            </h4>
          </div>
          <div className="space-y-3">
            {createdPanels.slice(0, 5).map((panel, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3">
                <div>
                  <p className="font-medium text-gray-900">{panel.panelName}</p>
                  <p className="text-xs text-gray-600">{panel.members.length} members</p>
                </div>
                <Badge variant="success">Created</Badge>
              </div>
            ))}
            {createdPanels.length > 5 && (
              <p className="text-sm text-green-700 text-center py-2">
                ... and {createdPanels.length - 5} more panels
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default PanelCreation;
