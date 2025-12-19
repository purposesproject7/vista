// src/features/admin/components/faculty-management/FacultyUploadTab.jsx
import React, { useState, useCallback } from 'react';
import { ArrowUpTrayIcon, UserPlusIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import AcademicFilterSelector from '../student-management/AcademicFilterSelector';
import Button from '../../../../shared/components/Button';
import Card from '../../../../shared/components/Card';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';
import ExcelUpload from '../../../../shared/components/ExcelUpload';
import FacultyModal from './FacultyModal';
import * as adminApi from '../../services/adminApi';
import { useToast } from '../../../../shared/hooks/useToast';

const FacultyUploadTab = () => {
  const [filters, setFilters] = useState(null);
  const [activeUploadMode, setActiveUploadMode] = useState('single'); // 'single' or 'bulk'
  const [isSingleAddOpen, setIsSingleAddOpen] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const { showToast } = useToast();

  const templateColumns = ['name', 'employeeId', 'emailId', 'phoneNumber', 'specialization', 'role'];

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

      const enrichedData = parsedData.map(faculty => ({
        ...faculty,
        schoolId: filters?.school,
        programId: filters?.programme,
        yearId: filters?.year,
        semesterId: filters?.semester
      }));

      await adminApi.bulkUploadFaculty(enrichedData);
      setUploadStatus({ success: true, message: `Successfully uploaded ${parsedData.length} faculty members` });
      showToast('Faculty members uploaded successfully', 'success');
      setParsedData([]);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({ success: false, message: error.response?.data?.message || 'Failed to upload faculty' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddFaculty = async (facultyData) => {
    try {
      const newFaculty = {
        ...facultyData,
        schoolId: filters.school,
        programId: filters.programme,
        yearId: filters.year,
        semesterId: filters.semester,
        schoolName: filters.schoolName,
        programmeName: filters.programmeName,
        yearName: filters.yearName,
        semesterName: filters.semesterName
      };

      await adminApi.createFaculty(newFaculty);
      showToast('Faculty member added successfully', 'success');
      setIsSingleAddOpen(false);
    } catch (error) {
      console.error('Error adding faculty:', error);
      showToast(error.response?.data?.message || 'Failed to add faculty', 'error');
      throw error;
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
              onClick={() => setIsSingleAddOpen(true)}
            >
              <UserPlusIcon className="w-4 h-4 mr-1" />
              Add Faculty
            </Button>
            <span className="text-xs text-gray-500 self-center ml-2">
              {filters.schoolName} → {filters.programmeName} → {filters.yearName} → {filters.semesterName}
            </span>
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
            initialData={null}
          />
        </>
      )}
    </div>
  );
};

export default FacultyUploadTab;
