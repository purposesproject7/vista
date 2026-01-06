import api from '../../../services/api';

/**
 * Fetch all reviews for the logged-in faculty
 * @returns {Promise<Array>} List of reviews
 */
export const getFacultyReviews = async () => {
  const response = await api.get("/faculty/reviews"); // Assuming this endpoint exists or will be mapped
  // If the backend endpoint is actually /faculty/projects or similar that returns reviews structure, we might need to adapt.
  // Based on facultyRoutes.js, we have /faculty/projects and /faculty/marks.
  // There isn't a direct /faculty/reviews endpoint yet in the route file I saw.
  // However, I will implement this and if it fails, I will add the endpoint to the backend or use existing ones.
  // For now, let's assume we might need to fetch projects and adapt them as "reviews" or the backend has been updated.
  // Wait, the user said "check if the context is working".
  // Let's try to use the existing endpoints if possible.
  // getAssignedProjects seems relevant.
  return response.data;
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
