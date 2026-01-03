// src/services/modificationApi.js
import api from './api';

/**
 * Get all faculty for a given academic context
 */
export const getFacultyList = async (school, department, academicYear) => {
  const response = await api.get('/admin/faculty', {
    params: { school, department, academicYear }
  });
  return response.data;
};

/**
 * Get projects where faculty is guide
 */
export const getGuideProjects = async (academicYear, school, department, guideFacultyEmpId) => {
  const response = await api.get('/admin/projects/guides', {
    params: { academicYear, school, department }
  });
  return response.data;
};

/**
 * Get projects where faculty is panel member
 */
export const getPanelProjects = async (academicYear, school, department) => {
  const response = await api.get('/admin/projects/panels', {
    params: { academicYear, school, department }
  });
  return response.data;
};

/**
 * Get all panels for academic context
 */
export const getPanels = async (academicYear, school, department) => {
  const response = await api.get('/admin/panels', {
    params: { academicYear, school, department }
  });
  return response.data;
};

/**
 * Reassign guide for a project
 * Uses the project update endpoint
 */
export const reassignGuide = async (projectId, newGuideFacultyEmpId) => {
  const response = await api.put(`/projects/${projectId}`, {
    projectId: String(projectId),
    projectUpdates: {
      guideFacultyEmpId: String(newGuideFacultyEmpId)
    }
  });
  return response.data;
};

/**
 * Reassign panel for a project
 * Uses the project update endpoint
 */
export const reassignPanel = async (projectId, panelId) => {
  const response = await api.put(`/projects/${projectId}`, {
    projectId: String(projectId),
    projectUpdates: {
      panelId: String(panelId)
    }
  });
  return response.data;
};

/**
 * Batch reassign guide for multiple projects
 */
export const batchReassignGuide = async (projectIds, newGuideFacultyEmpId) => {
  const promises = projectIds.map(projectId => 
    reassignGuide(projectId, newGuideFacultyEmpId)
  );
  return await Promise.allSettled(promises);
};

/**
 * Batch reassign panel for multiple projects
 */
export const batchReassignPanel = async (projectIds, panelId) => {
  const promises = projectIds.map(projectId => 
    reassignPanel(projectId, panelId)
  );
  return await Promise.allSettled(promises);
};

/**
 * Assign faculty as panel (creates temporary single-member panel if needed)
 * Note: Ideally panels should be pre-created, but this provides flexibility
 */
export const assignFacultyAsPanel = async (projectId, facultyEmployeeId, academicYear, school, department) => {
  // First, check if single-member panel exists for this faculty
  // If not, create one, then assign
  
  // For now, we'll create a temp panel and assign it
  const panelResponse = await api.post('/admin/panels', {
    memberEmployeeIds: [String(facultyEmployeeId)],
    academicYear: String(academicYear),
    school: String(school),
    department: String(department),
    type: 'temporary'
  });

  const newPanel = panelResponse.data.data;

  // Then use the project update endpoint to assign this panel
  const response = await api.put(`/projects/${projectId}`, {
    projectId: String(projectId),
    projectUpdates: {
      panelId: String(newPanel._id)
    }
  });

  return response.data;
};

/**
 * Batch assign faculty as panel for multiple projects
 */
export const batchAssignFacultyAsPanel = async (projectIds, facultyEmployeeId, academicYear, school, department) => {
  const promises = projectIds.map(projectId => 
    assignFacultyAsPanel(projectId, facultyEmployeeId, academicYear, school, department)
  );
  return await Promise.allSettled(promises);
};
