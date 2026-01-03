// src/features/admin/components/project-management/ProjectBulkUploadModal.jsx
import React, { useState } from 'react';
import Modal from '../../../../shared/components/Modal';
import ExcelUpload from '../../../../shared/components/ExcelUpload';
import Button from '../../../../shared/components/Button';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const PROJECT_TEMPLATE_COLUMNS = [
  'name',
  'guideFacultyEmpId',
  'teamMembers', // comma-separated registration numbers
  'type', // Research, Development, etc.
  'specialization'
];

const ProjectBulkUploadModal = ({ isOpen, onClose, onUpload, filters }) => {
  const [parsedData, setParsedData] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleDataParsed = (data) => {
    // Transform and enrich data
    const enrichedData = data.map(project => {
      // Split teamMembers string into array
      const teamMembers = project.teamMembers 
        ? project.teamMembers.split(',').map(s => s.trim())
        : [];

      return {
        ...project,
        school: filters?.school,
        department: filters?.programme,
        academicYear: filters?.year,
        semester: filters?.semester,
        teamMembers
      };
    });
    
    setParsedData(enrichedData);
    setUploadStatus({ type: 'info', message: `Parsed ${data.length} project records` });
  };

  const handleUpload = async () => {
    if (!parsedData || parsedData.length === 0) {
      setUploadStatus({ type: 'error', message: 'No data to upload' });
      return;
    }

    setUploading(true);
    setUploadStatus({ type: 'info', message: 'Uploading...' });

    try {
      const result = await onUpload(parsedData);
      
      setUploadStatus({ 
        type: 'success', 
        message: `Successfully uploaded ${parsedData.length} projects` 
      });
      
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      setUploadStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to upload project data' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setParsedData(null);
    setUploadStatus(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Upload Projects"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Instructions:</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Download the template and fill in project details</li>
            <li>Required fields: name, guideFacultyEmpId, teamMembers</li>
            <li>teamMembers: Enter comma-separated student registration numbers</li>
            <li>type: Research, Development, Innovation, etc.</li>
            <li>specialization: AI, Web Dev, IoT, etc.</li>
            {filters && <li>Projects will be added to: {filters.schoolName || 'Selected School'} - {filters.programmeName || 'Selected Programme'}</li>}
          </ul>
        </div>

        {/* Excel Upload Component */}
        <ExcelUpload
          onDataParsed={handleDataParsed}
          templateColumns={PROJECT_TEMPLATE_COLUMNS}
          entityName="Projects"
          maxFileSize={10 * 1024 * 1024}
        />

        {/* Preview */}
        {parsedData && parsedData.length > 0 && (
          <div className="border border-gray-200 rounded-lg">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900">
                Preview ({parsedData.length} records)
              </h4>
            </div>
            <div className="max-h-64 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Project Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Guide</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Team Size</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {parsedData.slice(0, 5).map((project, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900">{project.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{project.guideFacultyEmpId}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{project.teamMembers.length}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{project.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 5 && (
                <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 text-center">
                  ... and {parsedData.length - 5} more records
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Message */}
        {uploadStatus && (
          <div className={`flex items-center space-x-2 p-3 rounded-lg ${
            uploadStatus.type === 'success' ? 'bg-green-50 border border-green-200' :
            uploadStatus.type === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            {uploadStatus.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            ) : uploadStatus.type === 'error' ? (
              <XCircleIcon className="w-5 h-5 text-red-600" />
            ) : null}
            <p className={`text-sm ${
              uploadStatus.type === 'success' ? 'text-green-800' :
              uploadStatus.type === 'error' ? 'text-red-800' :
              'text-blue-800'
            }`}>
              {uploadStatus.message}
            </p>
          </div>
        )}

        {/* Actions */}
        {parsedData && parsedData.length > 0 && (
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading...' : `Upload ${parsedData.length} Projects`}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ProjectBulkUploadModal;
