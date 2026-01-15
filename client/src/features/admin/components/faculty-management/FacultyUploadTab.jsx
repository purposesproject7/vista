// src/features/admin/components/faculty-management/FacultyUploadTab.jsx
import React, { useState, useCallback } from 'react';
import { ArrowUpTrayIcon, UserPlusIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import AcademicFilterSelector from '../student-management/AcademicFilterSelector';
import Button from '../../../../shared/components/Button';
import Card from '../../../../shared/components/Card';
import ExcelUpload from '../../../../shared/components/ExcelUpload';
import FacultyModal from './FacultyModal';
import { createFaculty, bulkCreateFaculty } from '../../services/adminApi';
import { useToast } from '../../../../shared/hooks/useToast';

const FacultyUploadTab = () => {
  const [filters, setFilters] = useState(null);
  const [activeUploadMode, setActiveUploadMode] = useState('single'); // 'single' or 'bulk'
  const [isSingleAddOpen, setIsSingleAddOpen] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const { showToast } = useToast();

  const templateColumns = ['name', 'employeeId', 'emailId', 'phoneNumber', 'specialization', 'password', 'role'];

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

      // Enrich faculty data with academic context
      const enrichedData = parsedData.map(faculty => ({
        ...faculty,
        school: filters.school,
        department: filters.department,
        role: faculty.role || 'faculty',
        password: faculty.password || 'defaultPassword123' // Should require password in Excel
      }));

      const response = await bulkCreateFaculty(enrichedData);

      if (response.success) {
        setUploadStatus({ success: true, message: response.message || `Successfully uploaded faculty members` });
        showToast('Faculty members uploaded successfully', 'success');
        setParsedData([]);
      } else {
        setUploadStatus({ success: false, message: response.message || 'Failed to upload faculty' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({ success: false, message: error.response?.data?.message || 'Failed to upload faculty' });
      showToast(error.response?.data?.message || 'Failed to upload faculty', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddFaculty = async (facultyData) => {
    try {
      const newFaculty = {
        ...facultyData,
        school: filters.school,
        department: filters.department,
        role: facultyData.role || 'faculty'
      };

      const response = await createFaculty(newFaculty);

      if (response.success) {
        showToast('Faculty member added successfully', 'success');
        setIsSingleAddOpen(false);
      } else {
        showToast(response.message || 'Failed to add faculty', 'error');
      }
    } catch (error) {
      console.error('Error adding faculty:', error);
      showToast(error.response?.data?.message || 'Failed to add faculty', 'error');
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Academic Filter Selector */}
      <AcademicFilterSelector
        onFilterComplete={handleFilterComplete}
        showYear={false}
      />

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
              onClick={() => setIsSingleAddOpen(true)}
            >
              <UserPlusIcon className="w-4 h-4 mr-1" />
              Add Faculty
            </Button>
            {/* <span className="text-xs text-gray-500 self-center ml-2">
              {filters.school} → {filters.department}
            </span> */}
          </div>

          {/* Bulk Upload Section */}
          {activeUploadMode === 'bulk' && (
            <Card>
              <div className="p-4 space-y-4">
                <h3 className="text-base font-semibold text-gray-900">Bulk Upload Faculty</h3>

                <ExcelUpload
                  onDataParsed={handleDataParsed}
                  templateColumns={templateColumns}
                  entityName="Faculty"
                  maxFileSize={5 * 1024 * 1024}
                />

                {uploadStatus && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 ${uploadStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {uploadStatus.success ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
                    <span className="text-sm">{uploadStatus.message}</span>
                  </div>
                )}

                {parsedData.length > 0 && (
                  <div className="flex justify-end pt-3 border-t">
                    <Button onClick={handleBulkUpload} disabled={isUploading} size="sm">
                      {isUploading ? 'Uploading...' : `Upload ${parsedData.length} Faculty`}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Single Add Modal */}
          <FacultyModal
            isOpen={isSingleAddOpen}
            onClose={() => setIsSingleAddOpen(false)}
            onSave={handleAddFaculty}
            faculty={null}
            filters={filters}
          />
        </>
      )}
    </div>
  );
};

export default FacultyUploadTab;
