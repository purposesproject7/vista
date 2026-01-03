// src/features/admin/components/student-management/StudentUploadTab.jsx
import React, { useState, useCallback } from 'react';
import { ArrowUpTrayIcon, UserPlusIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import AcademicFilterSelector from './AcademicFilterSelector';
import Button from '../../../../shared/components/Button';
import Card from '../../../../shared/components/Card';
import Input from '../../../../shared/components/Input';
import ExcelUpload from '../../../../shared/components/ExcelUpload';
import * as adminApi from '../../services/adminApi';
import { useToast } from '../../../../shared/hooks/useToast';

const StudentUploadTab = () => {
  const [filters, setFilters] = useState(null);
  const [activeUploadMode, setActiveUploadMode] = useState('single'); // 'single' or 'bulk'
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [formData, setFormData] = useState({
    regNo: '',
    name: '',
    emailId: '',
    phoneNumber: '',
    PAT: false
  });
  const { showToast } = useToast();

  const templateColumns = ['regNo', 'name', 'emailId', 'phoneNumber', 'PAT'];

  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters(selectedFilters);
  }, []);

  const handleDataParsed = (data) => {
    setParsedData(data);
    setUploadStatus(null);
  };

  const handleBulkUpload = async () => {
    if (parsedData.length === 0) {
      setUploadStatus({ success: false, message: 'No data to upload' });
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus(null);

      const enrichedData = parsedData.map(student => ({
        ...student,
        PAT: student.PAT === 'true' || student.PAT === 'TRUE' || student.PAT === true || student.PAT === 1,
        schoolId: filters?.school,
        programmeId: filters?.programme,
        yearId: filters?.year,
        semesterId: filters?.semester,
        schoolName: filters?.schoolName,
        programmeName: filters?.programmeName,
        yearName: filters?.yearName,
        semesterName: filters?.semesterName
      }));

      await adminApi.bulkUploadStudents(enrichedData, filters.school, filters.programme);
      setUploadStatus({ success: true, message: `Successfully uploaded ${parsedData.length} students` });
      showToast('Students uploaded successfully', 'success');
      setParsedData([]);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({ success: false, message: error.response?.data?.message || 'Failed to upload students' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmitSingleStudent = async (e) => {
    e.preventDefault();
    
    if (!formData.regNo || !formData.name || !formData.emailId) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      setIsAddingStudent(true);
      const studentData = {
        ...formData,
        schoolId: filters.school,
        programmeId: filters.programme,
        yearId: filters.year,
        semesterId: filters.semester,
        schoolName: filters.schoolName,
        programmeName: filters.programmeName,
        yearName: filters.yearName,
        semesterName: filters.semesterName
      };

      await adminApi.createStudent(studentData);
      showToast('Student added successfully', 'success');
      
      // Reset form
      setFormData({
        regNo: '',
        name: '',
        emailId: '',
        phoneNumber: '',
        PAT: false
      });
    } catch (error) {
      console.error('Error adding student:', error);
      showToast(error.response?.data?.message || 'Failed to add student', 'error');
    } finally {
      setIsAddingStudent(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Academic Filter Selector */}
      <AcademicFilterSelector onFilterComplete={handleFilterComplete} />

      {/* Upload Options - only show when filters are complete */}
      {filters && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button 
              size="sm" 
              variant={activeUploadMode === 'bulk' ? 'primary' : 'secondary'}
              onClick={() => setActiveUploadMode('bulk')}
            >
              <ArrowUpTrayIcon className="w-4 h-4 mr-1" />
              Bulk Upload
            </Button>
            <Button 
              size="sm" 
              variant={activeUploadMode === 'single' ? 'primary' : 'secondary'}
              onClick={() => setActiveUploadMode('single')}
            >
              <UserPlusIcon className="w-4 h-4 mr-1" />
              Single Entry
            </Button>
            <span className="text-xs text-gray-500 self-center ml-2">
              {filters.schoolName} → {filters.programmeName} → {filters.yearName} → {filters.semesterName}
            </span>
          </div>

          {/* Bulk Upload Section */}
          {activeUploadMode === 'bulk' && (
            <Card>
              <div className="p-4 space-y-4">
                <h3 className="text-base font-semibold text-gray-900">Bulk Upload Students</h3>
                
                <ExcelUpload
                  onDataParsed={handleDataParsed}
                  templateColumns={templateColumns}
                  entityName="Students"
                  maxFileSize={5 * 1024 * 1024}
                />

                <p className="text-xs text-gray-500">
                  <strong>Note:</strong> PAT column should contain 'true' or 'false' values.
                </p>

                {uploadStatus && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 ${uploadStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {uploadStatus.success ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
                    <span className="text-sm">{uploadStatus.message}</span>
                  </div>
                )}

                {parsedData.length > 0 && (
                  <div className="flex justify-end pt-3 border-t">
                    <Button onClick={handleBulkUpload} disabled={isUploading} size="sm">
                      {isUploading ? 'Uploading...' : `Upload ${parsedData.length} Students`}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Single Student Form */}
          {activeUploadMode === 'single' && (
            <Card>
              <div className="p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Add Single Student</h3>

              <form onSubmit={handleSubmitSingleStudent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Registration Number"
                    name="regNo"
                    value={formData.regNo}
                    onChange={handleInputChange}
                    placeholder="e.g., 21BCI0001"
                    required
                  />
                  
                  <Input
                    label="Student Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., John Doe"
                    required
                  />
                  
                  <Input
                    label="Email ID"
                    name="emailId"
                    type="email"
                    value={formData.emailId}
                    onChange={handleInputChange}
                    placeholder="e.g., student@vit.ac.in"
                    required
                  />
                  
                  <Input
                    label="Phone Number"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., 9876543210"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="PAT"
                    name="PAT"
                    checked={formData.PAT}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="PAT" className="ml-2 text-sm text-gray-700">
                    PAT Student (Project Assistance Team)
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setFormData({
                      regNo: '',
                      name: '',
                      emailId: '',
                      phoneNumber: '',
                      PAT: false
                    })}
                  >
                    Clear
                  </Button>
                  <Button type="submit" size="sm" disabled={isAddingStudent}>
                    {isAddingStudent ? 'Adding...' : 'Add Student'}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
          )}
        </>
      )}
    </div>
  );
};

export default StudentUploadTab;
