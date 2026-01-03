// src/features/project-coordinator/services/coordinatorApi.js
import api from '../../../services/api';

/**
 * Project Coordinator API Service
 * Handles all API calls for coordinator features with data adapters
 * Backend is the source of truth
 */

// ==================== Data Adapters ====================

/**
 * Adapt backend student data to frontend format
 */
const adaptStudent = (backendStudent) => {
  if (!backendStudent) return null;

  return {
    _id: backendStudent._id,
    regNo: backendStudent.regNo,
    name: backendStudent.name,
    email: backendStudent.emailId,
    emailId: backendStudent.emailId,
    school: backendStudent.school,
    department: backendStudent.department,
    academicYear: backendStudent.academicYear,
    PAT: backendStudent.PAT || false,
    isActive: backendStudent.isActive !== false,
    project: backendStudent.project,
    approvals: backendStudent.approvals || {}
  };
};

/**
 * Adapt backend faculty data to frontend format
 */
const adaptFaculty = (backendFaculty) => {
  if (!backendFaculty) return null;

  return {
    _id: backendFaculty._id,
    employeeId: backendFaculty.employeeId,
    name: backendFaculty.name,
    email: backendFaculty.emailId,
    emailId: backendFaculty.emailId,
    school: backendFaculty.school,
    department: backendFaculty.department,
    role: backendFaculty.role,
    specialization: backendFaculty.specialization,
    phoneNumber: backendFaculty.phoneNumber,
    isActive: backendFaculty.isActive !== false,
    projects: backendFaculty.projects || []
  };
};

/**
 * Adapt backend project data to frontend format
 */
const adaptProject = (backendProject) => {
  if (!backendProject) return null;

  return {
    _id: backendProject._id,
    name: backendProject.name,
    type: backendProject.type || 'Capstone Project',
    specialization: backendProject.specialization,
    school: backendProject.school,
    department: backendProject.department,
    academicYear: backendProject.academicYear,
    status: backendProject.status || 'active',
    teamMembers: backendProject.students?.map(s => ({
      _id: s._id,
      regNo: s.regNo,
      name: s.name,
      email: s.emailId
    })) || [],
    guide: backendProject.guideFaculty ? {
      _id: backendProject.guideFaculty._id,
      name: backendProject.guideFaculty.name,
      employeeId: backendProject.guideFaculty.employeeId
    } : null,
    panel: backendProject.panel || null,
    createdAt: backendProject.createdAt,
    updatedAt: backendProject.updatedAt
  };
};

/**
 * Adapt backend panel data to frontend format
 */
const adaptPanel = (backendPanel) => {
  if (!backendPanel) return null;

  return {
    _id: backendPanel._id,
    members: backendPanel.members?.map(m => ({
      _id: m.faculty?._id || m._id,
      employeeId: m.faculty?.employeeId || m.employeeId,
      name: m.faculty?.name || m.name
    })) || [],
    academicYear: backendPanel.academicYear,
    school: backendPanel.school,
    department: backendPanel.department,
    isActive: backendPanel.isActive !== false,
    assignedProjects: backendPanel.assignedProjects || 0
  };
};

// ==================== Student Management APIs ====================

/**
 * Fetch students with filters
 */
export const fetchStudents = async (filters = {}) => {
  const response = await api.get('/coordinator/students', { params: filters });
  if (response.data.success) {
    return {
      success: true,
      students: response.data.data.map(adaptStudent)
    };
  }
  return response.data;
};

/**
 * Get single student details
 */
export const fetchStudentDetails = async (regNo) => {
  const response = await api.get(`/coordinator/student/${regNo}`);
  if (response.data.success) {
    return {
      success: true,
      student: adaptStudent(response.data.data)
    };
  }
  return response.data;
};

/**
 * Create a single student
 */
export const createStudent = async (studentData) => {
  const response = await api.post('/coordinator/student', studentData);
  return response.data;
};

/**
 * Bulk upload students
 */
export const bulkUploadStudents = async (students) => {
  const response = await api.post('/coordinator/student/bulk', { students });
  return response.data;
};

/**
 * Update student
 */
export const updateStudent = async (regNo, data) => {
  const response = await api.put(`/coordinator/student/${regNo}`, data);
  return response.data;
};

/**
 * Delete student
 */
export const deleteStudent = async (regNo) => {
  const response = await api.delete(`/coordinator/student/${regNo}`);
  return response.data;
};

// ==================== Faculty Management APIs ====================

/**
 * Fetch faculty with filters
 */
export const fetchFaculty = async (filters = {}) => {
  const response = await api.get('/coordinator/faculty', { params: filters });
  if (response.data.success) {
    return {
      success: true,
      faculty: response.data.data.map(adaptFaculty)
    };
  }
  return response.data;
};

/**
 * Create a single faculty
 */
export const createFaculty = async (facultyData) => {
  const response = await api.post('/coordinator/faculty', facultyData);
  return response.data;
};

/**
 * Bulk create faculty
 */
export const bulkCreateFaculty = async (facultyList) => {
  const response = await api.post('/coordinator/faculty/bulk', { faculty: facultyList });
  return response.data;
};

/**
 * Update faculty
 */
