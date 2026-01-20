// Use environment variable for API base URL, fallback to localhost for development
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';


export const ROLES = {
  FACULTY: 'faculty',
  ADMIN: 'admin',
  COORDINATOR: 'coordinator'
};

export const REVIEW_TYPES = {
  GUIDE: 'guide',
  PANEL: 'panel'
};

export const MARKS_TOTAL = 100;

// Academic Data - These should be fetched from DB in production
// NOTE: In the backend, what we call "Programme" is stored in the "department" field
// Hierarchy: School → Programme (stored as department in backend) → Academic Year
export const SCHOOLS = [
  { id: '1', name: 'SCOPE' },
  { id: '2', name: 'SENSE' },
  { id: '3', name: 'SELECT' },
  { id: '4', name: 'VITBS' },
  { id: '5', name: 'VISH' }
];

export const PROGRAMMES_BY_SCHOOL = {
  '1': [ // SCOPE
    { id: '1', name: 'B.Tech CSE' },
    { id: '2', name: 'B.Tech IT' },
    { id: '3', name: 'M.Tech CSE' },
    { id: '4', name: 'B.Tech CSE (Specialization)' }
  ],
  '2': [ // SENSE
    { id: '5', name: 'B.Tech ECE' },
    { id: '6', name: 'B.Tech EEE' },
    { id: '7', name: 'M.Tech ECE' }
  ],
  '3': [ // SELECT
    { id: '8', name: 'B.Tech Mech' },
    { id: '9', name: 'B.Tech Civil' },
    { id: '10', name: 'B.Tech Aero' }
  ],
  '4': [ // VITBS
    { id: '11', name: 'BBA' },
    { id: '12', name: 'MBA' }
  ],
  '5': [ // VISH
    { id: '13', name: 'BA English' },
    { id: '14', name: 'MA English' }
  ]
};

export const YEARS = [
  { id: '2025', label: '2025-26' },
  { id: '2024', label: '2024-25' },
  { id: '2023', label: '2023-24' },
  { id: '2022', label: '2022-23' }
];

export const SEMESTERS = [
  { id: '1', name: 'Winter Semester' },
  { id: '2', name: 'Summer Semester' }
];

// Request Categories
export const REQUEST_CATEGORIES = [
  { id: 'guide', name: 'Guide' },
  { id: 'panel', name: 'Panel' }
];

// Request Statuses
export const REQUEST_STATUSES = [
  { id: 'pending', name: 'Pending' },
  { id: 'approved', name: 'Approved' },
  { id: 'rejected', name: 'Rejected' }
];
