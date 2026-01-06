import api from "./api";

export const getMarkingSchema = async (academicYear, school, program) => {
  const response = await api.get("/admin/marking-schema", {
    params: {
      academicYear,
      school,
      program,
    },
  });
  return response.data;
};

export const createOrUpdateMarkingSchema = async (data) => {
  const response = await api.post("/admin/marking-schema", data);
  return response.data;
};

export const updateMarkingSchema = async (id, data) => {
  const response = await api.put(`/admin/marking-schema/${id}`, data);
  return response.data;
};
