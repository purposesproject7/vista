// src/features/admin/components/student-management/StudentBulkUploadModal.jsx
import React, { useState } from 'react';
import Modal from '../../../../shared/components/Modal';
import ExcelUpload from '../../../../shared/components/ExcelUpload';
import Button from '../../../../shared/components/Button';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const StudentBulkUploadModal = ({ isOpen, onClose, onUpload, filters }) => {
  const [parsedData, setParsedData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  const templateColumns = [
    'regNo',
    'name',
    'emailId',
    'phoneNumber',
    'PAT'
  ];

  const handleDataParsed = (data) => {
    setParsedData(data);
    setUploadStatus(null);
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) {
      setUploadStatus({ success: false, message: 'No data to upload' });
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus(null);

      // Enrich data with filter information and convert PAT to boolean
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

      const result = await onUpload(enrichedData);
      
      if (result.success) {
        setUploadStatus({ 
          success: true, 
          message: `Successfully uploaded ${parsedData.length} students` 
        });
        
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({ 
        success: false, 
        message: error.response?.data?.message || error.message || 'Failed to upload students' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setParsedData([]);
    setUploadStatus(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Upload Students"
      size="xl"
    >
      <div className="space-y-4">
        {/* Context Information */}
        {filters && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Upload Context</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>School: {filters.schoolName || 'Selected School'}</li>
              <li>Programme: {filters.programmeName || 'Selected Programme'}</li>
              <li>Year: {filters.yearName || 'Selected Year'}</li>
              <li>Semester: {filters.semesterName || 'Selected Semester'}</li>
            </ul>
            <p className="text-xs text-blue-600 mt-2">
              All students will be associated with this academic context.
            </p>
          </div>
        )}

        {/* Excel Upload Component */}
        <ExcelUpload
          onDataParsed={handleDataParsed}
          templateColumns={templateColumns}
          entityName="Students"
          maxFileSize={5 * 1024 * 1024}
        />

        {/* Instructions */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-700">
            <strong>Note:</strong> PAT column should contain 'true' or 'false' values.
          </p>
        </div>

        {/* Upload Status */}
        {uploadStatus && (
          <div className={`
            p-4 rounded-lg flex items-start gap-3
            ${uploadStatus.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}
          `}>
            {uploadStatus.success ? (
              <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm ${uploadStatus.success ? 'text-green-800' : 'text-red-800'}`}>
              {uploadStatus.message}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={parsedData.length === 0 || isUploading}
          >
            {isUploading ? 'Uploading...' : `Upload ${parsedData.length} Students`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default StudentBulkUploadModal;
