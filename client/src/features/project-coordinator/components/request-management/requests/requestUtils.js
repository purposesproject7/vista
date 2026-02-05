// src/features/project-coordinator/components/request-management/requests/requestUtils.js
import {
  SCHOOLS,
  PROGRAMMES_BY_SCHOOL,
} from "../../../../../shared/constants/config";

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(date);
};

// generateMockRequests removed

// Group requests by faculty
// Group requests by faculty AND then by Project+ReviewType to collapse team requests
export const groupRequestsByFaculty = (requests) => {
  const grouped = {};

  requests.forEach((request) => {
    // 1. Group by Faculty
    if (!grouped[request.facultyId]) {
      grouped[request.facultyId] = {
        id: request.facultyId,
        name: request.facultyName,
        school: request.school,
        program: request.program,
        requests: [],
      };
    }

    // 2. Logic to group by Team (Project + Review)
    // We want to merge requests that are for the same project & review & requestType
    // Typically 'mark_edit' requests are the ones we want to group.
    // 'deadline_extension' might also be team based.
    // 'resubmission' might be too.
    const facultyGroup = grouped[request.facultyId];

    // Check if we already have a group for this project+review
    // We use a temporary way to find existing group in the current array
    // This is O(N^2) but N (requests per faculty) is small.
    // Using a composite key map would be faster but this is cleaner for the existing structure.

    // Only group if project exists (some requests might not have project populated?)
    if (request.id && request.projectTitle && request.category === 'mark_edit') { // Assuming 'category' maps to requestType from backend transformation
      const existingGroupIndex = facultyGroup.requests.findIndex(r =>
        r.isGroup &&
        r.projectTitle === request.projectTitle &&
        r.category === request.category &&
        r.status === request.status // Only group if status matches (all pending, or all approved)
      );

      if (existingGroupIndex > -1) {
        // Add to existing group
        facultyGroup.requests[existingGroupIndex].childRequests.push(request);
        return; // Done for this request
      } else {
        // Check if there is another SINGLE request to start a group with
        const potentialSiblingIndex = facultyGroup.requests.findIndex(r =>
          !r.isGroup &&
          r.projectTitle === request.projectTitle &&
          r.category === request.category &&
          r.status === request.status
        );

        if (potentialSiblingIndex > -1) {
          // Convert existing single request into a group
          const sibling = facultyGroup.requests[potentialSiblingIndex];
          const newGroup = {
            ...sibling,
            id: sibling.id, // Keep ID of first one as representative for API calls
            isGroup: true,
            childRequests: [sibling, request],
            studentName: `Team Request (${sibling.studentName}, ${request.studentName})` // Will update label later
          };
          facultyGroup.requests[potentialSiblingIndex] = newGroup;
          return;
        }
      }
    }

    // If no grouping occurred, add as single
    facultyGroup.requests.push(request);
  });

  // Post-process to fix labels for groups
  Object.values(grouped).forEach(g => {
    g.requests.forEach(r => {
      if (r.isGroup) {
        r.studentName = `${r.childRequests.length} Students`;
        r.message = `${r.message} (Grouped Request)`;
        // Ensure we use a valid ID for action. The grouping logic preserved the first ID.
      }
    });
  });

  return Object.values(grouped);
};

// Apply filters to requests
export const applyFilters = (requests, filters) => {
  return requests.filter((request) => {
    if (filters.school && request.school !== filters.school) return false;
    if (filters.program && request.program !== filters.program) return false;
    if (filters.category && request.category !== filters.category) return false;
    if (filters.status && request.status !== filters.status) return false;
    return true;
  });
};
