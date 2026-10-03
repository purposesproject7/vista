import api from "../../../services/api";

/**
 * Fetch the logged-in student's project (includes guide + panel details)
 * @param {string} regNo - the logged-in student's own regNo (from useAuth().user.regNo)
 */
export const getMyProject = async (regNo) => {
  const response = await api.get(`/student/project/${regNo}`);
  return response.data.data;
};

/**
 * Submit (or re-submit) the logged-in student's proposed title/abstract
 */
export const submitTitleAbstract = async ({ title, abstract }) => {
  const response = await api.post("/student/project/title-abstract", {
    title,
    abstract,
  });
  return response.data.data;
};

/**
 * Get the title/abstract workflow status for the logged-in student's project
 */
export const getTitleAbstractStatus = async () => {
  const response = await api.get("/student/project/title-abstract");
  return response.data.data;
};
