// src/features/admin/components/panel-management/PanelCreationTab.jsx
import React, { useState, useCallback } from 'react';
import { CloudArrowUpIcon, DocumentArrowDownIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import FacultyFilters from '../../../project-coordinator/components/faculty-management/FacultyFilters';
import Card from '../../../../shared/components/Card';
import Button from '../../../../shared/components/Button';
import { useToast } from '../../../../shared/hooks/useToast';
import { downloadFacultyTemplate, validateFacultyFile, parseFacultyExcel } from '../../utils/panelUtils';

const FacultyCreationTab = ({ school = '', programme = '', hideSchoolProgramme = false }) => {
  const [filters, setFilters] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFaculty, setUploadedFaculty] = useState([]);
  const { showToast } = useToast();

  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters(selectedFilters);
    setSelectedFile(null);
    setFileError(null);
    setUploadedFaculty([]);
  }, []);

  const handleDownloadTemplate = useCallback(() => {
    try {
      downloadFacultyTemplate();
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

    const validation = validateFacultyFile(file);
    if (!validation.isValid) {
      setFileError(validation.errors.join(', '));
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !filters) {
      showToast('Please select both academic context and file', 'error');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);

      // Parse Excel file
      const facultyData = await parseFacultyExcel(selectedFile);
      setUploadProgress(40);

      // Simulate backend processing
      await new Promise(resolve => setTimeout(resolve, 500));
      setUploadProgress(100);
      
      // Use parsed data directly
      setUploadedFaculty(facultyData);
      showToast(
        `Successfully uploaded ${facultyData.length} faculty members`,
        'success'
      );

      // Reset file input
      setSelectedFile(null);
      if (document.getElementById('faculty-file-input')) {
        document.getElementById('faculty-file-input').value = '';
      }

    } catch (error) {
      console.error('Error uploading faculty:', error);
      showToast(
        error.response?.data?.message || error.message || 'Failed to upload faculty',
        'error'
      );
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [selectedFile, filters, showToast]);

  const handleRemoveFaculty = useCallback((employeeId) => {
    setUploadedFaculty(prev => prev.filter(f => f.employeeId !== employeeId));
    showToast('Faculty member removed', 'info');
  }, [showToast]);

  return (
    <div className="space-y-6">
      {/* Academic Context Selector */}
      <FacultyFilters 
        onFilterComplete={handleFilterComplete}
        onFilterChange={() => {}}
        school={school}
        programme={programme}
        hideSchoolProgramme={hideSchoolProgramme}
      />

      {/* Faculty Upload Section */}
      {filters && (
        <>
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
                  <li>Fill in faculty details (Employee ID, Name, Email, Department)</li>
                  <li>Upload the completed file</li>
                  <li>Maximum file size: 5MB</li>
                </ul>
              </div>
            </div>
          </Card>

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
                  Download Faculty Template
                </Button>
              </div>

              <div className="border-t border-gray-200"></div>

              {/* File Upload */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Step 2: Upload Completed File
                </h3>
                
                <div className="space-y-4">
                  {/* File Input */}
                  <div>
                    <label
                      htmlFor="faculty-file-input"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Select Excel File
                    </label>
                    <input
                      id="faculty-file-input"
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
                    {uploading ? 'Uploading...' : 'Upload Faculty Data'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Uploaded Faculty List */}
          {uploadedFaculty.length > 0 && (
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Uploaded Faculty
                  </h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {uploadedFaculty.length} Members
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {uploadedFaculty.map((faculty) => (
                        <tr key={faculty.employeeId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {faculty.employeeId}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {faculty.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {faculty.email}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {faculty.department}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                            <button
                              onClick={() => handleRemoveFaculty(faculty.employeeId)}
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
        </>
      )}
    </div>
  );
};

export default FacultyCreationTab;
