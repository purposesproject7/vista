// src/features/admin/services/adminApi.js
import api from '../../../services/api';

/**
 * Admin API Service
 * Handles all API calls for admin features
 */

// ==================== Academic Context APIs ====================

/**
 * Fetch all schools
 */
export const fetchSchools = async () => {
  const response = await api.get('/admin/schools');
  return response.data;
};

/**
 * Fetch programmes for a specific school
 */
export const fetchProgrammes = async (schoolId) => {
  const response = await api.get(`/admin/schools/${schoolId}/programmes`);
  return response.data;
};

/**
 * Fetch years for a specific school and programme
 */
export const fetchYears = async (schoolId, programmeId) => {
  const response = await api.get(`/admin/schools/${schoolId}/programmes/${programmeId}/years`);
  return response.data;
};

/**
 * Fetch semesters for a specific school, programme, and year
 */
export const fetchSemesters = async (schoolId, programmeId, yearId) => {
  const response = await api.get(
    `/admin/schools/${schoolId}/programmes/${programmeId}/years/${yearId}/semesters`
  );
  return response.data;
};

// ==================== Student APIs ====================

/**
 * Fetch students based on academic context
 * @param {Object} params - { schoolId, programmeId, yearId, semesterId }
 */
export const fetchStudents = async (params) => {
  const response = await api.get('/admin/students', { params });
  return response.data;
};

/**
 * Fetch detailed information for a specific student
 * @param {string} studentId - The student ID
 */
export const fetchStudentDetails = async (studentId) => {
  const response = await api.get(`/admin/students/${studentId}`);
  return response.data;
};

/**
 * Update student information
 * @param {string} studentId - The student ID
 * @param {Object} data - Updated student data
 */
export const updateStudent = async (studentId, data) => {
  const response = await api.put(`/admin/students/${studentId}`, data);
  return response.data;
};

// ==================== PPT APIs ====================

/**
 * Update PPT approval status
 * @param {string} studentId - The student ID
 * @param {string} status - approved | rejected | pending
 * @param {string} remarks - Optional remarks
 */
export const updatePPTStatus = async (studentId, status, remarks = '') => {
  const response = await api.put(`/admin/students/${studentId}/ppt-status`, {
    status,
    remarks
  });
  return response.data;
};

// ==================== Assignment APIs ====================

/**
 * Assign guide to student
 * @param {string} studentId - The student ID
 * @param {string} guideId - The guide faculty ID
 */
export const assignGuide = async (studentId, guideId) => {
  const response = await api.put(`/admin/students/${studentId}/assign-guide`, {
    guideId
  });
  return response.data;
};

/**
 * Assign panel member to student
 * @param {string} studentId - The student ID
 * @param {string} panelMemberId - The panel member faculty ID
 */
export const assignPanelMember = async (studentId, panelMemberId) => {
  const response = await api.put(`/admin/students/${studentId}/assign-panel`, {
    panelMemberId
  });
  return response.data;
};

// ==================== Team APIs ====================

/**
 * Fetch team members for a student
 * @param {string} studentId - The student ID
 */
export const fetchTeamMembers = async (studentId) => {
  const response = await api.get(`/admin/students/${studentId}/team`);
  return response.data;
};

/**
 * Create or update team
 * @param {Array} studentIds - Array of student IDs
 */
export const updateTeam = async (studentIds) => {
  const response = await api.post('/admin/teams', { studentIds });
  return response.data;
};

// ==================== Export/Report APIs ====================

/**
 * Export students data to CSV
 * @param {Object} params - { schoolId, programmeId, yearId, semesterId }
 */
export const exportStudentsCSV = async (params) => {
  const response = await api.get('/admin/students/export', {
    params,
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Generate student report
 * @param {Object} params - { schoolId, programmeId, yearId, semesterId }
 */
export const generateStudentReport = async (params) => {
  const response = await api.post('/admin/reports/students', params);
  return response.data;
};

export default {
  fetchSchools,
  fetchProgrammes,
  fetchYears,
  fetchSemesters,
  fetchStudents,
  fetchStudentDetails,
  updateStudent,
  updatePPTStatus,
  assignGuide,
  assignPanelMember,
  fetchTeamMembers,
  updateTeam,
  exportStudentsCSV,
  generateStudentReport
};
