
export const isDeadlinePassed = (deadline) => {
  return new Date(deadline) < new Date();
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const isReviewActive = (startDate, endDate) => {
  const now = new Date();
  return new Date(startDate) <= now && new Date(endDate) >= now;
};
