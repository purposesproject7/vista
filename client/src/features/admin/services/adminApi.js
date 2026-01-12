// src/features/admin/services/adminApi.js
import api from "../../../services/api";

/**
 * Admin API Service
 * Handles all API calls for admin features with data adapters
 * Backend is the source of truth
 *
 * IMPORTANT: Field Mapping
 * - Frontend uses 'programme' (British spelling) for user-facing display
 * - Backend uses 'department' field to store programme data
 * - Hierarchy: School → Programme (stored as department in backend) → Academic Year
 * - All adapters map backend 'department' to frontend 'programme' for consistency
 */

// ==================== Data Adapters ====================

/**
 * Adapt backend student data to frontend format
 */
const adaptStudent = (backendStudent, project = null) => {
  if (!backendStudent) return null;

  const adapted = {
    _id: backendStudent._id,
    regNo: backendStudent.regNo,
    name: backendStudent.name,
    email: backendStudent.emailId,
    emailId: backendStudent.emailId,
    school: backendStudent.school,
    programme: backendStudent.program, // Backend uses 'program', frontend uses 'programme'
    department: backendStudent.program, // Keep for compatibility
    academicYear: backendStudent.academicYear,
    PAT: backendStudent.PAT || false,
    isActive: backendStudent.isActive !== false,
  };

  // If project data is populated
  if (project) {
    adapted.projectId = project._id;
    adapted.projectName = project.name;
    adapted.projectType = project.type;

    // Guide info
    if (project.guideFaculty) {
      adapted.guide =
        project.guideFaculty && typeof project.guideFaculty === "object"
          ? project.guideFaculty.name
          : null;
      adapted.guideId =
        project.guideFaculty && typeof project.guideFaculty === "object"
          ? project.guideFaculty._id
          : project.guideFaculty;
    }

    // Panel info
    if (project.panel) {
      adapted.panelId =
        project.panel && typeof project.panel === "object" ? project.panel._id : project.panel;
    }

    // Team members (other students)
    adapted.teammates = project.students
      ? project.students
        .filter((s) => s._id?.toString() !== backendStudent._id?.toString())
        .map((s) => ({
          _id: s._id,
          id: s._id,
          name: s.name,
          regNo: s.regNo,
          email: s.emailId,
        }))
      : [];

    adapted.teamSize = project.teamSize || adapted.teammates.length + 1;
  }

  // PPT approval status from approvals map
  if (backendStudent.approvals?.ppt) {
    const pptApproval = backendStudent.approvals.ppt;
    adapted.pptStatus = pptApproval.approved
      ? "approved"
      : pptApproval.locked
        ? "rejected"
        : "pending";
    adapted.pptApprovedAt = pptApproval.approvedAt;
  } else {
    adapted.pptStatus = "pending";
  }

  return adapted;
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
    programme: backendFaculty.program, // Backend uses 'program', frontend uses 'programme'
    department: backendFaculty.program, // Keep for compatibility
    role: backendFaculty.role,
    specialization: backendFaculty.specialization || [],
    phoneNumber: backendFaculty.phoneNumber,
    isActive: backendFaculty.isActive !== false,
    isProjectCoordinator: backendFaculty.isProjectCoordinator || false,
  };
};

/**
 * Adapt backend panel data to frontend format
 */
const adaptPanel = (backendPanel) => {
  if (!backendPanel) return null;

  return {
    id: backendPanel._id,
    _id: backendPanel._id,
    members:
      backendPanel.members?.map((m) => ({
        _id: m._id,
        faculty: {
          _id: m.faculty?._id,
          employeeId: m.faculty?.employeeId,
          name: m.faculty?.name,
          email: m.faculty?.emailId,
          emailId: m.faculty?.emailId,
          specialization: m.faculty?.specialization,
        },
        employeeId: m.faculty?.employeeId,
        name: m.faculty?.name,
        email: m.faculty?.emailId,
        specialization: m.faculty?.specialization,
      })) || [],
    academicYear: backendPanel.academicYear,
    school: backendPanel.school,
    programme: backendPanel.program, // Backend uses 'program', frontend uses 'programme'
    department: backendPanel.program, // Keep for compatibility
    isActive: backendPanel.isActive !== false,
    assignedProjects: backendPanel.assignedProjects || 0,
    createdAt: backendPanel.createdAt,
  };
};

/**
 * Adapt backend project data to frontend format
 */
