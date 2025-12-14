// src/features/admin/utils/mockStudentData.js
// Mock data for testing the Student Management System before backend integration

export const mockSchools = [
  { id: '1', name: 'SCOPE' },
  { id: '2', name: 'SENSE' },
  { id: '3', name: 'SELECT' },
  { id: '4', name: 'VITBS' }
];

export const mockProgrammes = {
  '1': [ // SCOPE
    { id: '1', name: 'B.Tech CSE' },
    { id: '2', name: 'B.Tech IT' },
    { id: '3', name: 'M.Tech CSE' }
  ],
  '2': [ // SENSE
    { id: '4', name: 'B.Tech ECE' },
    { id: '5', name: 'B.Tech EEE' }
  ],
  '3': [ // SELECT
    { id: '6', name: 'B.Tech Mech' },
    { id: '7', name: 'B.Tech Civil' }
  ]
};

export const mockYears = [
  { id: '2025', label: '2025-26' },
  { id: '2024', label: '2024-25' },
  { id: '2023', label: '2023-24' }
];

export const mockSemesters = [
  { id: '1', name: 'Winter Semester' },
  { id: '2', name: 'Summer Semester' }
];

export const mockStudents = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    regNo: '21BCE1001',
    email: 'rajesh.kumar@vitstudent.ac.in',
    phone: '+91 9876543210',
    pptStatus: 'approved',
    pptSubmittedDate: '2025-01-15T10:30:00Z',
    totalMarks: 87,
    guideMarks: 45,
    panelMarks: 42,
    guide: 'Dr. Anita Sharma',
    panelMember: 'Dr. Rakesh Verma',
    projectTitle: 'AI-Based Student Performance Prediction System',
    teammates: [
      { id: '2', name: 'Priya Singh', regNo: '21BCE1002' },
      { id: '3', name: 'Amit Patel', regNo: '21BCE1003' }
    ]
  },
  {
    id: '2',
    name: 'Priya Singh',
    regNo: '21BCE1002',
    email: 'priya.singh@vitstudent.ac.in',
    phone: '+91 9876543211',
    pptStatus: 'approved',
    pptSubmittedDate: '2025-01-15T10:30:00Z',
    totalMarks: 85,
    guideMarks: 44,
    panelMarks: 41,
    guide: 'Dr. Anita Sharma',
    panelMember: 'Dr. Rakesh Verma',
    projectTitle: 'AI-Based Student Performance Prediction System',
    teammates: [
      { id: '1', name: 'Rajesh Kumar', regNo: '21BCE1001' },
      { id: '3', name: 'Amit Patel', regNo: '21BCE1003' }
    ]
  },
  {
    id: '3',
    name: 'Amit Patel',
    regNo: '21BCE1003',
    email: 'amit.patel@vitstudent.ac.in',
    phone: '+91 9876543212',
    pptStatus: 'approved',
    pptSubmittedDate: '2025-01-15T10:30:00Z',
    totalMarks: 88,
    guideMarks: 46,
    panelMarks: 42,
    guide: 'Dr. Anita Sharma',
    panelMember: 'Dr. Rakesh Verma',
    projectTitle: 'AI-Based Student Performance Prediction System',
    teammates: [
      { id: '1', name: 'Rajesh Kumar', regNo: '21BCE1001' },
      { id: '2', name: 'Priya Singh', regNo: '21BCE1002' }
    ]
  },
  {
    id: '4',
    name: 'Sneha Reddy',
    regNo: '21BCE1004',
    email: 'sneha.reddy@vitstudent.ac.in',
    phone: '+91 9876543213',
    pptStatus: 'pending',
    pptSubmittedDate: '2025-02-01T09:00:00Z',
    totalMarks: null,
    guideMarks: null,
    panelMarks: null,
    guide: 'Dr. Suresh Kumar',
    panelMember: 'Dr. Meera Nair',
    projectTitle: 'Blockchain-Based Supply Chain Management',
    teammates: [
      { id: '5', name: 'Vikram Joshi', regNo: '21BCE1005' }
    ]
  },
  {
    id: '5',
    name: 'Vikram Joshi',
    regNo: '21BCE1005',
    email: 'vikram.joshi@vitstudent.ac.in',
    phone: '+91 9876543214',
    pptStatus: 'pending',
    pptSubmittedDate: '2025-02-01T09:00:00Z',
    totalMarks: null,
    guideMarks: null,
    panelMarks: null,
    guide: 'Dr. Suresh Kumar',
    panelMember: 'Dr. Meera Nair',
    projectTitle: 'Blockchain-Based Supply Chain Management',
    teammates: [
      { id: '4', name: 'Sneha Reddy', regNo: '21BCE1004' }
    ]
  },
  {
    id: '6',
    name: 'Kavya Menon',
    regNo: '21BCE1006',
    email: 'kavya.menon@vitstudent.ac.in',
    phone: '+91 9876543215',
    pptStatus: 'rejected',
    pptSubmittedDate: '2025-01-20T14:30:00Z',
    totalMarks: null,
    guideMarks: null,
    panelMarks: null,
    guide: 'Dr. Ramesh Iyer',
    panelMember: 'Dr. Lakshmi Pillai',
    projectTitle: 'IoT-Based Smart Home Automation',
    teammates: []
  },
  {
    id: '7',
    name: 'Arjun Nair',
    regNo: '21BCE1007',
    email: 'arjun.nair@vitstudent.ac.in',
    phone: '+91 9876543216',
    pptStatus: 'not-submitted',
    pptSubmittedDate: null,
    totalMarks: null,
    guideMarks: null,
    panelMarks: null,
    guide: 'Dr. Priya Krishnan',
    panelMember: 'Dr. Arun Kumar',
    projectTitle: null,
    teammates: [
      { id: '8', name: 'Divya Mohan', regNo: '21BCE1008' }
    ]
  },
  {
    id: '8',
    name: 'Divya Mohan',
    regNo: '21BCE1008',
    email: 'divya.mohan@vitstudent.ac.in',
    phone: null,
    pptStatus: 'not-submitted',
    pptSubmittedDate: null,
    totalMarks: null,
    guideMarks: null,
    panelMarks: null,
    guide: 'Dr. Priya Krishnan',
    panelMember: 'Dr. Arun Kumar',
    projectTitle: null,
    teammates: [
      { id: '7', name: 'Arjun Nair', regNo: '21BCE1007' }
    ]
  },
  {
    id: '9',
    name: 'Karthik Subramanian',
    regNo: '21BCE1009',
    email: 'karthik.s@vitstudent.ac.in',
    phone: '+91 9876543217',
    pptStatus: 'approved',
    pptSubmittedDate: '2025-01-18T11:00:00Z',
    totalMarks: 92,
    guideMarks: 48,
    panelMarks: 44,
    guide: 'Dr. Vijay Kumar',
    panelMember: 'Dr. Santhosh Kumar',
    projectTitle: 'Machine Learning for Predictive Maintenance',
    teammates: [
      { id: '10', name: 'Lakshmi Rao', regNo: '21BCE1010' },
      { id: '11', name: 'Manoj Pillai', regNo: '21BCE1011' }
    ]
  },
  {
    id: '10',
    name: 'Lakshmi Rao',
    regNo: '21BCE1010',
    email: 'lakshmi.rao@vitstudent.ac.in',
    phone: '+91 9876543218',
    pptStatus: 'approved',
    pptSubmittedDate: '2025-01-18T11:00:00Z',
    totalMarks: 90,
    guideMarks: 47,
    panelMarks: 43,
    guide: 'Dr. Vijay Kumar',
    panelMember: 'Dr. Santhosh Kumar',
    projectTitle: 'Machine Learning for Predictive Maintenance',
    teammates: [
      { id: '9', name: 'Karthik Subramanian', regNo: '21BCE1009' },
      { id: '11', name: 'Manoj Pillai', regNo: '21BCE1011' }
    ]
  }
];

// Helper function to get students by filters (for mock API)
export const getStudentsByFilters = (filters) => {
  // In a real app, this would filter based on actual academic context
  // For mock, return all students
  return mockStudents;
};

// Helper function to get student by ID (for mock API)
export const getStudentById = (studentId) => {
  return mockStudents.find(s => s.id === studentId);
};

export default {
  mockSchools,
  mockProgrammes,
  mockYears,
  mockSemesters,
  mockStudents,
  getStudentsByFilters,
  getStudentById
};
