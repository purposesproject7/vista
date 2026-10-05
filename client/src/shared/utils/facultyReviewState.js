export const gradingReviewsForRole = (reviews, role) => reviews.filter(review => role !== 'guide' || review.facultyType !== 'panel');

export function reviewAvailabilityMessage(reviews, filters, now = new Date()) {
  if (!filters.school || !filters.program || !filters.year || filters.program === 'All Programs') return 'Select a school, programme and academic year to load reviews.';
  const panels = reviews.filter(review => review.isActive !== false && review.facultyType === 'panel' && new Date(review.deadline?.from) <= now && now <= new Date(review.deadline?.to));
  if (filters.role === 'guide' && panels.length) return `${panels.map(review => review.displayName).join(', ')} is open for panel evaluation. Select Panel mode to check your panel assignments. There are no active guide evaluations for this context.`;
  return 'No pending active evaluations for your assigned teams in this academic context. Check completed reviews below.';
}
