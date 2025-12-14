// src/features/admin/components/faculty-management/facultyData.js
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
  },
  {
    id: 'F006',
    name: 'Dr. Meera Nair',
    email: 'meera.nair@university.edu',
    phone: '+91 9876543215',
    schoolId: 2, // SENSE
    programId: 3, // B.Tech ECE
    yearId: 2024, // 2024-25
    semesterId: 2, // Summer Semester
    school: 'SENSE',
    program: 'B.Tech ECE',
    year: '2024-25',
    semester: 'Summer Semester',
    department: 'Electronics',
    designation: 'Assistant Professor',
    specialization: 'VLSI Design, Microelectronics',
    projects: []
  },
  {
    id: 'F007',
    name: 'Dr. Rakesh Verma',
    email: 'rakesh.verma@university.edu',
    phone: '+91 9876543216',
    schoolId: 1, // SCOPE
    programId: 1, // B.Tech CSE
    yearId: 2024, // 2024-25
    semesterId: 1, // Winter Semester
    school: 'SCOPE',
    program: 'B.Tech CSE',
    year: '2024-25',
    semester: 'Winter Semester',
    department: 'Computer Science',
    designation: 'Senior Lecturer',
    specialization: 'Computer Networks, Cybersecurity',
    projects: [
      {
        id: 'P009',
        title: 'Network Security Enhancement System',
        studentName: 'Amit Patel',
        studentRegNo: '21BCE1003',
        role: 'panel'
      }
    ]
  },
  {
    id: 'F008',
    name: 'Dr. Priya Krishnan',
    email: 'priya.krishnan@university.edu',
    phone: '+91 9876543217',
    schoolId: 3, // SELECT
    programId: 4, // B.Tech Mech
    yearId: 2024, // 2024-25
    semesterId: 1, // Winter Semester
    school: 'SELECT',
    program: 'B.Tech Mech',
    year: '2024-25',
    semester: 'Winter Semester',
    department: 'Mechanical',
    designation: 'Associate Professor',
    specialization: 'Renewable Energy, Thermodynamics',
    projects: [
      {
        id: 'P010',
        title: 'Renewable Energy System Optimization',
        studentName: 'Divya Mohan',
        studentRegNo: '21BCE1008',
        role: 'guide'
      }
    ]
  },
  {
    id: 'F009',
    name: 'Dr. Arun Kumar',
    email: 'arun.kumar@university.edu',
    phone: '+91 9876543218',
    schoolId: 3, // SELECT
    programId: 4, // B.Tech Mech
    yearId: 2025, // 2025-26
    semesterId: 1, // Winter Semester
    school: 'SELECT',
    program: 'B.Tech Mech',
    year: '2025-26',
    semester: 'Winter Semester',
    department: 'Mechanical',
    designation: 'Professor',
    specialization: 'Manufacturing, Automation',
    projects: []
  },
  {
    id: 'F010',
    name: 'Dr. Santhosh Kumar',
    email: 'santhosh.kumar@university.edu',
    phone: '+91 9876543219',
    schoolId: 4, // VITBS
    programId: 5, // MBA
    yearId: 2024, // 2024-25
    semesterId: 1, // Winter Semester
    school: 'VITBS',
    program: 'MBA',
    year: '2024-25',
    semester: 'Winter Semester',
    department: 'Business',
    designation: 'Associate Professor',
    specialization: 'Marketing, Business Strategy',
    projects: [
      {
        id: 'P011',
        title: 'Digital Marketing Strategy Platform',
        studentName: 'Ananya Iyer',
        studentRegNo: '21MBA1001',
        role: 'guide'
      }
    ]
  },
  // Additional faculty for different academic contexts
  {
    id: 'F011',
    name: 'Dr. Kavita Deshmukh',
    email: 'kavita.deshmukh@university.edu',
    phone: '+91 9876543220',
    schoolId: 1, // SCOPE
    programId: 1, // B.Tech CSE
    yearId: 2025, // 2025-26
    semesterId: 1, // Winter Semester
    school: 'SCOPE',
    program: 'B.Tech CSE',
    year: '2025-26',
    semester: 'Winter Semester',
    department: 'Computer Science',
    designation: 'Assistant Professor',
    specialization: 'Cloud Computing, DevOps',
    projects: [
      {
        id: 'P012',
        title: 'Cloud-Based Healthcare Management System',
        studentName: 'Rohit Sharma',
        studentRegNo: '22BCE2001',
        role: 'guide'
      },
      {
        id: 'P013',
        title: 'Microservices Architecture for E-Commerce',
        studentName: 'Neha Gupta',
        studentRegNo: '22BCE2002',
        role: 'guide'
      }
    ]
  },
  {
    id: 'F012',
    name: 'Dr. Manish Joshi',
    email: 'manish.joshi@university.edu',
    phone: '+91 9876543221',
    schoolId: 1, // SCOPE
    programId: 2, // B.Tech IT
    yearId: 2025, // 2025-26
    semesterId: 1, // Winter Semester
    school: 'SCOPE',
    program: 'B.Tech IT',
    year: '2025-26',
    semester: 'Winter Semester',
    department: 'Information Technology',
    designation: 'Professor',
    specialization: 'Database Systems, Big Data Analytics',
    projects: [
      {
        id: 'P014',
        title: 'Real-time Analytics Dashboard',
        studentName: 'Sanjay Patel',
        studentRegNo: '22BIT2001',
        role: 'guide'
      }
    ]
  },
  {
    id: 'F013',
    name: 'Dr. Deepa Nair',
    email: 'deepa.nair@university.edu',
    phone: '+91 9876543222',
    schoolId: 2, // SENSE
    programId: 3, // B.Tech ECE
    yearId: 2025, // 2025-26
    semesterId: 1, // Winter Semester
    school: 'SENSE',
    program: 'B.Tech ECE',
    year: '2025-26',
    semester: 'Winter Semester',
    department: 'Electronics',
    designation: 'Associate Professor',
    specialization: 'Embedded Systems, IoT',
    projects: [
      {
        id: 'P015',
        title: 'Smart City Infrastructure Monitoring',
        studentName: 'Arjun Reddy',
        studentRegNo: '22BEC2001',
        role: 'guide'
      },
      {
        id: 'P016',
        title: 'Wearable Health Monitoring Device',
        studentName: 'Pooja Menon',
        studentRegNo: '22BEC2002',
        role: 'panel'
      }
    ]
  },
  {
    id: 'F014',
    name: 'Dr. Rajesh Pillai',
    email: 'rajesh.pillai@university.edu',
    phone: '+91 9876543223',
    schoolId: 1, // SCOPE
    programId: 1, // B.Tech CSE
    yearId: 2024, // 2024-25
    semesterId: 2, // Summer Semester
    school: 'SCOPE',
    program: 'B.Tech CSE',
    year: '2024-25',
    semester: 'Summer Semester',
    department: 'Computer Science',
    designation: 'Senior Lecturer',
    specialization: 'Software Engineering, Agile Methodologies',
    projects: [
      {
        id: 'P017',
        title: 'Automated Testing Framework',
        studentName: 'Kiran Kumar',
        studentRegNo: '21BCE1015',
        role: 'guide'
      }
    ]
  },
  {
    id: 'F015',
    name: 'Dr. Sunita Rao',
    email: 'sunita.rao@university.edu',
    phone: '+91 9876543224',
    schoolId: 3, // SELECT
    programId: 4, // B.Tech Mech
    yearId: 2024, // 2024-25
    semesterId: 2, // Summer Semester
    school: 'SELECT',
    program: 'B.Tech Mech',
    year: '2024-25',
    semester: 'Summer Semester',
    department: 'Mechanical',
    designation: 'Professor',
    specialization: 'Robotics, Automation',
    projects: [
      {
        id: 'P018',
        title: 'Autonomous Warehouse Robot',
        studentName: 'Varun Singh',
        studentRegNo: '21BME1001',
        role: 'guide'
      },
      {
        id: 'P019',
        title: 'Industrial Robot Arm Controller',
        studentName: 'Anjali Sharma',
        studentRegNo: '21BME1002',
        role: 'guide'
      },
      {
        id: 'P020',
        title: 'Smart Manufacturing System',
        studentName: 'Rahul Verma',
        studentRegNo: '21BME1003',
        role: 'panel'
      }
    ]
  },
  {
    id: 'F016',
    name: 'Dr. Amit Chopra',
    email: 'amit.chopra@university.edu',
    phone: '+91 9876543225',
    schoolId: 4, // VITBS
    programId: 5, // MBA
    yearId: 2025, // 2025-26
    semesterId: 1, // Winter Semester
    school: 'VITBS',
    program: 'MBA',
    year: '2025-26',
    semester: 'Winter Semester',
    department: 'Business',
    designation: 'Professor',
    specialization: 'Finance, Investment Banking',
    projects: [
      {
        id: 'P021',
        title: 'Portfolio Risk Management System',
        studentName: 'Priyanka Jain',
        studentRegNo: '22MBA2001',
        role: 'guide'
      }
    ]
  },
  {
    id: 'F017',
    name: 'Dr. Neelam Saxena',
    email: 'neelam.saxena@university.edu',
    phone: '+91 9876543226',
    schoolId: 2, // SENSE
    programId: 3, // B.Tech ECE
    yearId: 2024, // 2024-25
    semesterId: 2, // Summer Semester
    school: 'SENSE',
    program: 'B.Tech ECE',
    year: '2024-25',
    semester: 'Summer Semester',
    department: 'Electronics',
    designation: 'Assistant Professor',
    specialization: 'Wireless Communication, 5G Technology',
    projects: []
  },
  {
    id: 'F018',
    name: 'Dr. Vishal Mehta',
    email: 'vishal.mehta@university.edu',
    phone: '+91 9876543227',
    schoolId: 1, // SCOPE
    programId: 1, // B.Tech CSE
    yearId: 2025, // 2025-26
    semesterId: 2, // Summer Semester
    school: 'SCOPE',
    program: 'B.Tech CSE',
    year: '2025-26',
    semester: 'Summer Semester',
    department: 'Computer Science',
    designation: 'Associate Professor',
    specialization: 'Computer Vision, Image Processing',
    projects: [
      {
        id: 'P022',
        title: 'Face Recognition Attendance System',
        studentName: 'Sneha Reddy',
        studentRegNo: '22BCE2010',
        role: 'guide'
      },
      {
        id: 'P023',
        title: 'Object Detection for Autonomous Vehicles',
        studentName: 'Karthik Mohan',
        studentRegNo: '22BCE2011',
        role: 'panel'
      }
    ]
  }
];

