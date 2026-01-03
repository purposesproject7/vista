// src/features/project-coordinator/components/student-management/StudentCreate.jsx
import { useState, useCallback } from 'react';
import { CloudArrowUpIcon, DocumentArrowDownIcon, CheckCircleIcon, PlusIcon } from '@heroicons/react/24/outline';
import AcademicFilterSelector from '../shared/AcademicFilterSelector';
import Card from '../../../../shared/components/Card';
import Button from '../../../../shared/components/Button';
import Input from '../../../../shared/components/Input';
import { useToast } from '../../../../shared/hooks/useToast';
import { downloadStudentTemplate, validateStudentFile, parseStudentExcel } from '../../utils/studentUtils';

const StudentCreate = () => {
  const [filters, setFilters] = useState(null); // Academic filters from selector
  const [activeMode, setActiveMode] = useState(null); // 'upload' or 'manual'
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedStudents, setUploadedStudents] = useState([]);
  
  // Manual form state
  const [manualForm, setManualForm] = useState({
    regNo: '',
    name: '',
    emailId: ''
  });
  const [manualError, setManualError] = useState(null);
  const [manualStudents, setManualStudents] = useState([]);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  const { showToast } = useToast();

  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters(selectedFilters);
    setActiveMode(null); // Reset mode when filters change
    setSelectedFile(null);
    setFileError(null);
    setUploadedStudents([]);
    setManualForm({ regNo: '', name: '', emailId: '' });
    setManualError(null);
    setManualStudents([]);
  }, []);

  const handleDownloadTemplate = useCallback(() => {
    try {
      downloadStudentTemplate();
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

    const validation = validateStudentFile(file);
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
      const studentData = await parseStudentExcel(selectedFile);
      setUploadProgress(40);

      // Add school, department, and academicYear from filters
      const enrichedData = studentData.map(student => ({
        ...student,
        school: filters.school,
        department: filters.programme,
        academicYear: filters.year
      }));

      setUploadProgress(100);
      
      // Use parsed data
      setUploadedStudents(enrichedData);
      showToast(
        `Successfully uploaded ${enrichedData.length} students`,
        'success'
      );

      // Reset file input
      setSelectedFile(null);
      if (document.getElementById('student-file-input')) {
        document.getElementById('student-file-input').value = '';
      }

    } catch (error) {
      console.error('Error uploading students:', error);
      showToast(
        error.message || 'Failed to upload students',
        'error'
      );
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
    if (!manualForm.regNo.trim()) {
      setManualError('Registration number is required');
      return false;
    }
    if (!manualForm.name.trim()) {
      setManualError('Name is required');
      return false;
    }
    if (!manualForm.emailId.trim()) {
      setManualError('Email ID is required');
      return false;
    }
    
    // Check for duplicate registration numbers
    const isDuplicate = manualStudents.some(s => s.regNo === manualForm.regNo) ||
                       uploadedStudents.some(s => s.regNo === manualForm.regNo);
    if (isDuplicate) {
      setManualError('Registration number already exists');
      return false;
    }

    return true;
  };

  const handleAddStudent = useCallback(async () => {
    if (!validateManualForm() || !filters) {
      if (!filters) {
        setManualError('Please complete academic filters first');
      }
      return;
    }

    try {
      setIsSubmittingManual(true);
      
      const newStudent = {
        ...manualForm,
        school: filters.school,
        department: filters.programme,
        academicYear: filters.year
      };

      setManualStudents(prev => [...prev, newStudent]);
      
      // Reset form
      setManualForm({
        regNo: '',
        name: '',
        emailId: ''
      });
      setManualError(null);
      
      showToast('Student added successfully', 'success');
    } catch (error) {
      console.error('Error adding student:', error);
      showToast('Failed to add student', 'error');
    } finally {
      setIsSubmittingManual(false);
    }
  }, [manualForm, filters, manualStudents, uploadedStudents, showToast]);

  const handleRemoveStudent = useCallback((index, source) => {
    if (source === 'manual') {
      setManualStudents(prev => prev.filter((_, i) => i !== index));
    } else {
      setUploadedStudents(prev => prev.filter((_, i) => i !== index));
    }
    showToast('Student removed', 'info');
  }, [showToast]);

  return (
    <div className="space-y-6">
      {/* Academic Filter Selector */}
      <AcademicFilterSelector onFilterComplete={handleFilterComplete} />

      {filters && !activeMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Excel Option */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-300"
                onClick={() => setActiveMode('upload')}>
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Excel</h3>
              <p className="text-gray-600 mb-6">Bulk upload students using an Excel file</p>
              <Button variant="primary">Upload Students</Button>
            </div>
          </Card>

          {/* Manual Creation Option */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-300"
                onClick={() => setActiveMode('manual')}>
            <div className="text-center py-12">
              <div className="text-5xl mb-4">✏️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Manually</h3>
              <p className="text-gray-600 mb-6">Add students one by one using a form</p>
              <Button variant="primary">Add Student</Button>
            </div>
          </Card>
        </div>
      )}

      {filters && activeMode === 'upload' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upload Students via Excel</h3>
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
                <li>Fill in student details (Registration Number, Name, Email ID)</li>
                <li>School, Department, and Academic Year will be auto-filled</li>
                <li>Upload the completed file</li>
                <li>Maximum file size: 5MB</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Academic Info Display */}
        <Card className="bg-gray-50">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-600 font-semibold">School</p>
              <p className="text-sm text-gray-900 font-medium">{filters.school}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-semibold">Department</p>
              <p className="text-sm text-gray-900 font-medium">{filters.programme}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-semibold">Academic Year</p>
              <p className="text-sm text-gray-900 font-medium">{filters.year}</p>
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
                Download Student Template
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
                    htmlFor="student-file-input"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Select Excel File
                  </label>
                  <input
                    id="student-file-input"
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
                  {uploading ? 'Uploading...' : 'Upload Student Data'}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Uploaded Students List */}
        {uploadedStudents.length > 0 && (
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Uploaded Students
                </h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {uploadedStudents.length} Students
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registration Number
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email ID
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {uploadedStudents.map((student, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.regNo}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {student.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {student.emailId}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => handleRemoveStudent(index, 'upload')}
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
            <h3 className="text-lg font-semibold text-gray-900">Add Students Manually</h3>
            <Button 
              variant="secondary" 
              onClick={() => {
                setActiveMode(null);
                setManualForm({ regNo: '', name: '', emailId: '' });
                setManualError(null);
              }}
            >
              Back
            </Button>
          </div>

          {/* Academic Info Display */}
        <Card className="bg-gray-50">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-600 font-semibold">School</p>
              <p className="text-sm text-gray-900 font-medium">{filters.school}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-semibold">Department</p>
              <p className="text-sm text-gray-900 font-medium">{filters.programme}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-semibold">Academic Year</p>
              <p className="text-sm text-gray-900 font-medium">{filters.year}</p>
            </div>
          </div>
        </Card>

        {/* Manual Form */}
        <Card>
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Enter Student Details</h3>

            {manualError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{manualError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Registration Number"
                placeholder="e.g., 21BCE1001"
                value={manualForm.regNo}
                onChange={(e) => handleManualFormChange('regNo', e.target.value)}
                disabled={isSubmittingManual}
              />

              <Input
                label="Name"
                placeholder="e.g., John Doe"
                value={manualForm.name}
                onChange={(e) => handleManualFormChange('name', e.target.value)}
                disabled={isSubmittingManual}
              />

              <Input
                label="Email ID"
                type="email"
                placeholder="e.g., john@vitstudent.ac.in"
                value={manualForm.emailId}
                onChange={(e) => handleManualFormChange('emailId', e.target.value)}
                disabled={isSubmittingManual}
              />
            </div>

            <Button
              onClick={handleAddStudent}
              disabled={isSubmittingManual}
              className="mt-4"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              {isSubmittingManual ? 'Adding...' : 'Add Student'}
            </Button>
          </div>
        </Card>

        {/* Added Students List */}
        {(manualStudents.length > 0 || uploadedStudents.length > 0) && (
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Added Students
                </h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {manualStudents.length + uploadedStudents.length} Students
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registration Number
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email ID
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
                    {manualStudents.map((student, index) => (
                      <tr key={`manual-${index}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.regNo}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {student.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {student.emailId}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Manual</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => handleRemoveStudent(index, 'manual')}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    {uploadedStudents.map((student, index) => (
                      <tr key={`upload-${index}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.regNo}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {student.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {student.emailId}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Uploaded</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => handleRemoveStudent(index, 'upload')}
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
}

export default StudentCreate;