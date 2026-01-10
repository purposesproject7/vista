// src/services/modificationApi.js
import api from './api';

/**
 * Get all faculty for a given academic context
 */
export const getFacultyList = async (school, program) => {
  const response = await api.get('/admin/faculty', {
    params: { school, program }
  });
  return response.data;
};

/**
 * Get projects where faculty is guide
 */
export const getGuideProjects = async (academicYear, school, program, guideFacultyEmpId) => {
  const response = await api.get('/admin/projects/guides', {
    params: { academicYear, school, program }
  });
  return response.data;
};

/**
 * Get projects where faculty is panel member
 */
export const getPanelProjects = async (academicYear, school, program) => {
  const response = await api.get('/admin/projects/panels', {
    params: { academicYear, school, program }
  });
  return response.data;
};

/**
 * Get all panels for academic context
 */
export const getPanels = async (academicYear, school, program) => {
  const response = await api.get('/admin/panels', {
    params: { academicYear, school, program }
  });
  return response.data;
};

/**
 * Reassign guide for a project
 * Uses the project update endpoint
 */
/**
 * Get marking schema for academic context (to fetch reviews)
 */
export const getMarkingSchema = async (academicYear, school, program) => {
  const response = await api.get('/admin/marking-schema', {
    params: { academicYear, school, program }
  });
  return response.data;
};

/**
 * Reassign guide for a project
 * Uses the project update endpoint
 */
export const reassignGuide = async (projectId, newGuideFacultyEmpId, ignoreSpecialization = false) => {
  const response = await api.put(`/project/${projectId}`, {
    projectId: String(projectId),
    projectUpdates: {
      guideFacultyEmpId: String(newGuideFacultyEmpId),
      ignoreSpecialization
    }
  });
  return response.data;
};

/**
 * Reassign panel for a project
 * Uses the project update endpoint
 */
export const reassignPanel = async (projectId, panelId, ignoreSpecialization = false, assignmentScope = 'main', reviewType = null) => {
  const response = await api.put(`/project/${projectId}`, {
    projectId: String(projectId),
    projectUpdates: {
      panelId: String(panelId),
      ignoreSpecialization,
      assignmentScope,
      reviewType
    }
  });
  return response.data;
};

/**
 * Batch reassign guide for multiple projects
 */
export const batchReassignGuide = async (projectIds, newGuideFacultyEmpId, ignoreSpecialization = false) => {
  const promises = projectIds.map(projectId =>
    reassignGuide(projectId, newGuideFacultyEmpId, ignoreSpecialization)
  );
  return await Promise.allSettled(promises);
};

/**
 * Batch reassign panel for multiple projects
 */
export const batchReassignPanel = async (projectIds, panelId, ignoreSpecialization = false, assignmentScope = 'main', reviewType = null) => {
  const promises = projectIds.map(projectId =>
    reassignPanel(projectId, panelId, ignoreSpecialization, assignmentScope, reviewType)
  );
  return await Promise.allSettled(promises);
};

/**
 * Assign faculty as panel (creates temporary single-member panel if needed)
 * Note: Ideally panels should be pre-created, but this provides flexibility
 */
export const assignFacultyAsPanel = async (projectId, facultyEmployeeId, academicYear, school, program, ignoreSpecialization = false, assignmentScope = 'main', reviewType = null) => {
  // First, check if single-member panel exists for this faculty
  // If not, create one, then assign

  // For now, we'll create a temp panel and assign it
  const panelResponse = await api.post('/admin/panels', {
    memberEmployeeIds: [String(facultyEmployeeId)],
    academicYear: String(academicYear),
    school: String(school),
    program: String(program), // Changed to program for consistency, see comments in previous version
    type: 'temporary'
  });

  const newPanel = panelResponse.data.data;

  // Then use the project update endpoint to assign this panel
  const response = await api.put(`/project/${projectId}`, {
    projectId: String(projectId),
    projectUpdates: {
      panelId: String(newPanel._id),
      ignoreSpecialization,
      assignmentScope,
      reviewType
    }
  });

  return response.data;
};

/**
 * Batch assign faculty as panel for multiple projects
 */
export const batchAssignFacultyAsPanel = async (projectIds, facultyEmployeeId, academicYear, school, program, ignoreSpecialization = false, assignmentScope = 'main', reviewType = null) => {
  const promises = projectIds.map(projectId =>
    assignFacultyAsPanel(projectId, facultyEmployeeId, academicYear, school, program, ignoreSpecialization, assignmentScope, reviewType)
  );
  return await Promise.allSettled(promises);
};
