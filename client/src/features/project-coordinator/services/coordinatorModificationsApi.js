// src/features/project-coordinator/services/coordinatorModificationsApi.js
import api from '../../../services/api';

/**
 * Get all faculty for the coordinator's academic context
 */
export const getFacultyList = async (school, program) => {
    const response = await api.get('/coordinator/faculty', {
        params: { school, program }
    });
    return response.data;
};

/**
 * Get all projects as list
 */
export const getProjectList = async (academicYear, school, program) => {
    const response = await api.get('/coordinator/projects', {
        params: { academicYear, school, program }
    });
    return response.data;
};

/**
 * Get all panels
 */
export const getPanelList = async (academicYear, school, program) => {
    const response = await api.get('/coordinator/panels', {
        params: { academicYear, school, program }
    });
    return response.data;
};

/**
 * Get marking schema (for reviews)
 */
export const getMarkingSchema = async (academicYear, school, program) => {
    const response = await api.get('/coordinator/marking-schema', {
        params: { academicYear, school, program }
    });
    return response.data;
};

/**
 * Reassign guide for a project
 */
export const reassignGuide = async (projectId, newGuideFacultyEmpId, reason) => {
    const response = await api.put(`/coordinator/projects/${projectId}/reassign-guide`, {
        newGuideFacultyEmpId,
        reason
    });
    return response.data;
};

// Reassign panel - now handled by enhanced function below
// export const reassignPanel = ... 
export const assignPanel = async (projectId, panelId) => {
    const response = await api.post('/coordinator/projects/assign-panel', {
        projectId,
        panelId
    });
    return response.data;
};

/**
 * Assign panel for specific review type
 */
export const assignReviewPanel = async (projectId, reviewType, panelId) => {
    const response = await api.post('/coordinator/projects/assign-review-panel', {
        projectId,
        reviewType,
        panelId
    });
    return response.data;
};

/**
 * Batch reassign guide for multiple projects
 */

export const batchReassignGuide = async (projectIds, newGuideFacultyEmpId, reason) => {
    const promises = projectIds.map(projectId =>
        reassignGuide(projectId, newGuideFacultyEmpId, reason)
    );
    return await Promise.allSettled(promises);
};

/**
 * Batch reassign panel for multiple projects
 */
export const batchReassignPanel = async (projectIds, panelId, reason, options = {}) => {
    const promises = projectIds.map(projectId =>
        reassignPanel(projectId, panelId, reason, options)
    );
    return await Promise.allSettled(promises);
};

/**
 * Enhanced reassign panel with options
 */
export const reassignPanel = async (projectId, panelId, reason, options = {}) => {
    const { scope, reviewType, ignoreSpecialization, memberEmployeeIds } = options;

    const response = await api.put('/coordinator/projects/reassign-panel', {
        projectId,
        panelId,
        reason,
        scope,
        reviewType,
        ignoreSpecialization,
        memberEmployeeIds // For single faculty assignment
    });
    return response.data;
}; 
