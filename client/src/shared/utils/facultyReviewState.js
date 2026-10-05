export const gradingReviewsForRole = (reviews, role) => reviews.filter(review => role !== 'guide' || review.facultyType !== 'panel');

// Teams held out of reviews by the Content Check setting "Hold teams out of
// reviews until the guide accepts the title & abstract".
export function lockedTeamsMessage(locked, filters) {
  if (!locked) return null;
  const teams = `${locked} of your ${filters.role === 'panel' ? 'panel' : 'guided'} teams in ${filters.program}, ${filters.year} ${locked > 1 ? 'are' : 'is'}`;
  return filters.role === 'panel'
    ? `${teams} hidden from reviews until their guide accepts the title & abstract (Content Check setting "Hold teams out of reviews"). Ask the guide to accept it, or an admin to switch the setting off.`
    : `${teams} hidden from reviews until you accept the title & abstract (Content Check setting "Hold teams out of reviews"). Accept it above to open their reviews.`;
}

// `assigned`: the faculty has teams in this role and context; `locked`: how many
// of them are held back until their guide accepts the title & abstract;
// `completed`: the Completed section below has something to show.
export function reviewAvailabilityMessage(reviews, filters, now = new Date(), { assigned = true, locked = 0, completed = false } = {}) {
  if (!filters.school || !filters.program || !filters.year || filters.program === 'All Programs') return 'Select a school, programme and academic year to load reviews.';
  const panels = reviews.filter(review => review.isActive !== false && review.facultyType === 'panel' && new Date(review.deadline?.from) <= now && now <= new Date(review.deadline?.to));
  if (filters.role === 'guide' && panels.length) return `${panels.map(review => review.displayName).join(', ')} is open for panel evaluation. Select Panel mode to check your panel assignments. There are no active guide evaluations for this context.`;
  const context = `${filters.program}, ${filters.year}`;
  if (locked) return lockedTeamsMessage(locked, filters);
  if (!assigned) return filters.role === 'panel'
    ? `You are not on the review panel of any team in ${context}.`
    : `You do not guide any team in ${context}.`;
  return `No pending active evaluations for your teams in ${context}.${completed ? ' Completed reviews are listed below.' : ''}`;
}