const adaptProject = (backendProject) => {
  if (!backendProject) return null;

  const teamMembers =
    backendProject.students?.map((s) => ({
      _id: s._id,
      regNo: s.regNo,
      name: s.name,
      email: s.emailId,
      emailId: s.emailId,
    })) || [];

  return {
    _id: backendProject._id,
    name: backendProject.name,
    description: backendProject.description,
    type: backendProject.type,
    academicYear: backendProject.academicYear,
    school: backendProject.school,
    programme: backendProject.program, // Backend uses 'program', frontend uses 'programme'
    department: backendProject.program, // Keep for compatibility
    specialization: backendProject.specialization,
    teamSize: backendProject.teamSize || teamMembers.length,
    status: backendProject.status || "active",
    bestProject: backendProject.bestProject || false,
    guide:
      backendProject.guideFaculty && typeof backendProject.guideFaculty === "object"
        ? {
          _id: backendProject.guideFaculty._id,
          name: backendProject.guideFaculty.name || "Not Assigned",
          employeeId: backendProject.guideFaculty.employeeId || "",
          email: backendProject.guideFaculty.emailId || "",
        }
        : null,
    guideId:
      backendProject.guideFaculty && typeof backendProject.guideFaculty === "object"
        ? backendProject.guideFaculty._id
        : backendProject.guideFaculty,
    students: teamMembers,
    teamMembers: teamMembers, // Alias for compatibility
    panel: backendProject.panel ? adaptPanel(backendProject.panel) : null,
    panelId:
      backendProject.panel && typeof backendProject.panel === "object"
        ? backendProject.panel._id
        : backendProject.panel,
    reviewPanels: backendProject.reviewPanels?.map(rp => ({
      reviewType: rp.reviewType,
      panel: rp.panel ? adaptPanel(rp.panel) : null,
      assignedAt: rp.assignedAt,
      assignedBy: rp.assignedBy,
    })) || [],
    createdAt: backendProject.createdAt,
  };
};

// ==================== Master Data APIs ====================

/**
 * Fetch all master data (schools, departments, academic years)
 */
export const fetchMasterData = async () => {
  const response = await api.get("/admin/master-data");
  return response.data;
};

/**
 * Create school
 */
export const createSchool = async (name, code) => {
  const response = await api.post("/admin/master-data/schools", { name, code });
  return response.data;
};

/**
 * Update school
 */
export const updateSchool = async (id, name, code) => {
  const response = await api.put(`/admin/master-data/schools/${id}`, {
    name,
    code,
  });
  return response.data;
};

/**
 * Delete school (soft delete)
 */
export const deleteSchool = async (id) => {
  const response = await api.put(`/admin/master-data/schools/${id}`, {
    isActive: false,
  });
  return response.data;
};

/**
 * Create department
 */
export const createDepartment = async (
  name,
  code,
  school,
  specializations = []
) => {
  const response = await api.post("/admin/master-data/programs", {
    name,
    code,
    school,
    specializations,
  });
  return response.data;
};

/**
 * Create academic year
 */
export const createAcademicYear = async (year) => {
  const response = await api.post("/admin/master-data/academic-years", {
    year,
  });
  return response.data;
};

/**
 * Update academic year
 */
export const updateAcademicYear = async (id, year) => {
  const response = await api.put(`/admin/master-data/academic-years/${id}`, {
    year,
  });
  return response.data;
};

/**
 * Delete academic year (soft delete)
 */
export const deleteAcademicYear = async (id) => {
  const response = await api.put(`/admin/master-data/academic-years/${id}`, {
    isActive: false,
  });
  return response.data;
};

/**
 * Create program
 */
export const createProgram = async (name, code, school) => {
  const response = await api.post("/admin/master-data/programs", {
    name,
    code,
    school,
  });
  return response.data;
};

/**
 * Update program
 */
export const updateProgram = async (id, name, code, school) => {
  const response = await api.put(`/admin/master-data/programs/${id}`, {
    name,
    code,
    school,
  });
  return response.data;
};

/**
 * Delete program (soft delete)
 */
export const deleteProgram = async (id) => {
  const response = await api.put(`/admin/master-data/programs/${id}`, {
    isActive: false,
  });
  return response.data;
};

// ==================== Student APIs ====================

/**
 * Fetch students based on filters
 * @param {Object} filters - { academicYear, school, department, regNo, name }
 */