export const updateFaculty = async (employeeId, data) => {
  const response = await api.put(`/coordinator/faculty/${employeeId}`, data);
  return response.data;
};

/**
 * Delete faculty
 */
export const deleteFaculty = async (employeeId) => {
  const response = await api.delete(`/coordinator/faculty/${employeeId}`);
  return response.data;
};

// ==================== Project Management APIs ====================

/**
 * Fetch projects with filters
 */
export const fetchProjects = async (filters = {}) => {
  const response = await api.get('/coordinator/projects', { params: filters });
  if (response.data.success) {
    return {
      success: true,
      projects: response.data.data.map(adaptProject)
    };
  }
  return response.data;
};

/**
 * Create a single project
 */
export const createProject = async (projectData) => {
  const payload = {
    name: projectData.name,
    students: projectData.teamMembers || [],
    guideFacultyEmpId: projectData.guideFacultyEmpId,
    specialization: projectData.specialization || '',
    type: projectData.type || 'Capstone Project',
    school: projectData.school,
    department: projectData.department,
    academicYear: projectData.academicYear
  };
  
  const response = await api.post('/coordinator/projects', payload);
  return response.data;
};

/**
 * Bulk create projects
 */
export const bulkCreateProjects = async (projectsList) => {
  const projects = projectsList.map(project => ({
    name: project.name,
    students: project.teamMembers || [],
    guideFacultyEmpId: project.guideFacultyEmpId,
    specialization: project.specialization || '',
    type: project.type || 'Capstone Project',
    school: project.school,
    department: project.department,
    academicYear: project.academicYear
  }));
  
  const response = await api.post('/coordinator/projects/bulk', { projects });
  return response.data;
};

/**
 * Get project marks
 */
export const fetchProjectMarks = async (projectId) => {
  const response = await api.get(`/coordinator/projects/${projectId}/marks`);
  return response.data;
};

// ==================== Panel Management APIs ====================

/**
 * Fetch panels with filters
 */
export const fetchPanels = async (filters = {}) => {
  const response = await api.get('/coordinator/panels', { params: filters });
  if (response.data.success) {
    return {
      success: true,
      panels: response.data.data.map(adaptPanel)
    };
  }
  return response.data;
};

/**
 * Create panel
 */
export const createPanel = async (panelData) => {
  const response = await api.post('/coordinator/panels', panelData);
  return response.data;
};

/**
 * Bulk create panels
 */
export const bulkCreatePanels = async (panelsList) => {
  const response = await api.post('/coordinator/panels/bulk', { panels: panelsList });
  return response.data;
};

/**
 * Auto create panels
 */
export const autoCreatePanels = async (data) => {
  const response = await api.post('/coordinator/panels/auto-create', data);
  return response.data;
};

/**
 * Assign panel to project
 */
export const assignPanelToProject = async ({ projectId, panelId }) => {
  const response = await api.post('/coordinator/projects/assign-panel', { projectId, panelId });
  return response.data;
};

/**
 * Auto assign panels to projects
 */
export const autoAssignPanels = async (filters) => {
  const response = await api.post('/coordinator/panels/auto-assign', filters);
  return response.data;
};

// ==================== Request Management APIs ====================

/**
 * Fetch requests with filters
 */
export const fetchRequests = async (filters = {}) => {
  const response = await api.get('/coordinator/requests', { params: filters });
  return response.data;
};

/**
 * Approve request
 */
export const approveRequest = async (requestId, remarks = '') => {
  const response = await api.post(`/coordinator/requests/${requestId}/approve`, { remarks });
  return response.data;
};

/**
 * Reject request
 */
export const rejectRequest = async (requestId, remarks = '') => {
  const response = await api.post(`/coordinator/requests/${requestId}/reject`, { remarks });
  return response.data;
};

/**
 * Approve multiple requests
 */
export const approveMultipleRequests = async (requestIds, remarks = '') => {
  const response = await api.post('/coordinator/requests/approve-multiple', { 
    requestIds, 
    remarks 
  });
  return response.data;
};

// ==================== Master Data APIs ====================

/**
 * Get academic years
 */
export const fetchAcademicYears = async () => {
  const response = await api.get('/coordinator/academic-years');
  return response.data;
};

/**
 * Get departments
 */
export const fetchDepartments = async () => {
  const response = await api.get('/coordinator/departments');
  return response.data;
};

// Export all functions
export default {
  // Students
  fetchStudents,
  fetchStudentDetails,
  createStudent,
  bulkUploadStudents,
  updateStudent,
  deleteStudent,
  
  // Faculty
  fetchFaculty,
  createFaculty,
  bulkCreateFaculty,
  updateFaculty,
  deleteFaculty,
  
  // Projects
  fetchProjects,
  createProject,
  bulkCreateProjects,
  fetchProjectMarks,
  
  // Panels
  fetchPanels,
  createPanel,
  bulkCreatePanels,
  autoCreatePanels,
  assignPanelToProject,
  autoAssignPanels,
  
  // Requests
  fetchRequests,
  approveRequest,
  rejectRequest,
  approveMultipleRequests,
  
  // Master Data
  fetchAcademicYears,
  fetchDepartments
};
