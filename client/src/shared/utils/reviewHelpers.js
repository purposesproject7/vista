/**
 * Normalize review name for comparison
 * Converts "Review II" to "review_ii" and "review_ii_7555" to "review_ii"
 * This allows flexible matching between different review name formats
 * 
 * @param {string} reviewName - The review name to normalize
 * @returns {string} Normalized review name
 */
export const normalizeReviewName = (reviewName) => {
    if (!reviewName) return '';

    return reviewName
        .toLowerCase()                    // Convert to lowercase
        .replace(/\s+/g, '_')            // Replace spaces with underscores
        .replace(/_+\d+$/, '')           // Remove trailing _digits (e.g., _7555)
        .trim();
};

/**
 * Check if two review names match (flexible matching)
 * Handles cases like:
 * - "Review II" matches "review_ii_7555"
 * - "review1" matches "Review 1"
 * - "review_ii" matches "Review II"
 * 
 * @param {string} reviewName1 - First review name
 * @param {string} reviewName2 - Second review name
 * @returns {boolean} True if they match
 */
export const reviewNamesMatch = (reviewName1, reviewName2) => {
    if (!reviewName1 || !reviewName2) return false;

    // First try exact match (fast path)
    if (reviewName1 === reviewName2) return true;

    // Then try normalized match
    const normalized1 = normalizeReviewName(reviewName1);
    const normalized2 = normalizeReviewName(reviewName2);

    return normalized1 === normalized2;
};

/**
 * Find a PPT approval status for a given review
 * Handles flexible matching of review names
 * 
 * @param {Array} pptApprovals - Array of PPT approval objects
 * @param {string} reviewId - The review ID to search for
 * @returns {Object|undefined} The matching approval object or undefined
 */
export const findPPTApproval = (pptApprovals, reviewId) => {
    if (!Array.isArray(pptApprovals) || !reviewId) return undefined;

    return pptApprovals.find(approval =>
        reviewNamesMatch(approval.reviewType, reviewId)
    );
};
