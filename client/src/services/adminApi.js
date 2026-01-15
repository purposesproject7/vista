import api from "./api";

// Helper to adapt backend panel structure to frontend expectations
const adaptPanel = (backendPanel) => {
  if (!backendPanel) return null;
  return {
    ...backendPanel, // Keep original properties
    id: backendPanel._id, // Add alias for convenience
    members:
      backendPanel.members?.map((m) => ({
        _id: m.faculty?._id || m._id || m.faculty, // robust fallback
        employeeId: m.faculty?.employeeId || m.employeeId,
        name: m.faculty?.name || m.name,
        email: m.faculty?.emailId || m.email,
        specialization: m.faculty?.specialization || m.specialization,
      })) || [],
    assignedProjects: backendPanel.assignedProjectsCount || 0,
    projects: backendPanel.projects || [], // Expecting projects list from backend update
  };
};

// Panel Management
export const fetchPanels = async (filters) => {
  try {
    const response = await api.get("/admin/panels", { params: filters });
    return {
      success: true,
      panels: response.data.data.map(adaptPanel),
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch panels",
    };
  }
};

const adaptProject = (backendProject) => {
  if (!backendProject) return null;
  return {
    ...backendProject,
    id: backendProject._id,
    panel: backendProject.panel
      ? typeof backendProject.panel === "object"
        ? adaptPanel(backendProject.panel)
        : backendProject.panel
      : null,
    panelId:
      backendProject.panel && typeof backendProject.panel === "object"
        ? backendProject.panel._id
        : backendProject.panel || null,
  };
};

export const fetchProjects = async (filters) => {
  try {
    const response = await api.get("/admin/projects", { params: filters });
    return {
      success: true,
      data: response.data.data.map(adaptProject),
      count: response.data.count,
    };
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch projects"
    );
  }
};

export const createPanel = async (panelData) => {
  try {
    const response = await api.post("/admin/panels", panelData);
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to create panel");
  }
};

export const autoCreatePanels = async (config) => {
  try {
    const response = await api.post("/admin/panels/auto-create", config);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to auto-create panels"
    );
  }
};

export const bulkCreatePanels = async (panels) => {
  try {
    const response = await api.post("/admin/panels/bulk", { panels });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to bulk create panels"
    );
  }
};

export const assignPanelToProject = async (assignmentData) => {
  try {
    const response = await api.post("/admin/panels/assign", assignmentData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to assign panel");
  }
};

export const autoAssignPanels = async (filters) => {
  try {
    const response = await api.post("/admin/panels/auto-assign", filters);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to auto-assign panels"
    );
  }
};

export const fetchPanelSummary = async (filters) => {
  try {
    const response = await api.get("/admin/panels/summary", {
      params: filters,
    });
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch summary");
  }
};

export const deletePanel = async (panelId) => {
  try {
    const response = await api.delete(`/admin/panels/${panelId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to delete panel");
  }
};

export const updatePanel = async (panelId, updates) => {
  try {
    const response = await api.put(`/admin/panels/${panelId}`, updates);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to update panel");
  }
};

// Faculty Helpers
export const fetchFacultyDetailsBulk = async (employeeIds) => {
  try {
    const response = await api.post("/admin/faculty/details-bulk", {
      employeeIds,
    });
    return response.data;
  } catch (error) {
    throw new Error();
  }
};

export const fetchMasterData = async () => {
  try {
    const response = await api.get("/admin/master-data");
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to fetch master data"
    );
  }
};
