// src/features/project-coordinator/components/faculty-management/facultyData.js
// Mock faculty data with projects

export const INITIAL_FACULTY = [
  {
    id: 'F001',
    name: 'Dr. Anita Sharma',
    email: 'anita.sharma@university.edu',
    phone: '+91 9876543210',
    schoolId: 1, // SCOPE
    programId: 1, // B.Tech CSE
    yearId: 2024, // 2024-25
    semesterId: 1, // Winter Semester
    school: 'SCOPE',
    program: 'B.Tech CSE',
    year: '2024-25',
    semester: 'Winter Semester',
    department: 'Computer Science',
    designation: 'Professor',
    specialization: 'Artificial Intelligence, Machine Learning',
    projects: [
      {
        id: 'P001',
        title: 'AI-Based Student Performance Prediction System',
        studentName: 'Rajesh Kumar',
        studentRegNo: '21BCE1001',
        role: 'guide'
      },
      {
        id: 'P002',
        title: 'AI-Based Student Performance Prediction System',
        studentName: 'Priya Singh',
        studentRegNo: '21BCE1002',
        role: 'guide'
      },
      {
        id: 'P003',
        title: 'Machine Learning for Stock Prediction',
        studentName: 'Vikram Singh',
        studentRegNo: '21BCE1009',
        role: 'panel'
      }
    ]
  },
  {
    id: 'F002',
    name: 'Dr. Suresh Kumar',
    email: 'suresh.kumar@university.edu',
    phone: '+91 9876543211',
    schoolId: 1, // SCOPE
    programId: 1, // B.Tech CSE
    yearId: 2024, // 2024-25
    semesterId: 2, // Summer Semester
    school: 'SCOPE',
    program: 'B.Tech CSE',
    year: '2024-25',
    semester: 'Summer Semester',
    department: 'Computer Science',
    designation: 'Associate Professor',
    specialization: 'Blockchain Technology, Distributed Systems',
    projects: [
      {
        id: 'P004',
        title: 'Blockchain-Based Supply Chain Management',
        studentName: 'Sneha Reddy',
        studentRegNo: '21BCE1004',
        role: 'guide'
      }
    ]
  },
  {
    id: 'F003',
    name: 'Dr. Ramesh Iyer',
    email: 'ramesh.iyer@university.edu',
    phone: '+91 9876543212',
    schoolId: 1, // SCOPE
    programId: 2, // B.Tech IT
    yearId: 2024, // 2024-25
    semesterId: 1, // Winter Semester
    school: 'SCOPE',
    program: 'B.Tech IT',
    year: '2024-25',
    semester: 'Winter Semester',
    department: 'Computer Science',
    designation: 'Assistant Professor',
    specialization: 'Internet of Things, Embedded Systems',
    projects: [
      {
        id: 'P005',
        title: 'IoT-Based Smart Home Automation',
        studentName: 'Kavya Menon',
        studentRegNo: '21BCE1006',
        role: 'guide'
      }
    ]
  },
  {
    id: 'F004',
    name: 'Dr. Vijay Kumar',
    email: 'vijay.kumar@university.edu',
    phone: '+91 9876543213',
    schoolId: 1, // SCOPE
    programId: 1, // B.Tech CSE
    yearId: 2024, // 2024-25
    semesterId: 1, // Winter Semester
    school: 'SCOPE',
    program: 'B.Tech CSE',
    year: '2024-25',
    semester: 'Winter Semester',
    department: 'Computer Science',
    designation: 'Professor',
    specialization: 'Data Science, Predictive Analytics',
    projects: [
      {
        id: 'P006',
        title: 'Machine Learning for Predictive Maintenance',
        studentName: 'Karthik Subramanian',
        studentRegNo: '21BCE1009',
        role: 'guide'
      },
      {
        id: 'P007',
        title: 'Deep Learning for Medical Image Analysis',
        studentName: 'Manoj Pillai',
        studentRegNo: '21BCE1011',
        role: 'guide'
      }
    ]
  },
  {
    id: 'F005',
    name: 'Dr. Lakshmi Pillai',
    email: 'lakshmi.pillai@university.edu',
    phone: '+91 9876543214',
    schoolId: 2, // SENSE
    programId: 3, // B.Tech ECE
    yearId: 2024, // 2024-25
    semesterId: 1, // Winter Semester
    school: 'SENSE',
    program: 'B.Tech ECE',
    year: '2024-25',
    semester: 'Winter Semester',
    department: 'Electronics',
    designation: 'Associate Professor',
    specialization: 'Signal Processing, Communication Systems',
    projects: [
      {
        id: 'P008',
        title: 'Advanced Signal Processing Techniques',
        studentName: 'Arjun Nair',
        studentRegNo: '21BCE1007',
        role: 'guide'
      }
    ]
  }
];
