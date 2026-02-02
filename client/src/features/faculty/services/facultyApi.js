import api from '../../../services/api';

/**
 * Fetch all reviews for the logged-in faculty
 * @returns {Promise<Array>} List of reviews
 */
export const getFacultyReviews = async () => {
  const response = await api.get("/faculty/reviews");
  return response.data.data; // Return the actual array of reviews
};

/**
 * Create a new review
 * @param {Object} reviewData
 */
export const createReview = async (reviewData) => {
  // This probably maps to creating a marking entry or a "request" depending on the workflow.
  // The user wants "Add Review".
  // If "Review" = "Evaluation of a student project", then maybe it's just submitting marks?
  // But the UI shows "Add Review" as a high level action.
  // Let's assume we post to /faculty/reviews or /faculty/marks if it's just marks.
  // But we need to save the "structure" of the review first?
  // Actually, looking at marksSchema, it has 'reviewType'.
  // Maybe "Add Review" just creates a local state or a "draft" mark entry?
  // Or maybe it defines a new "Review Session"?
  // The tasks says "check the schema for reference".
  // Schema has 'reviewType', 'academicYear', 'componentMarks'.
  // So a "Review" is likely a Marks document.
  const response = await api.post("/faculty/marks", reviewData);
  return response.data;
};

export const getComponentLibrary = async (params) => {
  const response = await api.get("/admin/component-library", { params });
  return response.data;
};

export const getMasterData = async () => {
  const response = await api.get("/faculty/master-data");
  return response.data;
};



export const submitMarks = async (payload) => {
  const response = await api.post("/faculty/marks", payload);
  return response.data;
};

export const approvePPT = async (studentId, reviewType) => {
  const response = await api.post("/faculty/approvals/ppt", { studentId, reviewType });
  return response.data;
};
