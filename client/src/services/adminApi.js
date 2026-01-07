import api from "./api";

// Panel Management
export const fetchPanels = async (filters) => {
  try {
    const response = await api.get("/admin/panels", { params: filters });
    return {
      success: true,
      panels: response.data.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch panels",
    };
  }
};

export const fetchProjects = async (filters) => {
  try {
    const response = await api.get("/admin/projects", { params: filters });
    return response.data;
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
