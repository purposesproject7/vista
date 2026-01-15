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
export const groupRequestsByFaculty = (requests) => {
  const grouped = {};

  requests.forEach((request) => {
    if (!grouped[request.facultyId]) {
      grouped[request.facultyId] = {
        id: request.facultyId,
        name: request.facultyName,
        school: request.school,
        program: request.program,
        requests: [],
      };
    }
    grouped[request.facultyId].requests.push(request);
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
