// src/features/faculty/hooks/useFacultyReviews.js
import { useState, useEffect } from 'react';
import { isDeadlinePassed, isReviewActive } from '../../../shared/utils/dateHelpers';
import { adaptReviewData } from '../services/facultyAdapter';
import { MOCK_REVIEWS } from '../../../shared/utils/mockData';

export const useFacultyReviews = (filters) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!filters.year || !filters.school || !filters.programme || !filters.type) {
      return; // Don't fetch until all filters are selected
    }

    fetchReviews();
  }, [filters]);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter mock reviews by type (guide/panel)
      const filteredReviews = MOCK_REVIEWS.filter(r => r.review_type === filters.type);
      
      // Adapt backend data to frontend structure
      const adaptedReviews = filteredReviews.map(adaptReviewData);
      setReviews(adaptedReviews);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Categorize reviews into active, missed, and past
  const categorizedReviews = {
    active: reviews.filter(r => isReviewActive(r.startDate, r.endDate) && !isAllTeamsMarked(r)),
    deadlinePassed: reviews.filter(r => isDeadlinePassed(r.endDate) && !isAllTeamsMarked(r)),
    past: reviews.filter(r => isAllTeamsMarked(r))
  };

  return {
    ...categorizedReviews,
    loading,
    error,
    refetch: fetchReviews
  };
};

// Helper to check if all teams in a review are marked
const isAllTeamsMarked = (review) => {
  if (!review.teams || review.teams.length === 0) return false;
  return review.teams.every(team => team.isMarked);
};