export const fetchStudents = async (filters = {}) => {
  // Map department to program for backend filters
  const params = { ...filters };
  if (params.department) {
    params.program = params.department;
    delete params.department;
  }
  const response = await api.get("/admin/students", { params });
  if (response.data.success) {
    // Return adapted students with project info if available
    return {
      success: true,
      count: response.data.count,
      students: response.data.data || [],
    };
  }
  return response.data;
};

/**
 * Fetch detailed information for a specific student by regNo
 * @param {string} regNo - The student registration number
 */
export const fetchStudentDetails = async (regNo) => {
  const response = await api.get(`/admin/student/${regNo}`);
  if (response.data.success) {
    return {
      success: true,
      student: response.data.data,
    };
  }
  return response.data;
};

/**
 * Create a single student
 */
export const createStudent = async (studentData) => {
  // Map programme to department for backend
  const payload = {
    ...studentData,
    program:
      studentData.programme ||
      studentData.programmeId ||
      studentData.department,
  };
  const response = await api.post("/admin/student", payload);
  return response.data;
};

/**
 * Bulk upload students
 */
export const bulkUploadStudents = async (students, school, programme) => {
  // Map programme to department for backend
  const response = await api.post("/admin/student/bulk", {
    students,
    academicYear: students[0]?.yearId || students[0]?.academicYear,
    school,
    program: programme, // Backend expects 'program' field
  });
  return response.data;
};

/**
 * Update student information
 * @param {string} regNo - The student registration number
 * @param {Object} data - Updated student data
 */
export const updateStudent = async (regNo, data) => {
  const response = await api.put(`/admin/student/${regNo}`, data);
  return response.data;
};

/**
 * Delete student
 * @param {string} regNo - The student registration number
 */
export const deleteStudent = async (regNo) => {
  const response = await api.delete(`/admin/student/${regNo}`);
  return response.data;
};

// ==================== Faculty APIs ====================

/**
 * Fetch all faculty with optional filters
 */
export const fetchFaculty = async (filters = {}) => {
  // Map department to program for backend filters
  const params = { ...filters };
  if (params.department) {
    params.program = params.department;
    delete params.department;
  }

  const response = await api.get("/admin/faculty", { params });
  if (response.data.success) {
    return {
      success: true,
      count: response.data.count,
      faculty: response.data.data.map(adaptFaculty),
    };
  }
  return response.data;
};

/**
 * Create faculty
 */
export const createFaculty = async (facultyData) => {
  const payload = { ...facultyData };
  if (payload.department) {
    payload.program = payload.department;
  }
  const response = await api.post("/admin/faculty", payload);
  return response.data;
};

/**
 * Bulk create faculty
 */
export const bulkCreateFaculty = async (facultyList) => {
  // Ensure program field is set for all faculty
  const faculty = facultyList.map(f => ({
    ...f,
    program: f.program || f.department
  }));
  const response = await api.post("/admin/faculty/bulk", { facultyList: faculty });
  return response.data;
};

/**
 * Update faculty
 */
export const updateFaculty = async (employeeId, data) => {
  const payload = { ...data };
  if (payload.department) {
    payload.program = payload.department;
  }
  const response = await api.put(`/admin/faculty/${employeeId}`, payload);
  return response.data;
};

/**
 * Delete faculty
 */
export const deleteFaculty = async (employeeId) => {
  const response = await api.delete(`/admin/faculty/${employeeId}`);
  return response.data;
};

// ==================== Panel APIs ====================

/**
 * Fetch all panels
 */
export const fetchPanels = async (filters = {}) => {
  // Map department to program for backend filters
  const params = { ...filters };
  if (params.department) {
    params.program = params.department;
    delete params.department;
  }
  const response = await api.get("/admin/panels", { params });
  if (response.data.success) {
    return {
      success: true,
      panels: response.data.data.map(adaptPanel),
    };
  }
  return response.data;
};

/**
 * Create panel manually
 */
export const createPanel = async (panelData) => {
  const response = await api.post("/admin/panels", panelData);
  return response.data;
};

/**
 * Auto-create panels
 */
export const autoCreatePanels = async (payload) => {
  // payload: { programs, school, academicYear, panelSize, facultyList }
  const response = await api.post("/admin/panels/auto-create", {
    ...payload,
    program: payload.programs || payload.departments, // Ensure backend compat
  });
  return response.data;
};

/**
 * Update panel
 */
export const updatePanel = async (panelId, data) => {
  const response = await api.put(`/admin/panels/${panelId}`, data);
  return response.data;
};

