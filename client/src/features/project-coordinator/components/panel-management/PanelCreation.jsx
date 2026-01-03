// src/features/project-coordinator/components/panel-management/PanelCreation.jsx
import React, { useState, useCallback } from 'react';
import renderEmp from "./renderEmpId_Panel";
import {
  SparklesIcon,
  DocumentPlusIcon,
  CheckCircleIcon,
  TrashIcon,
  PlusIcon,
  CloudArrowUpIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import AcademicFilterSelector from '../shared/AcademicFilterSelector';
import Card from '../../../../shared/components/Card';
import Button from '../../../../shared/components/Button';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';
import { useToast } from '../../../../shared/hooks/useToast';
import {
  downloadPanelTemplate,
  validatePanelFile,
  parsePanelExcel
} from '../../utils/panelUtils';

const PanelCreation = () => {
  const [filters, setFilters] = useState(null);
  const [activeMode, setActiveMode] = useState(null); // 'manual', 'auto', or 'upload'
  const [createdPanels, setCreatedPanels] = useState([]);
  const { showToast } = useToast();
  const { user } = useAuth();

  // Manual mode state
  const [manualForm, setManualForm] = useState({
    panelName: '',
    facultyEmployeeIds: []
  });
  const [currentFacultyId, setCurrentFacultyId] = useState('');
  const [manualError, setManualError] = useState(null);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Auto mode state
  const [autoForm, setAutoForm] = useState({
    totalPanels: 1,
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
    setManualForm({
      panelName: '',
      facultyEmployeeIds: []
    });
    setCurrentFacultyId('');
    setManualError(null);
    setAutoForm({
      totalPanels: 1,
      specializations: '',
      panelType: 'regular'
    });
  }, []);

  // ==================== MANUAL MODE ====================
  const handleAddFacultyToPanel = () => {
    setManualError(null);

    if (!currentFacultyId.trim()) {
      setManualError('Faculty employee ID is required');
      return;
    }

    if (manualForm.facultyEmployeeIds.includes(currentFacultyId)) {
      setManualError('Faculty already added to this panel');
      return;
    }

    setManualForm(prev => ({
      ...prev,
      facultyEmployeeIds: [...prev.facultyEmployeeIds, currentFacultyId]
    }));
    setCurrentFacultyId('');
    showToast('Faculty added to panel', 'success');
  };

  const handleRemoveFacultyFromPanel = (empId) => {
    setManualForm(prev => ({
      ...prev,
      facultyEmployeeIds: prev.facultyEmployeeIds.filter(id => id !== empId)
    }));
    showToast('Faculty removed from panel', 'info');
  };

  const handleCreateManualPanel = async () => {
    setManualError(null);

    if (manualForm.facultyEmployeeIds.length === 0) {
      setManualError('At least one faculty member is required');
      return;
    }

    try {
      setIsSubmittingManual(true);

      const newPanel = {
        id: Date.now(),
        panelName: manualForm.panelName || `Panel ${createdPanels.length + 1}`,
        facultyEmployeeIds: manualForm.facultyEmployeeIds,
        school: filters.school,
        department: filters.programme,
        academicYear: filters.year,
        semester: filters.semester,
        type: 'regular' 
      };

      setCreatedPanels(prev => [...prev, newPanel]);

      // Reset form
      setManualForm({
        panelName: '',
        facultyEmployeeIds: []
      });
      setCurrentFacultyId('');

      showToast('Panel created successfully', 'success');
    } catch (error) {
      console.error('Error creating panel:', error);
      showToast('Failed to create panel', 'error');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // ==================== AUTO MODE ====================
  const handleAutoFormChange = (value,name) => {
    // const { name, value } = e.target;
    let finalValue = value;

    if (name === 'totalPanels') {
      finalValue = value === '' ? '' : Math.max(1, parseInt(value) || 0);
    }

    setAutoForm(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleCreateAutoPanels = async () => {
    const count = parseInt(autoForm.totalPanels, 10);
    if (isNaN(count) || count < 1) {
      showToast('Please enter a valid number of panels (at least 1)', 'error');
      return;
    }

    try {
      setIsCreatingAuto(true);

      // Simulate backend processing
      await new Promise(resolve => setTimeout(resolve, 800));

      const specializations = autoForm.specializations
        ? autoForm.specializations.split(',').map(s => s.trim()).filter(s => s)
        : [];

      const newPanels = [];
      for (let i = 0; i < autoForm.totalPanels; i++) {
        newPanels.push({
          id: Date.now() + i,
          panelName: `Auto Panel ${createdPanels.length + i + 1}`,
          facultyEmployeeIds: [],
          school: filters.school,
          department: filters.programme,
          academicYear: filters.year,
          semester: filters.semester,
          specializations,
          panelType: autoForm.panelType,
          isAutoCreated: true
        });
      }

      setCreatedPanels(prev => [...prev, ...newPanels]);
      showToast(`Created ${newPanels.length} panels successfully`, 'success');
      setAutoForm({
        totalPanels: 1,
        specializations: '',
        panelType: 'regular'
      });
    } catch (error) {
      console.error('Error creating panels:', error);
      showToast('Failed to create panels', 'error');
    } finally {
      setIsCreatingAuto(false);
    }
  };

  // ==================== UPLOAD MODE ====================
  const handleDownloadTemplate = useCallback(() => {
    try {
      downloadPanelTemplate();
      showToast('Template downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading template:', error);
      showToast('Failed to download template', 'error');
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
              <p className="text-sm text-gray-600 mt-2">Add faculty members one by one</p>
            </div>
          </Card>

          {/* Excel Upload */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setActiveMode('excel')}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ArrowUpTrayIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Excel Upload</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload faculty details via Excel file. Download template, fill in faculty data, and upload.
                </p>
                <Button size="sm" variant="secondary">
                  <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                  Upload Excel
                </Button>
              </div>
            </div>
          </Card>

          {/* Auto Creation */}
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-300"
            onClick={() => setActiveMode('auto')}
          >
            <div className="text-center py-8">
              <SparklesIcon className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">Auto Create</h3>
              <p className="text-sm text-gray-600 mt-2">Automatically create multiple panels</p>
            </div>
          </Card>

          {/* Excel Upload */}
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-300"
            onClick={() => setActiveMode('upload')}
          >
            <div className="text-center py-8">
              <CloudArrowUpIcon className="w-12 h-12 text-purple-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">Upload Excel</h3>
              <p className="text-sm text-gray-600 mt-2">Bulk upload panels from Excel file</p>
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

          <div className="space-y-4">
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
                Faculty Employee ID
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter faculty employee ID"
                  value={currentFacultyId}
                  onChange={(e) => setCurrentFacultyId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddFacultyToPanel()}
                />
                <Button onClick={handleAddFacultyToPanel}>Add</Button>
              </div>
            </div>

            {manualError && (
              <p className="text-sm text-red-600">{manualError}</p>
            )}

            {/* Added Faculty List */}
            {manualForm.facultyEmployeeIds.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Panel Members ({manualForm.facultyEmployeeIds.length})
                </label>
                <div className="space-y-2">
                  {manualForm.facultyEmployeeIds.map(empId => (
                    <div key={empId} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="font-medium text-gray-900">{empId}</span>
                      <button
                        onClick={() => handleRemoveFacultyFromPanel(empId)}
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
              disabled={manualForm.facultyEmployeeIds.length === 0 || isSubmittingManual}
              className="w-full"
            >
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              {isSubmittingManual ? 'Creating...' : 'Create Panel'}
            </Button>
          </div>
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

          <div className="space-y-4">
            <Input
              label="Number of Panels"
              type="number"
              min="1"
              value={autoForm.totalPanels}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setAutoForm(prev => ({ ...prev, totalPanels: '' }));
                  return;
                }
                const num = parseInt(val, 10);
                if (!isNaN(num) && num >= 1) {
                  setAutoForm(prev => ({ ...prev, totalPanels: num }));
                }
              }}
              name="totalPanels"
            />

            <Input
              label="Specializations (comma-separated)"
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

            <Button
              onClick={handleCreateAutoPanels}
              disabled={isCreatingAuto}
              className="w-full"
            >
              <SparklesIcon className="w-5 h-5 mr-2" />
              {isCreatingAuto ? 'Creating...' : 'Create Panels'}
            </Button>
          </div>
        </Card>
      )}

      {/* UPLOAD MODE */}
      {filters && activeMode === 'upload' && (
        <>
          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <DocumentArrowDownIcon className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-2">Upload Instructions</h3>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>Download the template Excel file below</li>
                  <li>Fill in faculty employee IDs for each panel</li>
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
                  onClick={handleDownloadTemplate}
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
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100
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
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
                    <tr key={panel.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {panel.panelName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {/* {panel.facultyEmployeeIds?.length || 0} members */}
                        {renderEmp(panel.facultyEmployeeIds)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {panel.panelType || 'regular'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        <button
                          onClick={() => handleRemovePanel(panel.id)}
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
