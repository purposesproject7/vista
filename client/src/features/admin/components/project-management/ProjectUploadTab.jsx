// src/features/admin/components/project-management/ProjectUploadTab.jsx
import React, { useState, useCallback } from 'react';
import { ArrowUpTrayIcon, PlusCircleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import AcademicFilterSelector from '../student-management/AcademicFilterSelector';
import Button from '../../../../shared/components/Button';
import Card from '../../../../shared/components/Card';
import Input from '../../../../shared/components/Input';
import ExcelUpload from '../../../../shared/components/ExcelUpload';
import * as adminApi from '../../services/adminApi';
import { useToast } from '../../../../shared/hooks/useToast';

const ProjectUploadTab = () => {
  const [filters, setFilters] = useState(null);
  const [activeUploadMode, setActiveUploadMode] = useState('single'); // 'single' or 'bulk'
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    guideFacultyEmpId: '',
    teamMembers: '',
    type: '',
    specialization: ''
  });
  const [ignoreDepartmentMismatch, setIgnoreDepartmentMismatch] = useState(false);
  const { showToast } = useToast();

  const templateColumns = ['name', 'guideFacultyEmpId', 'teamMembers', 'type', 'specialization'];

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

      const enrichedData = parsedData.map(project => {
        const teamMembersArray = project.teamMembers
          ? String(project.teamMembers).split(',').map(m => m.trim()).filter(Boolean)
          : [];

        return {
          name: project.name,
          guideFacultyEmpId: project.guideFacultyEmpId,
          teamMembers: teamMembersArray,
          type: project.type || 'Capstone Project',
          specialization: project.specialization || '',
          school: filters.school,
          department: filters.department,
          academicYear: filters.academicYear
        };
      });

      const response = await adminApi.bulkCreateProjects(enrichedData, { ignoreDepartmentMismatch });

      if (!response.success) {
        throw new Error(response.message || 'Failed to upload projects');
      }

      const { created = 0, failed = 0, errors: uploadErrors = [] } = response.data || {};

      if (failed > 0) {
        const errorLines = uploadErrors.map((e, i) => {
          const label = e.name || `Row ${(e.index ?? i) + 1}`;
          return `• ${label}: ${e.error || 'Unknown error'}`;
        });
        const detailMsg = [
          `⚠️ ${created} project${created !== 1 ? 's' : ''} uploaded, ${failed} failed.`,
          '',
          ...errorLines,
        ].join('\n');
        setUploadStatus({ success: false, message: detailMsg });
        if (created > 0) {
          showToast(`${created} project(s) uploaded, ${failed} failed — see details below`, 'error');
        } else {
          showToast('All projects failed to upload — see details below', 'error');
        }
      } else {
        setUploadStatus({ success: true, message: `Successfully uploaded ${created} project${created !== 1 ? 's' : ''}` });
        showToast(`Successfully uploaded ${created} project${created !== 1 ? 's' : ''}`, 'success');
        setParsedData([]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({ success: false, message: error.response?.data?.message || 'Failed to upload projects' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitSingleProject = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.guideFacultyEmpId) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      setIsAddingProject(true);

      // Parse team members (comma-separated registration numbers)
      const teamMembersArray = formData.teamMembers
        .split(',')
        .map(member => member.trim())
        .filter(member => member.length > 0);

      const projectData = {
        name: formData.name,
        guideFacultyEmpId: formData.guideFacultyEmpId,
        teamMembers: teamMembersArray,
        type: formData.type || 'Capstone Project',
        specialization: formData.specialization || '',
        school: filters.school,
        department: filters.department,
        academicYear: filters.academicYear
      };

      const response = await adminApi.createProject(projectData, { ignoreDepartmentMismatch });

      if (!response.success) {
        throw new Error(response.message || 'Failed to create project');
      }
      showToast('Project added successfully', 'success');

      // Reset form
      setFormData({
        name: '',
        guideFacultyEmpId: '',
        teamMembers: '',
        type: '',
        specialization: ''
      });
    } catch (error) {
      console.error('Error adding project:', error);
      showToast(error.response?.data?.message || 'Failed to add project', 'error');
    } finally {
      setIsAddingProject(false);
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
              <PlusCircleIcon className="w-4 h-4 mr-1" />
              Single Entry
            </Button>
            {/* <span className="text-xs text-gray-500 self-center ml-2">
              {filters.school} → {filters.department} → {filters.academicYear}
            </span> */}
          </div>

          <div className="mb-4 flex items-center bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <input
              type="checkbox"
              id="ignoreDepartmentMismatch"
              checked={ignoreDepartmentMismatch}
              onChange={(e) => setIgnoreDepartmentMismatch(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
            />
            <label htmlFor="ignoreDepartmentMismatch" className="ml-2 text-sm text-gray-800">
              Ignore department mismatch between guide and project/students
            </label>
          </div>

          {/* Bulk Upload Section */}
          {activeUploadMode === 'bulk' && (
            <Card>
              <div className="p-4 space-y-4">
                <h3 className="text-base font-semibold text-gray-900">Bulk Upload Projects</h3>

                <ExcelUpload
                  onDataParsed={handleDataParsed}
                  templateColumns={templateColumns}
                  entityName="Projects"
                  maxFileSize={5 * 1024 * 1024}
                />

                <p className="text-xs text-gray-500">
                  <strong>Note:</strong> Team members should be comma-separated registration numbers.
                </p>

                {uploadStatus && (
                  <div className={`p-3 rounded-lg flex items-start gap-2 ${
                    uploadStatus.success
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : uploadStatus.message?.startsWith('⚠️')
                        ? 'bg-amber-50 text-amber-900 border border-amber-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    <span className="mt-0.5 flex-shrink-0">
                      {uploadStatus.success
                        ? <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        : uploadStatus.message?.startsWith('⚠️')
                          ? <span className="text-base leading-none">⚠️</span>
                          : <XCircleIcon className="w-4 h-4 text-red-600" />
                      }
                    </span>
                    <pre className="text-sm whitespace-pre-wrap font-sans break-words flex-1">{uploadStatus.message?.startsWith('⚠️') ? uploadStatus.message.replace(/^⚠️\s*/, '') : uploadStatus.message}</pre>
                  </div>
                )}

                {parsedData.length > 0 && (
                  <div className="flex justify-end pt-3 border-t">
                    <Button onClick={handleBulkUpload} disabled={isUploading} size="sm">
                      {isUploading ? 'Uploading...' : `Upload ${parsedData.length} Projects`}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Single Project Form */}
          {activeUploadMode === 'single' && (
            <Card>
              <div className="p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Add Single Project</h3>

                <form onSubmit={handleSubmitSingleProject} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Project Name"
                      name="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., AI-Based Traffic Management System"
                      required
                    />

                    <Input
                      label="Guide Faculty Employee ID"
                      name="guideFacultyEmpId"
                      value={formData.guideFacultyEmpId}
                      onChange={(e) => handleInputChange('guideFacultyEmpId', e.target.value)}
                      placeholder="e.g., FAC001"
                      required
                    />

                    <Input
                      label="Team Members (Reg Numbers)"
                      name="teamMembers"
                      value={formData.teamMembers}
                      onChange={(e) => handleInputChange('teamMembers', e.target.value)}
                      placeholder="e.g., 21BCI0001, 21BCI0002, 21BCI0003"
                    />

                    <Input
                      label="Project Type"
                      name="type"
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      placeholder="e.g., Research, Development, Innovation"
                    />

                    <Input
                      label="Specialization"
                      name="specialization"
                      value={formData.specialization}
                      onChange={(e) => handleInputChange('specialization', e.target.value)}
                      placeholder="e.g., Machine Learning, IoT, Blockchain"
                    />
                  </div>

                  <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                    <p><strong>Note:</strong> Separate multiple team member registration numbers with commas.</p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setFormData({
                        name: '',
                        guideFacultyEmpId: '',
                        teamMembers: '',
                        type: '',
                        specialization: ''
                      })}
                    >
                      Clear Form
                    </Button>
                    <Button type="submit" disabled={isAddingProject} size="sm">
                      {isAddingProject ? 'Adding...' : 'Add Project'}
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

export default ProjectUploadTab;
