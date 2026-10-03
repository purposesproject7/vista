// src/features/admin/components/student-management/ProjectFacultyCard.jsx
import React, { useState } from 'react';
import Card from '../../../../shared/components/Card';
import {
  DocumentTextIcon,
  AcademicCapIcon,
  UserIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { updateProject } from '../../services/adminApi';
import Input from '../../../../shared/components/Input';
import { useToast } from '../../../../shared/hooks/useToast';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
    <Icon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-900 break-words">{value || 'N/A'}</p>
    </div>
  </div>
);

const ProjectFacultyCard = ({ student }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [projectTitle, setProjectTitle] = useState(student.projectTitle || student.projectName || '');
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const handleSaveTitle = async () => {
    if (!projectTitle.trim()) {
      showToast('Project title cannot be empty', 'error');
      return;
    }

    try {
      setIsSaving(true);
      // We need project ID. It might be in student.projectId or student.project._id
      const projectId = student.projectId || (student.project && student.project._id);

      if (!projectId) {
        showToast('Project ID not found', 'error');
        return;
      }

      await updateProject(projectId, { name: projectTitle });

      showToast('Project title updated', 'success');
      setIsEditing(false);
      // Note: We should ideally refresh the parent, but for now local state update shows the change immediately
      student.projectTitle = projectTitle; // Mutating prop locally for immediate feedback if parent doesn't refresh
      if (student.project) student.project.name = projectTitle;
    } catch (error) {
      console.error('Failed to update project title:', error);
      showToast('Failed to update project title', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to get panel member names
  const getPanelMembers = () => {
    // If student.panel is an object with members (from detailed fetch)
    if (student.panel && student.panel.members && Array.isArray(student.panel.members)) {
      return student.panel.members.map(m => m.name || m.faculty?.name).filter(Boolean).join(', ');
    }
    // Fallback to student.panelMember if it's a string and NOT "Panel A" etc, or if we have no detailed object
    // But request says "Panel name should be faculty name( not panel A)"
    // If student.panelMember is "Panel A", we want to avoid it if proper names are available.
    // However, if we only have "Panel A", we can't magically get names without fetching.
    // The fetchStudentDetails should populate student.panel with members.
    return student.panelMember || 'Not Assigned';
  };

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <DocumentTextIcon className="w-4 h-4 text-blue-600" />
        Project & Faculty
      </h3>
      <div className="space-y-0">
        {student.projectTitle && (
          <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
            <DocumentTextIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 mb-1">Project Title</p>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="h-8 text-sm"
                    disabled={isSaving}
                  />
                  <button
                    onClick={handleSaveTitle}
                    disabled={isSaving}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                  >
                    <CheckIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setProjectTitle(student.projectTitle || student.projectName || '');
                    }}
                    disabled={isSaving}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2 group">
                  <p className="text-sm text-gray-900 break-words">{projectTitle || 'N/A'}</p>
                  <button
                    onClick={() => {
                      setProjectTitle(student.projectTitle || student.projectName || '');
                      setIsEditing(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:bg-blue-50 rounded transition-opacity"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        <InfoRow
          icon={AcademicCapIcon}
          label="Guide"
          value={student.guide}
        />
        <InfoRow
          icon={UserIcon}
          label="Panel Member"
          value={getPanelMembers()}
        />
      </div>
    </Card>
  );
};

export default ProjectFacultyCard;
