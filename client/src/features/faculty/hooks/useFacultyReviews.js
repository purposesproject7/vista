// src/features/faculty/hooks/useFacultyReviews.js
import { useState, useEffect, useCallback } from "react";
import {
  isDeadlinePassed,
  isReviewActive,
} from "../../../shared/utils/dateHelpers";
import { adaptReviewData } from "../services/facultyAdapter";
import * as facultyApi from "../services/facultyApi";

export const useFacultyReviews = (filters) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReviews = useCallback(async () => {
    if (
      !filters.year ||
      !filters.school ||
      !filters.programme ||
      !filters.type
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // In a real scenario, we might fetch projects/reviews from the backend
      // Since the backend 'getFacultyReviews' might not exist exactly as is,
      // we might need to fetch 'projects' and treat them as reviews, or the backend should support this.
      // For now, I'll call the service I just created.
      const data = await facultyApi.getFacultyReviews();

      // Filter by type if needed, though backend should ideally handle this context
      // But since we are reusing the variable 'filters.type' (guide/panel),
      // and if the endpoint returns all, we filter here.
      // Assuming headers/auth context handles the "my reviews" part.

      // FIXME: The backend endpoint /faculty/reviews might not exist.
      // If it 404s, I'll need to fix the backend or use /faculty/projects.
      // For this step, I am wiring it up.

      const filteredReviews = data.filter((r) => r.reviewType === filters.type);
      // Note: Backend might return 'review_type' or 'reviewType'.
      // I'm utilizing adaptReviewData to normalize later?
      // Actually MOCK had 'review_type'. Schema has 'reviewType'.

      const adaptedReviews = filteredReviews.map(adaptReviewData);
      setReviews(adaptedReviews);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
      // Fallback or error message
      setError(err.message || "Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Categorize reviews
  const categorizedReviews = {
    active: reviews.filter(
      (r) => isReviewActive(r.startDate, r.endDate) && !isAllTeamsMarked(r)
    ),
    deadlinePassed: reviews.filter(
      (r) => isDeadlinePassed(r.endDate) && !isAllTeamsMarked(r)
    ),
    past: reviews.filter((r) => isAllTeamsMarked(r)),
  };

  return {
    ...categorizedReviews,
    loading,
    error,
    refetch: fetchReviews,
  };
};

const isAllTeamsMarked = (review) => {
  if (!review.teams || review.teams.length === 0) return false;
  return review.teams.every((team) => team.isMarked);
};