/**
 * Delete panel
 */
export const deletePanel = async (panelId) => {
  const response = await api.delete(`/admin/panels/${panelId}`);
  return response.data;
};

/**
 * Assign panel to project
 */
export const assignPanelToProject = async ({ panelId, projectId, ignoreSpecialization }) => {
  const response = await api.post("/admin/panels/assign", {
    panelId,
    projectId,
    ignoreSpecialization,
  });
  return response.data;
};

/**
 * Auto-assign panels to projects
 */
export const autoAssignPanels = async ({
  academicYear,
  school,
  program,
  department,
}) => {
  const response = await api.post("/admin/panels/auto-assign", {
    academicYear,
    school,
    program: program || department,
    department: program || department,
  });
  return response.data;
};

// ==================== Project APIs ====================

/**
 * Fetch all projects
 */
export const fetchProjects = async (filters = {}) => {
  // Map department to program for backend filters
  const params = { ...filters };
  if (params.department) {
    params.program = params.department;
    delete params.department;
  }
  const response = await api.get("/admin/projects", { params });
  if (response.data.success) {
    return {
      success: true,
      projects: response.data.data.map(adaptProject),
    };
  }
  return response.data;
};

/**
 * Create a single project
 */
export const createProject = async (projectData) => {
  try {
    // Transform field names for backend
    const payload = {
      name: projectData.name,
      students: projectData.teamMembers || [],
      guideFacultyEmpId: projectData.guideFacultyEmpId,
      specialization: projectData.specialization || "",
      type: projectData.type || "Capstone Project",
      school: projectData.school,
      program: projectData.programme || projectData.department, // Map programme to program for backend
      department: projectData.programme || projectData.department, // Keep for robustness
      academicYear: projectData.academicYear,
      description: projectData.description,
    };

    const response = await api.post("/admin/projects", payload);
    return response.data;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

/**
 * Bulk create projects
 */
export const bulkCreateProjects = async (projectsList) => {
  try {
    // Transform each project's field names for backend
    const projects = projectsList.map((project) => ({
      name: project.name,
      students: project.teamMembers || [],
      guideFacultyEmpId: project.guideFacultyEmpId,
      specialization: project.specialization || "",
      type: project.type || "Capstone Project",
      school: project.school,
      program: project.programme || project.department, // Map programme to program for backend
      department: project.programme || project.department,
      academicYear: project.academicYear,
      description: project.description,
    }));

    const response = await api.post("/admin/projects/bulk", { projects });
    return response.data;
  } catch (error) {
    console.error("Error bulk creating projects:", error);
    throw error;
  }
};

/**
 * Get all guides with their projects
 */
export const fetchGuidesWithProjects = async (filters = {}) => {
  const response = await api.get("/admin/projects/guides", { params: filters });
  return response.data;
};

/**
 * Get all panels with their projects
 */
export const fetchPanelsWithProjects = async (filters = {}) => {
  const response = await api.get("/admin/projects/panels", { params: filters });
  return response.data;
};

/**
 * Mark project as best project
 */
export const markAsBestProject = async (projectId, isBest) => {
  const response = await api.patch(
    `/admin/projects/${projectId}/best-project`,
    {
      bestProject: isBest,
    }
  );
  return response.data;
};

/**
 * Get marks for a specific project (all students)
 */
export const fetchProjectMarks = async (projectId) => {
  try {
    const response = await api.get(`/admin/reports/marks`, {
      params: { projectId },
    });

    if (response.data.success) {
      // Transform marks data into a format suitable for the modal
      const marksByStudent = {};

      response.data.data?.forEach((studentData) => {
        const regNo = studentData.student?.regNo;
        if (regNo) {
          marksByStudent[regNo] =
            studentData.marks?.map((mark) => ({
              reviewName: mark.reviewType || "Review",
              facultyType: mark.facultyType,
              components: mark.componentMarks || [],
              totalMarks: mark.totalMarks || 0,
              maxTotalMarks: mark.maxTotalMarks || 0,
              isSubmitted: mark.isSubmitted || false,
            })) || [];
        }
      });

      return { success: true, marksByStudent };
    }

    return { success: false, marksByStudent: {} };
  } catch (error) {
    console.error("Error fetching project marks:", error);
    return { success: false, marksByStudent: {} };
  }
};

// ==================== Request Management APIs ====================

/**
 * Fetch all faculty requests
 */
export const fetchRequests = async (filters = {}) => {
  const response = await api.get("/admin/requests", { params: filters });
  return response.data;
};

/**
 * Update request status (approve/reject)
 */
export const updateRequestStatus = async (
  requestId,
  status,
  remarks = "",
  newDeadline = null
) => {
  const response = await api.put(`/admin/requests/${requestId}/status`, {
    status,
    remarks,
    newDeadline,
  });
  return response.data;
};

/**
 * Fetch all access requests (Project Coordinators)
 */
export const fetchAccessRequests = async (filters = {}) => {
  const response = await api.get("/admin/access-requests", { params: filters });
  return response.data;
};

/**
 * Update access request status
 */
export const updateAccessRequestStatus = async (
  requestId,
  status,
  reason = "",
  grantStartTime = null,
  grantEndTime = null
) => {
  const response = await api.put(`/admin/access-requests/${requestId}/status`, {
    status,
    reason,
    grantStartTime,
    grantEndTime,
  });
  return response.data;
};

// ==================== Broadcast APIs ====================

/**
 * Fetch broadcast messages
 */
export const fetchBroadcasts = async (filters = {}) => {
  const response = await api.get("/admin/broadcasts", { params: filters });
  return response.data;
};

/**
 * Create broadcast message
 */
export const createBroadcast = async (
  message,
  expiresAt,
  targetSchools = [],
  targetPrograms = []
) => {
  const response = await api.post("/admin/broadcasts", {
    message,
    expiresAt,
    targetSchools,
    targetPrograms,
  });
  return response.data;
};

/**
 * Update broadcast message
 */
export const updateBroadcast = async (broadcastId, data) => {
  const response = await api.put(`/admin/broadcasts/${broadcastId}`, data);
  return response.data;
};

/**
 * Delete broadcast message
 */
export const deleteBroadcast = async (broadcastId) => {
  const response = await api.delete(`/admin/broadcasts/${broadcastId}`);
  return response.data;
};

// ==================== Report APIs ====================

/**
 * Fetch report data based on type and filters
 * @param {string} type - Report type identifier
 * @param {Object} filters - Report filters
 */
export const fetchReportData = async (type, filters = {}) => {
  const response = await api.get("/admin/reports", {
    params: {
      type,
      ...filters,
    },
  });
  return response.data;
};

// ==================== Report APIs ====================

/**
 * Get overview report
 */
export const fetchOverviewReport = async (academicYear, school, department) => {
  const response = await api.get("/admin/reports/overview", {
    params: { academicYear, school, program: department },
  });
  return response.data;
};

/**
 * Get projects report
 */
export const fetchProjectsReport = async (academicYear, school, department) => {
  const response = await api.get("/admin/reports/projects", {
    params: { academicYear, school, program: department },
  });
  return response.data;
};

/**
 * Get marks report
 */
export const fetchMarksReport = async (academicYear, school, department) => {
  const response = await api.get("/admin/reports/marks", {
    params: { academicYear, school, program: department },
  });
  return response.data;
};

/**
 * Get faculty workload report
 */
export const fetchFacultyWorkloadReport = async (
  academicYear,
  school,
  department
) => {
  const response = await api.get("/admin/reports/faculty-workload", {
    params: { academicYear, school, program: department },
  });
  return response.data;
};

/**
 * Get student performance report
 */
export const fetchStudentPerformanceReport = async (
  academicYear,
  school,
  department
) => {
  const response = await api.get("/admin/reports/student-performance", {
    params: { academicYear, school, program: department },
  });
  return response.data;
};

// ==================== Project Coordinator APIs ====================

/**
 * Get all project coordinators
 */
export const fetchProjectCoordinators = async (filters = {}) => {
  const response = await api.get("/admin/project-coordinators", {
    params: filters,
  });
  return response.data;
};

/**
 * Assign project coordinator
 */
export const assignProjectCoordinator = async (
  facultyId,
  academicYear,
  school,
  program,
  isPrimary = false,
  permissions = null
) => {
  const response = await api.post("/admin/project-coordinators", {
    facultyId,
    academicYear,
    school,
    program,
    isPrimary,
    permissions,
  });
  return response.data;
};

/**
 * Update project coordinator
 */
export const updateProjectCoordinator = async (coordinatorId, data) => {
  const response = await api.put(
    `/admin/project-coordinators/${coordinatorId}`,
    data
  );
  return response.data;
};

/**
 * Update coordinator permissions
 */
export const updateCoordinatorPermissions = async (
  coordinatorId,
  permissions
) => {
  const response = await api.patch(
    `/admin/project-coordinators/${coordinatorId}/permissions`,
    {
      permissions,
    }
  );
  return response.data;
};

/**
 * Remove project coordinator
 */
export const removeProjectCoordinator = async (coordinatorId) => {
  const response = await api.delete(
    `/admin/project-coordinators/${coordinatorId}`
  );
  return response.data;
};

// ==================== Marking Schema APIs ====================

/**
 * Get marking schema
 */
export const fetchMarkingSchema = async (academicYear, school, department) => {
  const response = await api.get("/admin/marking-schema", {
    params: { academicYear, school, program: department },
  });
  return response.data;
};

/**
 * Create or update marking schema
 */
export const saveMarkingSchema = async (schemaData) => {
  const response = await api.post("/admin/marking-schema", schemaData);
  return response.data;
};

/**
 * Update marking schema
 */
export const updateMarkingSchema = async (schemaId, data) => {
  const response = await api.put(`/admin/marking-schema/${schemaId}`, data);
  return response.data;
};

// ==================== Department Config & Feature Locks ====================

/**
 * Get program configuration
 */
export const fetchProgramConfig = async (academicYear, school, program) => {
  const response = await api.get("/admin/program-config", {
    params: { academicYear, school, program },
  });
  return response.data;
};

/**
 * Save program configuration (Create or Update)
 * @param {Object} configData - { academicYear, school, program, minTeamSize, maxTeamSize, ... }
 */
export const saveProgramConfig = async (configData) => {
  let existingId = null;

  // 1. Check if configuration already exists
  try {
    const existing = await fetchProgramConfig(
      configData.academicYear,
      configData.school,
      configData.program
    );

    if (existing.success && existing.data) {
      existingId = existing.data._id;
    }
  } catch (error) {
    // Ignore 404s (not found), rethrow others
    if (error.response && error.response.status !== 404) {
      throw error;
    }
  }

  // 2. Update or Create based on existence
  if (existingId) {
    // Update existing
    const response = await updateProgramConfig(existingId, {
      ...configData,
      program: configData.program,
    });
    return response;
  } else {
    // Create new
    const response = await createProgramConfig(
      configData.academicYear,
      configData.school,
      configData.program,
      configData
    );
    return response;
  }
};

/**
 * Create program configuration
 */
export const createProgramConfig = async (
  academicYear,
  school,
  program,
  config
) => {
  const response = await api.post("/admin/program-config", {
    academicYear,
    school,
    program,
    ...config,
  });
  return response.data;
};

/**
 * Update program configuration
 */
export const updateProgramConfig = async (configId, updates) => {
  const response = await api.put(`/admin/program-config/${configId}`, updates);
  return response.data;
};

/**
 * Update feature lock (scheduler)
 */
export const updateFeatureLock = async (configId, featureLocks) => {
  const response = await api.patch(
    `/admin/program-config/${configId}/feature-lock`,
    {
      featureLocks,
    }
  );
  return response.data;
};

// Export all as default
export default {
  // Master Data
  fetchMasterData,
  createSchool,
  createDepartment,
  createAcademicYear,

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

  // Panels
  fetchPanels,
  createPanel,
  autoCreatePanels,
  updatePanel,
  deletePanel,
  assignPanelToProject,
  autoAssignPanels,

  // Projects
  fetchProjects,
  createProject,
  bulkCreateProjects,
  fetchGuidesWithProjects,
  fetchPanelsWithProjects,
  markAsBestProject,

  // Requests
  fetchRequests,
  updateRequestStatus,

  // Broadcasts
  fetchBroadcasts,
  createBroadcast,
  updateBroadcast,
  deleteBroadcast,

  // Reports
  fetchOverviewReport,
  fetchProjectsReport,
  fetchMarksReport,
  fetchFacultyWorkloadReport,
  fetchStudentPerformanceReport,

  // Project Coordinators
  fetchProjectCoordinators,
  assignProjectCoordinator,
  updateProjectCoordinator,
  updateCoordinatorPermissions,
  removeProjectCoordinator,

  // Marking Schema
  fetchMarkingSchema,
  saveMarkingSchema,
  updateMarkingSchema,

  // Program Config & Feature Locks
  fetchProgramConfig,
  createProgramConfig,
  updateProgramConfig,
  saveProgramConfig,
  updateFeatureLock,
};
