// src/features/project-coordinator/components/project-management/ProjectCreation.jsx
import React, { useState, useCallback } from 'react';
import renderTeamMembers from './rendertableExcelUpload';
import {
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import AcademicFilterSelector from '../shared/AcademicFilterSelector';
import TeamMembersSelector from './TeamMembersSelector';
import Card from '../../../../shared/components/Card';
import Button from '../../../../shared/components/Button';
import Input from '../../../../shared/components/Input';
import { useToast } from '../../../../shared/hooks/useToast';
import {
  downloadProjectTemplate,
  validateProjectFile,
  parseProjectExcel
} from '../../utils/projectUtils';

const ProjectCreation = () => {
  const [filters, setFilters] = useState(null);
  const [activeMode, setActiveMode] = useState(null); // 'upload' or 'manual'
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedProjects, setUploadedProjects] = useState([]);

  // Manual form state
  const [manualForm, setManualForm] = useState({
    projectTitle: '',
    guideEmployeeID: '',
    teamMembers: []
  });
  const [manualError, setManualError] = useState(null);
  const [manualProjects, setManualProjects] = useState([]);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [existingStudents] = useState([]); // Would be fetched from student management

  const { showToast } = useToast();

  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters(selectedFilters);
    setActiveMode(null);
    setSelectedFile(null);
    setFileError(null);
    setUploadedProjects([]);
    setManualForm({
      projectTitle: '',
      guideEmployeeID: '',
      teamMembers: []
    });
    setManualError(null);
    setManualProjects([]);
  }, []);

  const handleDownloadTemplate = useCallback(() => {
    try {
      downloadProjectTemplate();
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

    const validation = validateProjectFile(file);
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

      // Parse Excel file
      const projectData = await parseProjectExcel(selectedFile);
      setUploadProgress(40);

      // Add academic context from filters
      const enrichedData = projectData.map(project => ({
        ...project,
        school: filters.school,
        programme: filters.programme,
        academicYear: filters.year,
        semester: filters.semester
      }));

      setUploadProgress(100);
      setUploadedProjects(enrichedData);
      showToast(
        `Successfully uploaded ${enrichedData.length} projects`,
        'success'
      );

      setSelectedFile(null);
      if (document.getElementById('project-file-input')) {
        document.getElementById('project-file-input').value = '';
      }
    } catch (error) {
      console.error('Error uploading projects:', error);
      showToast(error.message || 'Failed to upload projects', 'error');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [selectedFile, filters, showToast]);

  const handleManualFormChange = (field, value) => {
    setManualForm(prev => ({
      ...prev,
      [field]: value
    }));
    setManualError(null);
  };

  const validateManualForm = () => {
    if (!manualForm.projectTitle.trim()) {
      setManualError('Project title is required');
      return false;
    }
    if (!manualForm.guideEmployeeID.trim()) {
      setManualError('Guide employee ID is required');
      return false;
    }
    if (!Array.isArray(manualForm.teamMembers) || manualForm.teamMembers.length === 0) {
      setManualError('At least one team member is required');
      return false;
    }

    return true;
  };

  const handleAddProject = useCallback(async () => {
    if (!validateManualForm() || !filters) {
      if (!filters) {
        setManualError('Please complete academic filters first');
      }
      return;
    }

    try {
      setIsSubmittingManual(true);

      const newProject = {
        projectTitle: manualForm.projectTitle,
        guideEmployeeID: manualForm.guideEmployeeID,
        teamMembers: manualForm.teamMembers,
        school: filters.school,
        programme: filters.programme,
        academicYear: filters.year,
        semester: filters.semester
      };

      setManualProjects(prev => [...prev, newProject]);

      // Reset form
      setManualForm({
        projectTitle: '',
        guideEmployeeID: '',
        teamMembers: []
      });
      setManualError(null);

      showToast('Project added successfully', 'success');
    } catch (error) {
      console.error('Error adding project:', error);
      showToast('Failed to add project', 'error');
    } finally {
      setIsSubmittingManual(false);
    }
  }, [manualForm, filters, showToast]);

  const handleRemoveProject = useCallback((index, source) => {
    if (source === 'manual') {
      setManualProjects(prev => prev.filter((_, i) => i !== index));
    } else {
      setUploadedProjects(prev => prev.filter((_, i) => i !== index));
    }
    showToast('Project removed', 'info');
  }, [showToast]);

  return (
    <div className="space-y-6">
      {/* Academic Filter Selector */}
      <AcademicFilterSelector onFilterComplete={handleFilterComplete} />

      {filters && !activeMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Excel Option */}
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-300"
            onClick={() => setActiveMode('upload')}
          >
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Excel</h3>
              <p className="text-gray-600 mb-6">Bulk upload projects using an Excel file</p>
              <Button variant="primary">Upload Projects</Button>
            </div>
          </Card>

          {/* Manual Creation Option */}
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-300"
            onClick={() => setActiveMode('manual')}
          >
            <div className="text-center py-12">
              <div className="text-5xl mb-4">✏️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Manually</h3>
              <p className="text-gray-600 mb-6">Add projects one by one using a form</p>
              <Button variant="primary">Add Project</Button>
            </div>
          </Card>
        </div>
      )}

      {filters && activeMode === 'upload' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upload Projects via Excel</h3>
            <Button
              variant="secondary"
              onClick={() => {
                setActiveMode(null);
                setSelectedFile(null);
                setFileError(null);
                setUploadProgress(0);
              }}
            >
              Back
            </Button>
          </div>

          {/* Upload Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="shrink-0">
                <DocumentArrowDownIcon className="w-5 h-5 text-blue-600 mt-0.5" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-2">
                  Upload Instructions
                </h3>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>Download the template Excel file below</li>
                  <li>Fill in project details (Title, Guide Employee ID, Team Members)</li>
                  <li>School, Programme, Academic Year, and Semester will be auto-filled</li>
                  <li>Upload the completed file</li>
                  <li>Maximum file size: 5MB</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Academic Info Display */}
          {/* <Card className="bg-gray-50">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-600 font-semibold">School</p>
                <p className="text-sm text-gray-900 font-medium">{filters.school}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-semibold">Programme</p>
                <p className="text-sm text-gray-900 font-medium">{filters.programme}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-semibold">Academic Year</p>
                <p className="text-sm text-gray-900 font-medium">{filters.year.replace('-', `-${parseInt(filters.year)+1}`)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-semibold">Semester</p>
                <p className="text-sm text-gray-900 font-medium">{filters.semester}</p>
              </div>
            </div>
          </Card> */}

          {/* Upload Card */}
          <Card>
            <div className="space-y-6">
              {/* Template Download */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Step 1: Download Template
                </h3>
                <Button
                  onClick={handleDownloadTemplate}
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                  Download Project Template
                </Button>
              </div>

              <div className="border-t border-gray-200"></div>

              {/* File Upload */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Step 2: Upload Completed File
                </h3>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="project-file-input"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Select Excel File
                    </label>
                    <input
                      id="project-file-input"
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
                    {fileError && (
                      <p className="mt-2 text-sm text-red-600">{fileError}</p>
                    )}
                    {selectedFile && !fileError && (
                      <p className="mt-2 text-sm text-green-600 flex items-center">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                  </div>

                  {/* Upload Progress */}
                  {uploadProgress > 0 && (
                    <div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 text-center">
                        {uploadProgress}%
                      </p>
                    </div>
                  )}

                  {/* Upload Button */}
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="w-full sm:w-auto"
                  >
                    <CloudArrowUpIcon className="w-5 h-5 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload Project Data'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Uploaded Projects List */}
          {uploadedProjects.length > 0 && (
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Uploaded Projects</h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {uploadedProjects.length} Projects
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project Title
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Guide Employee ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Team Members
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {uploadedProjects.map((project, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {project.projectTitle}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {project.guideEmployeeID}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {renderTeamMembers(project.teamMembers)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                            <button
                              onClick={() => handleRemoveProject(index, 'upload')}
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
      )}

      {filters && activeMode === 'manual' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Add Projects Manually</h3>
            <Button
              variant="secondary"
              onClick={() => {
                setActiveMode(null);
                setManualForm({
                  projectTitle: '',
                  guideEmployeeID: '',
                  teamMembers: []
                });
                setManualError(null);
              }}
            >
              Back
            </Button>
          </div>

          {/* Academic Info Display */}
          {/* <Card className="bg-gray-50">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-600 font-semibold">School</p>
                <p className="text-sm text-gray-900 font-medium">{filters.school}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-semibold">Programme</p>
                <p className="text-sm text-gray-900 font-medium">{filters.programme}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-semibold">Academic Year</p>
                <p className="text-sm text-gray-900 font-medium">{filters.year.replace('-', `-${parseInt(filters.year)+1}`)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-semibold">Semester</p>
                <p className="text-sm text-gray-900 font-medium">{filters.semester}</p>
              </div>
            </div>
          </Card> */}

          {/* Manual Form */}
          <Card>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Enter Project Details</h3>

              {manualError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{manualError}</p>
                </div>
              )}

              <div className="space-y-4">
                <Input
                  label="Project Title"
                  placeholder="e.g., AI-Based Chatbot System"
                  value={manualForm.projectTitle}
                  onChange={(e) => handleManualFormChange('projectTitle', e.target.value)}
                  disabled={isSubmittingManual}
                />

                <Input
                  label="Guide Employee ID"
                  placeholder="e.g., EMP001"
                  value={manualForm.guideEmployeeID}
                  onChange={(e) =>
                    handleManualFormChange('guideEmployeeID', e.target.value)
                  }
                  disabled={isSubmittingManual}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Members
                  </label>
                  <TeamMembersSelector
                    onTeamMembersChange={(members) =>
                      handleManualFormChange('teamMembers', members)
                    }
                    academicYear={filters.year}
                    school={filters.school}
                    department={filters.programme}
                    existingStudents={existingStudents}
                  />
                </div>
              </div>

              <Button
                onClick={handleAddProject}
                disabled={isSubmittingManual}
                className="mt-4"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                {isSubmittingManual ? 'Adding...' : 'Add Project'}
              </Button>
            </div>
          </Card>

          {/* Added Projects List */}
          {(manualProjects.length > 0 || uploadedProjects.length > 0) && (
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Added Projects</h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {manualProjects.length + uploadedProjects.length} Projects
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project Title
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Guide Employee ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Team Members
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Source
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {manualProjects.map((project, index) => (
                        <tr key={`manual-${index}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {project.projectTitle}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {project.guideEmployeeID}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {renderTeamMembers(project.teamMembers)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              Manual
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                            <button
                              onClick={() => handleRemoveProject(index, 'manual')}
                              className="text-red-600 hover:text-red-800 font-medium"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                      {uploadedProjects.map((project, index) => (
                        <tr key={`upload-${index}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {project.projectTitle}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {project.guideEmployeeID}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {project.teamMembers?.length || 0} members
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              Uploaded
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                            <button
                              onClick={() => handleRemoveProject(index, 'upload')}
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
      )}
    </div>
  );
};

export default ProjectCreation;
