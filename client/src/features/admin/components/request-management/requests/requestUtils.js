// src/features/admin/components/request-management/requests/requestUtils.js
import { SCHOOLS, PROGRAMMES_BY_SCHOOL } from '../../../../../shared/constants/config';

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
  }).format(date);
};

// Generate mock request data
export const generateMockRequests = () => {
  const scopePrograms = PROGRAMMES_BY_SCHOOL['1']; // SCOPE
  const sensePrograms = PROGRAMMES_BY_SCHOOL['2']; // SENSE
  const selectPrograms = PROGRAMMES_BY_SCHOOL['3']; // SELECT

  return [
    {
      id: 1,
      facultyId: 1,
      facultyName: 'Dr. John Smith',
      studentName: 'Rahul Sharma',
      category: 'guide',
      projectTitle: 'AI-Based Traffic Management System',
      message: 'Requesting extension for Review 3 due to pending dataset collection from traffic authority. Need 2 more weeks to complete implementation.',
      status: 'pending',
      date: '2025-12-10',
      school: SCHOOLS[0].name, // SCOPE
      program: scopePrograms[0].name // B.Tech CSE
    },
    {
      id: 2,
      facultyId: 1,
      facultyName: 'Dr. John Smith',
      studentName: 'Priya Patel',
      category: 'panel',
      projectTitle: 'AI-Based Traffic Management System',
      message: 'Panel member unavailable for scheduled review. Requesting reschedule to next week.',
      status: 'pending',
      date: '2025-12-09',
      school: SCHOOLS[0].name, // SCOPE
      program: scopePrograms[0].name // B.Tech CSE
    },
    {
      id: 3,
      facultyId: 2,
      facultyName: 'Dr. Sarah Johnson',
      studentName: 'Amit Kumar',
      category: 'guide',
      projectTitle: 'Blockchain for Supply Chain',
      message: 'Medical emergency in family. Requesting postponement of Review 2 by one week.',
      status: 'pending',
      date: '2025-12-09',
      school: SCHOOLS[0].name, // SCOPE
      program: scopePrograms[0].name // B.Tech CSE
    },
  {
    id: 4,
    facultyId: 3,
    facultyName: 'Dr. Michael Brown',
    studentName: 'Sneha Reddy',
    category: 'panel',
    projectTitle: 'IoT Home Automation',
    message: 'Hardware components delayed in shipment. Requesting 10-day extension for Review 3 demonstration.',
    status: 'approved',
    date: '2025-12-08',
    school: SCHOOLS[1].name, // SENSE
    program: sensePrograms[0].name, // B.Tech ECE
    approvalReason: 'Valid reason. Extension approved until Dec 20.'
  },
  {
    id: 5,
    facultyId: 2,
    facultyName: 'Dr. Sarah Johnson',
    studentName: 'Vikram Singh',
    category: 'guide',
    projectTitle: 'Machine Learning for Stock Prediction',
    message: 'Conflict with final exams scheduled on same day as review. Requesting alternate date.',
    status: 'pending',
    date: '2025-12-11',
    school: SCHOOLS[0].name, // SCOPE
    program: scopePrograms[0].name // B.Tech CSE
  },
  {
    id: 6,
    facultyId: 4,
    facultyName: 'Dr. Emily Davis',
    studentName: 'Ananya Iyer',
    category: 'guide',
    projectTitle: 'Digital Marketing Strategy Platform',
    message: 'Client feedback delayed. Need additional time to incorporate revisions in final presentation.',
    status: 'pending',
    date: '2025-12-10',
    school: SCHOOLS[3].name, // VITBS
    program: PROGRAMMES_BY_SCHOOL['4'][1].name // MBA
  },
  {
    id: 7,
    facultyId: 4,
    facultyName: 'Dr. Emily Davis',
    studentName: 'Rohan Mehta',
    category: 'panel',
    projectTitle: 'E-commerce Analytics Dashboard',
    message: 'Server issues affecting demo environment. IT team working on fix. Requesting 3-day postponement.',
    status: 'rejected',
    date: '2025-12-07',
    school: SCHOOLS[3].name, // VITBS
    program: PROGRAMMES_BY_SCHOOL['4'][1].name, // MBA
    rejectionReason: 'Insufficient notice. Please ensure technical setup is verified 48 hours before review.'
  },
  {
    id: 8,
    facultyId: 5,
    facultyName: 'Dr. Robert Wilson',
    studentName: 'Kavya Nair',
    category: 'guide',
    projectTitle: 'Sustainable Urban Planning Model',
    message: 'Awaiting survey data from municipal corporation. Requesting extension to complete analysis phase.',
    status: 'pending',
    date: '2025-12-11',
    school: SCHOOLS[2].name, // SELECT
    program: selectPrograms[0].name // B.Tech Mech
  }
];
};

// Group requests by faculty
export const groupRequestsByFaculty = (requests) => {
  const grouped = {};
  
  requests.forEach(request => {
    if (!grouped[request.facultyId]) {
      grouped[request.facultyId] = {
        id: request.facultyId,
        name: request.facultyName,
        school: request.school,
        program: request.program,
        requests: []
      };
    }
    grouped[request.facultyId].requests.push(request);
  });
  
  return Object.values(grouped);
};

// Apply filters to requests
export const applyFilters = (requests, filters) => {
  return requests.filter(request => {
    if (filters.school && request.school !== filters.school) return false;
    if (filters.program && request.program !== filters.program) return false;
    if (filters.category && request.category !== filters.category) return false;
    if (filters.status && request.status !== filters.status) return false;
    return true;
  });
};
