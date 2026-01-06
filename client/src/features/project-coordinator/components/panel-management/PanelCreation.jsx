import React, { useState, useCallback } from 'react';
import renderEmp from "./renderEmpId_Panel";
import {
  SparklesIcon,
  DocumentPlusIcon,
  CheckCircleIcon,
  TrashIcon,
  PlusIcon,
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  ArrowUpTrayIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import AcademicFilterSelector from '../shared/AcademicFilterSelector';
import Card from '../../../../shared/components/Card';
import Button from '../../../../shared/components/Button';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';
import { useToast } from '../../../../shared/hooks/useToast';
import { useAuth } from '../../../../shared/hooks/useAuth';
import {
  downloadPanelTemplate,
  downloadFacultyTemplate,
  validatePanelFile,
  parseFacultyListExcel,
  parsePanelExcel
} from '../../utils/panelUtils';

const PanelCreation = () => {
  const [filters, setFilters] = useState(null);
  const [activeMode, setActiveMode] = useState(null); // 'manual', 'auto', or 'upload'
  const [createdPanels, setCreatedPanels] = useState([]);
  const { showToast } = useToast();
  const { user } = useAuth();

  // Faculty List from Excel (shared between manual and auto)
  const [facultyListFile, setFacultyListFile] = useState(null);
  const [facultyListError, setFacultyListError] = useState(null);
  const [facultyList, setFacultyList] = useState([]);
  const [loadingFacultyList, setLoadingFacultyList] = useState(false);

  // Manual mode state
  const [manualForm, setManualForm] = useState({
    panelName: '',
    selectedFaculties: []
  });
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Auto mode state
  const [autoForm, setAutoForm] = useState({
    panelSize: 3,
    specializations: '',
    panelType: 'regular'
  });
  const [isCreatingAuto, setIsCreatingAuto] = useState(false);

  // Upload mode state
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters(selectedFilters);
    setActiveMode(null);
    setCreatedPanels([]);
    setFacultyListFile(null);
    setFacultyListError(null);
    setFacultyList([]);
    setManualForm({
      panelName: '',
      selectedFaculties: []
    });
    setAutoForm({
      panelSize: 3,
      specializations: '',
      panelType: 'regular'
    });
    setSelectedFile(null);
    setFileError(null);
  }, []);

  // ==================== FACULTY LIST UPLOAD ====================
  const handleFacultyListFileSelect = useCallback((event) => {
    const file = event.target.files?.[0];
    setFacultyListError(null);

    if (!file) {
      setFacultyListFile(null);
      return;
    }

    const validation = validatePanelFile(file);
    if (!validation.isValid) {
      setFacultyListError(validation.errors.join(', '));
      setFacultyListFile(null);
      return;
    }

    setFacultyListFile(file);
  }, []);

  const handleFacultyListUpload = useCallback(async () => {
    if (!facultyListFile) {
      showToast('Please select a file with faculty employee IDs', 'error');
      return;
    }

    try {
      setLoadingFacultyList(true);
      const empIds = await parseFacultyListExcel(facultyListFile);

      if (empIds.length === 0) {
        setFacultyListError('No valid faculty employee IDs found in file');
        return;
      }

      // Fetch faculty details
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3000/api/project-coordinator/faculty/details-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ employeeIds: empIds })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch faculty details');
      }

      const result = await response.json();
      const foundFaculties = result.data;

      // Identify missing faculties
      const foundIds = foundFaculties.map(f => f.employeeId);
      const missingIds = empIds.filter(id => !foundIds.includes(id));

      if (missingIds.length > 0) {
        showToast(`Warning: ${missingIds.length} faculty IDs not found: ${missingIds.join(', ')}`, 'warning');
      }

      setFacultyList(foundFaculties); // Store full objects now
      setFacultyListFile(null);
      if (document.getElementById('faculty-list-input')) {
        document.getElementById('faculty-list-input').value = '';
      }
      showToast(`Loaded ${foundFaculties.length} faculty members`, 'success');
    } catch (error) {
      console.error('Error loading faculty list:', error);
      setFacultyListError(error.message || 'Failed to load faculty list');
      showToast('Failed to load faculty list', 'error');
    } finally {
      setLoadingFacultyList(false);
    }
  }, [facultyListFile, showToast]);

  // ==================== MANUAL MODE ====================
  const handleAddFacultyToSelection = (empId) => {
    if (manualForm.selectedFaculties.includes(empId)) {
      showToast('Faculty already selected', 'info');
      return;
    }
    setManualForm(prev => ({
      ...prev,
      selectedFaculties: [...prev.selectedFaculties, empId]
    }));
  };

  const handleRemoveFacultyFromSelection = (empId) => {
    setManualForm(prev => ({
      ...prev,
      selectedFaculties: prev.selectedFaculties.filter(id => id !== empId)
    }));
  };

  const handleCreateManualPanel = async () => {
    if (manualForm.selectedFaculties.length === 0) {
      showToast('Please select at least one faculty member', 'error');
      return;
    }

    try {
      setIsSubmittingManual(true);

      const payload = {
        memberEmployeeIds: manualForm.selectedFaculties,
        panelName: manualForm.panelName || `Panel ${createdPanels.length + 1}`,
        school: filters.school,
        department: filters.programme,
        academicYear: filters.year,
        semester: filters.semester,
        panelType: 'regular'
      };

      const response = await fetch('/api/admin/panels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create panel');
      }

      const result = await response.json();
      setCreatedPanels(prev => [...prev, result.data]);

      setManualForm({
        panelName: '',
        selectedFaculties: []
      });

      showToast('Panel created successfully', 'success');
    } catch (error) {
      console.error('Error creating panel:', error);
      showToast(error.message || 'Failed to create panel', 'error');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // ==================== AUTO MODE ====================
  const handleCreateAutoPanels = async () => {
    if (facultyList.length === 0) {
      showToast('Please upload faculty list first', 'error');
      return;
    }

    try {
      setIsCreatingAuto(true);

      const payload = {
        departments: [filters.programme],
        school: filters.school,
        academicYear: filters.year,
        panelSize: autoForm.panelSize,
        panelSize: autoForm.panelSize,
        facultyList: facultyList.map(f => f.employeeId)
      };

      const response = await fetch('/api/admin/panels/auto-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create panels');
      }

      const result = await response.json();

      // Add created panels to list
      if (result.data && Array.isArray(result.data.panels)) {
        setCreatedPanels(prev => [...prev, ...result.data.panels]);
      }

      setAutoForm({
        panelSize: 3,
        specializations: '',
        panelType: 'regular'
      });

      showToast(result.message || 'Panels created successfully', 'success');
    } catch (error) {
      console.error('Error creating panels:', error);
      showToast(error.message || 'Failed to create panels', 'error');
    } finally {
      setIsCreatingAuto(false);
    }
  };

  // ==================== UPLOAD MODE ====================
  const handleDownloadPanelTemplate = useCallback(() => {
    try {
      downloadPanelTemplate();
      showToast('Panel template downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading template:', error);
      showToast('Failed to download panel template', 'error');
    }
  }, [showToast]);

  const handleDownloadFacultyTemplate = useCallback(() => {
    try {
      downloadFacultyTemplate();
      showToast('Faculty template downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading faculty template:', error);
      showToast('Failed to download faculty template', 'error');
    }
  }, [showToast]);

  const handleFileSelect = useCallback((event) => {
    const file = event.target.files?.[0];
    setFileError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validation = validatePanelFile(file);
    if (!validation.isValid) {
      setFileError(validation.errors.join(', '));
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !filters) {
      showToast('Please select a file and complete academic filters', 'error');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);

      const panelData = await parsePanelExcel(selectedFile);
      setUploadProgress(40);

      const enrichedData = panelData.map(panel => ({
        ...panel,
        school: filters.school,
        department: filters.programme,
        academicYear: filters.year,
        semester: filters.semester
      }));

      setUploadProgress(100);
      setCreatedPanels(prev => [...prev, ...enrichedData]);
      showToast(
        `Successfully uploaded ${enrichedData.length} panels`,
        'success'
      );

      setSelectedFile(null);
      if (document.getElementById('panel-file-input')) {
        document.getElementById('panel-file-input').value = '';
      }
    } catch (error) {
      console.error('Error uploading panels:', error);
      showToast(error.message || 'Failed to upload panels', 'error');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [selectedFile, filters, showToast]);

  const handleRemovePanel = useCallback((id) => {
    setCreatedPanels(prev => prev.filter(p => p.id !== id));
    showToast('Panel removed', 'info');
  }, [showToast]);

  return (
    <div className="space-y-6">
      {/* Academic Filter Selector */}
      <AcademicFilterSelector onFilterComplete={handleFilterComplete} />

      {filters && !activeMode && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Manual Creation */}
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-300"
            onClick={() => setActiveMode('manual')}
          >
            <div className="text-center py-8">
              <DocumentPlusIcon className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">Create Manually</h3>
              <p className="text-sm text-gray-600 mt-2">Select faculties from uploaded list to create panel</p>
            </div>
          </Card>

          {/* Auto Creation */}
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-green-300"
            onClick={() => setActiveMode('auto')}
          >
            <div className="text-center py-8">
              <SparklesIcon className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">Auto Create</h3>
              <p className="text-sm text-gray-600 mt-2">Auto-distribute faculties to panels</p>
            </div>
          </Card>

          {/* Bulk Upload */}
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-300"
            onClick={() => setActiveMode('upload')}
          >
            <div className="text-center py-8">
              <CloudArrowUpIcon className="w-12 h-12 text-purple-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">Bulk Upload</h3>
              <p className="text-sm text-gray-600 mt-2">Upload complete panel data from Excel</p>
            </div>
          </Card>
        </div>
      )}

      {/* MANUAL MODE */}
      {filters && activeMode === 'manual' && (
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Create Panel Manually</h3>
            <Button variant="secondary" onClick={() => setActiveMode(null)}>
              Back
            </Button>
          </div>

          {facultyList.length === 0 ? (
            <div className="space-y-4">
              <Card className="bg-blue-50 border-blue-300">
                <div className="flex items-start gap-3">
                  <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Upload Faculty List</h4>
                    <p className="text-sm text-blue-700 mb-4">
                      Upload an Excel file with a single column containing faculty employee IDs (employeeId)
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleDownloadFacultyTemplate}
                      className="bg-white text-blue-700 hover:bg-blue-100"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                      Download Faculty Template
                    </Button>
                  </div>
                </div>
              </Card>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Excel File (employeeId Column)
                </label>
                <input
                  id="faculty-list-input"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFacultyListFileSelect}
                  disabled={loadingFacultyList}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {facultyListError && <p className="mt-2 text-sm text-red-600">{facultyListError}</p>}
                {facultyListFile && !facultyListError && (
                  <p className="mt-2 text-sm text-green-600 flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    {facultyListFile.name}
                  </p>
                )}
              </div>

              <Button
                onClick={handleFacultyListUpload}
                disabled={!facultyListFile || loadingFacultyList}
                className="w-full"
              >
                <CloudArrowUpIcon className="w-5 h-5 mr-2" />
                {loadingFacultyList ? 'Loading...' : 'Load Faculty List'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-300 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-900">Faculty list loaded</p>
                  <p className="text-xs text-green-700">{facultyList.length} faculty members available</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setFacultyList([]);
                    setFacultyListFile(null);
                    setFacultyListError(null);
                  }}
                >
                  Clear
                </Button>
              </div>

              <Input
                label="Panel Name (Optional)"
                placeholder="Enter panel name"
                value={manualForm.panelName}
                onChange={(e) =>
                  setManualForm(prev => ({ ...prev, panelName: e.target.value }))
                }
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Faculty Members
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-300 rounded-lg bg-gray-50">
                  {facultyList.map(faculty => (
                    <button
                      key={faculty.employeeId}
                      onClick={() => handleAddFacultyToSelection(faculty.employeeId)}
                      className="p-2 text-left text-sm rounded-lg border border-gray-300 bg-white hover:bg-purple-50 hover:border-purple-300 transition"
                    >
                      <div className="font-medium text-purple-900">{faculty.name}</div>
                      <div className="text-xs text-gray-500 font-mono mb-1">{faculty.employeeId}</div>

                      <div className="text-xs text-gray-600 border-t border-purple-100 pt-1 mt-1">
                        <div className="truncate" title={faculty.school}>{faculty.school}</div>
                        <div className="truncate text-gray-500" title={faculty.department}>{faculty.department}</div>
                        {faculty.specialization && (
                          <div className="truncate text-purple-600 mt-0.5" title={faculty.specialization}>
                            {faculty.specialization}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Faculty List */}
              {manualForm.selectedFaculties.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selected Members ({manualForm.selectedFaculties.length})
                  </label>
                  <div className="space-y-2">
                    {manualForm.selectedFaculties.map(empId => (
                      <div key={empId} className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <span className="font-medium text-gray-900">{empId}</span>
                        <button
                          onClick={() => handleRemoveFacultyFromSelection(empId)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleCreateManualPanel}
                disabled={manualForm.selectedFaculties.length === 0 || isSubmittingManual}
                className="w-full"
              >
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                {isSubmittingManual ? 'Creating...' : 'Create Panel'}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* AUTO MODE */}
      {filters && activeMode === 'auto' && (
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Auto Create Panels</h3>
            <Button variant="secondary" onClick={() => setActiveMode(null)}>
              Back
            </Button>
          </div>

          {facultyList.length === 0 ? (
            <div className="space-y-4">
              <Card className="bg-green-50 border-green-300">
                <div className="flex items-start gap-3">
                  <InformationCircleIcon className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-green-900 mb-2">Upload Faculty List</h4>
                    <p className="text-sm text-green-700 mb-4">
                      Upload an Excel file with a single column of faculty employee IDs (employeeId). The system will auto-distribute them to panels based on panel size.
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleDownloadFacultyTemplate}
                      className="bg-white text-green-700 hover:bg-green-100"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                      Download Faculty Template
                    </Button>
                  </div>
                </div>
              </Card>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Excel File (employeeId Column)
                </label>
                <input
                  id="faculty-list-auto-input"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFacultyListFileSelect}
                  disabled={loadingFacultyList}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-green-50 file:text-green-700
                    hover:file:bg-green-100
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {facultyListError && <p className="mt-2 text-sm text-red-600">{facultyListError}</p>}
                {facultyListFile && !facultyListError && (
                  <p className="mt-2 text-sm text-green-600 flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    {facultyListFile.name}
                  </p>
                )}
              </div>

              <Button
                onClick={handleFacultyListUpload}
                disabled={!facultyListFile || loadingFacultyList}
                className="w-full"
              >
                <CloudArrowUpIcon className="w-5 h-5 mr-2" />
                {loadingFacultyList ? 'Loading...' : 'Load Faculty List'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-300 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-900">Faculty list loaded</p>
                  <p className="text-xs text-green-700">{facultyList.length} faculty members will be distributed</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setFacultyList([]);
                    setFacultyListFile(null);
                    setFacultyListError(null);
                  }}
                >
                  Clear
                </Button>
              </div>

              <Input
                label="Panel Size (members per panel)"
                type="number"
                min="1"
                max="10"
                value={autoForm.panelSize}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setAutoForm(prev => ({ ...prev, panelSize: '' }));
                    return;
                  }
                  const num = parseInt(val, 10);
                  if (!isNaN(num) && num >= 1 && num <= 10) {
                    setAutoForm(prev => ({ ...prev, panelSize: num }));
                  }
                }}
                name="panelSize"
              />

              <Input
                label="Specializations (comma-separated, optional)"
                placeholder="e.g., AI/ML, Web Dev, Cloud"
                value={autoForm.specializations}
                onChange={(e) =>
                  setAutoForm(prev => ({ ...prev, specializations: e.target.value }))
                }
              />

              <Select
                label="Panel Type"
                value={autoForm.panelType}
                onChange={(value) =>
                  setAutoForm(prev => ({ ...prev, panelType: value }))
                }
                options={[
                  { value: 'regular', label: 'Regular' },
                  { value: 'temporary', label: 'Temporary' }
                ]}
              />

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <span className="font-medium">Preview:</span> {facultyList.length} faculties will create {Math.ceil(facultyList.length / autoForm.panelSize)} panels
                </p>
              </div>

              <Button
                onClick={handleCreateAutoPanels}
                disabled={isCreatingAuto || facultyList.length === 0}
                className="w-full"
              >
                <SparklesIcon className="w-5 h-5 mr-2" />
                {isCreatingAuto ? 'Creating...' : 'Create Panels'}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* BULK UPLOAD MODE */}
      {filters && activeMode === 'upload' && (
        <>
          <Card className="bg-purple-50 border-purple-200">
            <div className="flex items-start space-x-3">
              <DocumentArrowDownIcon className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-purple-900 mb-2">Bulk Upload Instructions</h3>
                <ul className="text-sm text-purple-700 space-y-1 list-disc list-inside">
                  <li>Download the template Excel file below</li>
                  <li>Fill in faculty employee IDs for each panel (comma-separated in one column)</li>
                  <li>School and Department will be auto-filled</li>
                  <li>Upload the completed file</li>
                  <li>Maximum file size: 5MB</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Step 1: Download Template</h3>
                <Button
                  onClick={handleDownloadPanelTemplate}
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                  Download Panel Template
                </Button>
              </div>

              <div className="border-t border-gray-200"></div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Step 2: Upload Completed File</h3>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="panel-file-input"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Select Excel File
                    </label>
                    <input
                      id="panel-file-input"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      disabled={uploading}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-medium
                        file:bg-purple-50 file:text-purple-700
                        hover:file:bg-purple-100
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {fileError && <p className="mt-2 text-sm text-red-600">{fileError}</p>}
                    {selectedFile && !fileError && (
                      <p className="mt-2 text-sm text-green-600 flex items-center">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                  </div>

                  {uploadProgress > 0 && (
                    <div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 text-center">{uploadProgress}%</p>
                    </div>
                  )}

                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="w-full sm:w-auto"
                  >
                    <CloudArrowUpIcon className="w-5 h-5 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload Panel Data'}
                  </Button>

                  <Button
                    onClick={() => setActiveMode(null)}
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    Back
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* CREATED PANELS LIST */}
      {createdPanels.length > 0 && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Created Panels</h3>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {createdPanels.length} Panels
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Panel Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Faculty Members
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {createdPanels.map((panel) => (
                    <tr key={panel._id || panel.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {panel.panelName || `Panel ${panel._id}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {renderEmp(panel.memberEmployeeIds || panel.facultyEmployeeIds)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {panel.panelType || 'regular'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        <button
                          onClick={() => handleRemovePanel(panel._id || panel.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PanelCreation;
