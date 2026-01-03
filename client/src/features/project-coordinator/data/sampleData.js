// src/features/project-coordinator/data/sampleData.js
// Sample data that varies by year and semester

export const SAMPLE_PROJECTS_DATA = {
  '2025-1': [ // 2025-26, Winter Semester
    {
      id: 'PROJ2025W001',
      title: 'AI-Based Chatbot System',
      description: 'Developing an intelligent chatbot using NLP techniques for customer support automation',
      guide: { name: 'Dr. Rajesh Kumar', employeeID: 'EMP001' },
      team: [
        { name: 'John Doe', regNo: '24BCE1001' },
        { name: 'Jane Smith', regNo: '24BCE1002' },
        { name: 'Mike Johnson', regNo: '24BCE1003' }
      ],
      status: 'In Progress',
      startDate: '2025-01-15',
      marksByStudent: {
        '24BCE1001': [
          {
            reviewName: 'Mid-Review',
            components: [
              { name: 'Problem Analysis', score: 18, max: 20 },
              { name: 'Design', score: 16, max: 20 },
              { name: 'Presentation', score: 17, max: 20 }
            ]
          }
        ],
        '24BCE1002': [
          {
            reviewName: 'Mid-Review',
            components: [
              { name: 'Problem Analysis', score: 16, max: 20 },
              { name: 'Design', score: 14, max: 20 }
            ]
          }
        ]
      }
    },
    {
      id: 'PROJ2025W002',
      title: 'IoT-Based Smart Home System',
      description: 'Building a smart home automation system using IoT devices and cloud integration',
      guide: { name: 'Dr. Priya Sharma', employeeID: 'EMP002' },
      team: [
        { name: 'Sarah Williams', regNo: '24BCE1004' },
        { name: 'Tom Brown', regNo: '24BCE1005' }
      ],
      status: 'In Progress',
      startDate: '2025-01-20',
      marksByStudent: {
        '24BCE1004': [
          {
            reviewName: 'Mid-Review',
            components: [
              { name: 'Hardware Setup', score: 19, max: 20 },
              { name: 'Software Integration', score: 18, max: 20 }
            ]
          }
        ],
        '24BCE1005': [
          {
            reviewName: 'Mid-Review',
            components: [
              { name: 'Hardware Setup', score: 17, max: 20 }
            ]
          }
        ]
      }
    }
  ],
  '2025-2': [ // 2025-26, Summer Semester
    {
      id: 'PROJ2025S001',
      title: 'Machine Learning Model for Stock Prediction',
      description: 'Creating ML models to predict stock market trends using historical data',
      guide: { name: 'Dr. Amit Patel', employeeID: 'EMP003' },
      team: [
        { name: 'Emma Davis', regNo: '24BCE1006' },
        { name: 'David Lee', regNo: '24BCE1007' },
        { name: 'Lisa Chen', regNo: '24BCE1008' }
      ],
      status: 'In Progress',
      startDate: '2025-05-01',
      marksByStudent: {
        '24BCE1006': [
          {
            reviewName: 'Review 1',
            components: [
              { name: 'Data Collection', score: 19, max: 20 },
              { name: 'Model Development', score: 17, max: 20 }
            ]
          }
        ]
      }
    },
    {
      id: 'PROJ2025S002',
      title: 'Blockchain-Based Supply Chain System',
      description: 'Implementing blockchain technology for transparent supply chain management',
      guide: { name: 'Dr. Neha Singh', employeeID: 'EMP004' },
      team: [
        { name: 'Alex Brown', regNo: '24BCE1009' },
        { name: 'Rachel Green', regNo: '24BCE1010' }
      ],
      status: 'In Progress',
      startDate: '2025-05-15',
      marksByStudent: {}
    }
  ],
  '2024-1': [ // 2024-25, Winter Semester
    {
      id: 'PROJ2024W001',
      title: 'E-Commerce Platform Development',
      description: 'Building a full-stack e-commerce platform with payment integration',
      guide: { name: 'Dr. Vikram Singh', employeeID: 'EMP005' },
      team: [
        { name: 'Michael Chen', regNo: '23BCE1001' },
        { name: 'Jennifer Lopez', regNo: '23BCE1002' },
        { name: 'David Martinez', regNo: '23BCE1003' },
        { name: 'Amanda White', regNo: '23BCE1004' }
      ],
      status: 'Completed',
      startDate: '2024-01-10',
      endDate: '2024-04-20',
      marksByStudent: {
        '23BCE1001': [
          {
            reviewName: 'Mid Review',
            components: [
              { name: 'Backend Development', score: 19, max: 20 },
              { name: 'Database Design', score: 18, max: 20 },
              { name: 'Presentation', score: 19, max: 20 }
            ]
          },
          {
            reviewName: 'Final Review',
            components: [
              { name: 'Testing', score: 18, max: 20 },
              { name: 'Documentation', score: 19, max: 20 },
              { name: 'Final Presentation', score: 20, max: 20 }
            ]
          }
        ],
        '23BCE1002': [
          {
            reviewName: 'Mid Review',
            components: [
              { name: 'Frontend Development', score: 18, max: 20 },
              { name: 'UI/UX Design', score: 17, max: 20 }
            ]
          },
          {
            reviewName: 'Final Review',
            components: [
              { name: 'Feature Implementation', score: 19, max: 20 },
              { name: 'Final Presentation', score: 18, max: 20 }
            ]
          }
        ]
      }
    },
    {
      id: 'PROJ2024W002',
      title: 'Mobile App for Health Tracking',
      description: 'Developing a cross-platform mobile app for fitness and health monitoring',
      guide: { name: 'Dr. Sunita Das', employeeID: 'EMP006' },
      team: [
        { name: 'Kevin Park', regNo: '23BCE1005' },
        { name: 'Nicole Taylor', regNo: '23BCE1006' }
      ],
      status: 'Completed',
      startDate: '2024-01-15',
      endDate: '2024-04-25',
      marksByStudent: {
        '23BCE1005': [
          {
            reviewName: 'Mid Review',
            components: [
              { name: 'App Architecture', score: 19, max: 20 },
              { name: 'Feature Development', score: 18, max: 20 }
            ]
          },
          {
            reviewName: 'Final Review',
            components: [
              { name: 'Testing & Debugging', score: 19, max: 20 },
              { name: 'Final Presentation', score: 19, max: 20 }
            ]
          }
        ]
      }
    }
  ],
  '2024-2': [ // 2024-25, Summer Semester
    {
      id: 'PROJ2024S001',
      title: 'Computer Vision-Based Safety Detection',
      description: 'Using OpenCV and deep learning for workplace safety monitoring',
      guide: { name: 'Dr. Arun Kumar', employeeID: 'EMP007' },
      team: [
        { name: 'Ryan Thompson', regNo: '23BCE1007' },
        { name: 'Maria Garcia', regNo: '23BCE1008' },
        { name: 'John Wilson', regNo: '23BCE1009' }
      ],
      status: 'Completed',
      startDate: '2024-05-01',
      endDate: '2024-08-15',
      marksByStudent: {
        '23BCE1007': [
          {
            reviewName: 'Mid Review',
            components: [
              { name: 'Model Training', score: 20, max: 20 },
              { name: 'Algorithm Implementation', score: 19, max: 20 }
            ]
          },
          {
            reviewName: 'Final Review',
            components: [
              { name: 'Accuracy Testing', score: 20, max: 20 },
              { name: 'Final Presentation', score: 20, max: 20 }
            ]
          }
        ]
      }
    }
  ],
  '2023-1': [ // 2023-24, Winter Semester
    {
      id: 'PROJ2023W001',
      title: 'Social Media Analytics Dashboard',
      description: 'Real-time analytics dashboard for social media data collection and visualization',
      guide: { name: 'Dr. Sanjay Verma', employeeID: 'EMP008' },
      team: [
        { name: 'Alex Rodriguez', regNo: '22BCE1001' },
        { name: 'Catherine Smith', regNo: '22BCE1002' }
      ],
      status: 'Completed',
      startDate: '2023-01-15',
      endDate: '2023-04-30',
      marksByStudent: {}
    }
  ],
  '2023-2': [ // 2023-24, Summer Semester
    {
      id: 'PROJ2023S001',
      title: 'AI-Based Resume Parser',
      description: 'Automated resume parsing and candidate screening system using NLP',
      guide: { name: 'Dr. Ravi Shankar', employeeID: 'EMP009' },
      team: [
        { name: 'Patricia Johnson', regNo: '22BCE1003' },
        { name: 'Daniel Brown', regNo: '22BCE1004' },
        { name: 'Emily Davis', regNo: '22BCE1005' }
      ],
      status: 'Completed',
      startDate: '2023-05-10',
      endDate: '2023-08-20',
      marksByStudent: {}
    }
  ]
};

export const SAMPLE_STUDENTS_DATA = {
  '2025-1': [
    {
      id: 'STU2025W001',
      regNo: '24BCE1001',
      name: 'John Doe',
      email: 'john.doe@vitstudent.ac.in',
      phone: '+91 9876543210',
      guide: 'Dr. Rajesh Kumar',
      guideID: 'EMP001',
      panelMember: 'Dr. Priya Sharma',
      panelMemberID: 'EMP002',
      projectTitle: 'AI-Based Chatbot System',
      projectID: 'PROJ2025W001',
      totalMarks: 85,
      teammates: [
        { id: 'STU2025W002', regNo: '24BCE1002', name: 'Jane Smith' },
        { id: 'STU2025W003', regNo: '24BCE1003', name: 'Mike Johnson' }
      ],
      reviewStatuses: [
        { status: 'approved', faculty: 'Dr. Rajesh Kumar', date: '2025-02-15' },
        { status: 'approved', faculty: 'Dr. Priya Sharma', date: '2025-02-20' },
        { status: 'pending', faculty: 'Dr. Amit Patel', date: null }
      ]
    },
    {
      id: 'STU2025W002',
      regNo: '24BCE1002',
      name: 'Jane Smith',
      email: 'jane.smith@vitstudent.ac.in',
      phone: '+91 9876543211',
      guide: 'Dr. Rajesh Kumar',
      guideID: 'EMP001',
      panelMember: 'Dr. Priya Sharma',
      panelMemberID: 'EMP002',
      projectTitle: 'AI-Based Chatbot System',
      projectID: 'PROJ2025W001',
      totalMarks: 78,
      teammates: [
        { id: 'STU2025W001', regNo: '24BCE1001', name: 'John Doe' },
        { id: 'STU2025W003', regNo: '24BCE1003', name: 'Mike Johnson' }
      ],
      reviewStatuses: [
        { status: 'approved', faculty: 'Dr. Rajesh Kumar', date: '2025-02-15' },
        { status: 'pending', faculty: 'Dr. Priya Sharma', date: null }
      ]
    },
    {
      id: 'STU2025W004',
      regNo: '24BCE1004',
      name: 'Sarah Williams',
      email: 'sarah.williams@vitstudent.ac.in',
      phone: '+91 9876543212',
      guide: 'Dr. Priya Sharma',
      guideID: 'EMP002',
      panelMember: 'Dr. Amit Patel',
      panelMemberID: 'EMP003',
      projectTitle: 'IoT-Based Smart Home System',
      projectID: 'PROJ2025W002',
      totalMarks: 82,
      teammates: [
        { id: 'STU2025W005', regNo: '24BCE1005', name: 'Tom Brown' }
      ],
      reviewStatuses: [
        { status: 'approved', faculty: 'Dr. Priya Sharma', date: '2025-02-18' },
        { status: 'approved', faculty: 'Dr. Amit Patel', date: '2025-02-22' }
      ]
    }
  ],
  '2025-2': [
    {
      id: 'STU2025S001',
      regNo: '24BCE1006',
      name: 'Emma Davis',
      email: 'emma.davis@vitstudent.ac.in',
      phone: '+91 9876543213',
      guide: 'Dr. Amit Patel',
      guideID: 'EMP003',
      panelMember: 'Dr. Neha Singh',
      panelMemberID: 'EMP004',
      projectTitle: 'Machine Learning Model for Stock Prediction',
      projectID: 'PROJ2025S001',
      totalMarks: 88,
      teammates: [
        { id: 'STU2025S002', regNo: '24BCE1007', name: 'David Lee' },
        { id: 'STU2025S003', regNo: '24BCE1008', name: 'Lisa Chen' }
      ],
      reviewStatuses: [
        { status: 'approved', faculty: 'Dr. Amit Patel', date: '2025-06-10' }
      ]
    }
  ],
  '2024-1': [
    {
      id: 'STU2024W001',
      regNo: '23BCE1001',
      name: 'Michael Chen',
      email: 'michael.chen@vitstudent.ac.in',
      phone: '+91 9876543214',
      guide: 'Dr. Vikram Singh',
      guideID: 'EMP005',
      panelMember: 'Dr. Sunita Das',
      panelMemberID: 'EMP006',
      projectTitle: 'E-Commerce Platform Development',
      projectID: 'PROJ2024W001',
      totalMarks: 92,
      teammates: [
        { id: 'STU2024W002', regNo: '23BCE1002', name: 'Jennifer Lopez' },
        { id: 'STU2024W003', regNo: '23BCE1003', name: 'David Martinez' },
        { id: 'STU2024W004', regNo: '23BCE1004', name: 'Amanda White' }
      ],
      reviewStatuses: [
        { status: 'approved', faculty: 'Dr. Vikram Singh', date: '2024-02-20' },
        { status: 'approved', faculty: 'Dr. Sunita Das', date: '2024-04-15' }
      ]
    }
  ],
  '2024-2': [
    {
      id: 'STU2024S001',
      regNo: '23BCE1007',
      name: 'Ryan Thompson',
      email: 'ryan.thompson@vitstudent.ac.in',
      phone: '+91 9876543215',
      guide: 'Dr. Arun Kumar',
      guideID: 'EMP007',
      panelMember: 'Dr. Sanjay Verma',
      panelMemberID: 'EMP008',
      projectTitle: 'Computer Vision-Based Safety Detection',
      projectID: 'PROJ2024S001',
      totalMarks: 90,
      teammates: [
        { id: 'STU2024S002', regNo: '23BCE1008', name: 'Maria Garcia' },
        { id: 'STU2024S003', regNo: '23BCE1009', name: 'John Wilson' }
      ],
      reviewStatuses: [
        { status: 'approved', faculty: 'Dr. Arun Kumar', date: '2024-06-15' },
        { status: 'approved', faculty: 'Dr. Sanjay Verma', date: '2024-08-10' }
      ]
    }
  ]
};

export const SAMPLE_FACULTY_DATA = {
  '2025-1': [
    {
      id: 'FAC001',
      employeeID: 'EMP001',
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh.kumar@vit.ac.in',
      phone: '+91 9876543216',
      qualification: 'Ph.D in Computer Science',
      specialization: 'Artificial Intelligence, Machine Learning',
      experience: 12,
      department: 'Computer Science',
      school: 'SCOPE',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      availability: 'Available',
      projectsGuided: 15,
      panelCount: 8
    },
    {
      id: 'FAC002',
      employeeID: 'EMP002',
      name: 'Dr. Priya Sharma',
      email: 'priya.sharma@vit.ac.in',
      phone: '+91 9876543217',
      qualification: 'Ph.D in Software Engineering',
      specialization: 'Cloud Computing, DevOps',
      experience: 10,
      department: 'Computer Science',
      school: 'SCOPE',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      availability: 'Available',
      projectsGuided: 12,
      panelCount: 10
    },
    {
      id: 'FAC003',
      employeeID: 'EMP003',
      name: 'Dr. Amit Patel',
      email: 'amit.patel@vit.ac.in',
      phone: '+91 9876543218',
      qualification: 'Ph.D in Data Science',
      specialization: 'Big Data, Machine Learning, IoT',
      experience: 9,
      department: 'Computer Science',
      school: 'SCOPE',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      availability: 'Available',
      projectsGuided: 10,
      panelCount: 7
    }
  ],
  '2025-2': [
    {
      id: 'FAC001',
      employeeID: 'EMP001',
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh.kumar@vit.ac.in',
      phone: '+91 9876543216',
      qualification: 'Ph.D in Computer Science',
      specialization: 'Artificial Intelligence, Machine Learning',
      experience: 12,
      department: 'Computer Science',
      school: 'SCOPE',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      availability: 'Available',
      projectsGuided: 16,
      panelCount: 9
    },
    {
      id: 'FAC004',
      employeeID: 'EMP004',
      name: 'Dr. Neha Singh',
      email: 'neha.singh@vit.ac.in',
      phone: '+91 9876543219',
      qualification: 'Ph.D in Blockchain Technology',
      specialization: 'Blockchain, Cybersecurity',
      experience: 8,
      department: 'Computer Science',
      school: 'SCOPE',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      availability: 'Available',
      projectsGuided: 8,
      panelCount: 5
    }
  ],
  '2024-1': [
    {
      id: 'FAC005',
      employeeID: 'EMP005',
      name: 'Dr. Vikram Singh',
      email: 'vikram.singh@vit.ac.in',
      phone: '+91 9876543220',
      qualification: 'Ph.D in Web Technologies',
      specialization: 'Full Stack Development, E-Commerce',
      experience: 14,
      department: 'Computer Science',
      school: 'SCOPE',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      availability: 'Available',
      projectsGuided: 18,
      panelCount: 12
    },
    {
      id: 'FAC006',
      employeeID: 'EMP006',
      name: 'Dr. Sunita Das',
      email: 'sunita.das@vit.ac.in',
      phone: '+91 9876543221',
      qualification: 'Ph.D in Mobile Computing',
      specialization: 'Mobile App Development, Cross-Platform',
      experience: 11,
      department: 'Computer Science',
      school: 'SCOPE',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      availability: 'Available',
      projectsGuided: 14,
      panelCount: 9
    }
  ],
  '2024-2': [
    {
      id: 'FAC007',
      employeeID: 'EMP007',
      name: 'Dr. Arun Kumar',
      email: 'arun.kumar@vit.ac.in',
      phone: '+91 9876543222',
      qualification: 'Ph.D in Computer Vision',
      specialization: 'Image Processing, Deep Learning, Safety Systems',
      experience: 13,
      department: 'Computer Science',
      school: 'SCOPE',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      availability: 'Available',
      projectsGuided: 16,
      panelCount: 11
    }
  ]
};

/**
 * Get filtered data based on year and semester
 * @param {string} year - Academic year (e.g., '2025', '2024')
 * @param {string} semester - Semester (e.g., '1', '2')
 * @param {string} dataType - Type of data ('projects', 'students', 'faculty')
 * @returns {Array} - Filtered data array
 */
export const getFilteredData = (year, semester, dataType) => {
  const key = `${year}-${semester}`;
  
  switch (dataType) {
    case 'projects':
      return SAMPLE_PROJECTS_DATA[key] || [];
    case 'students':
      return SAMPLE_STUDENTS_DATA[key] || [];
    case 'faculty':
      return SAMPLE_FACULTY_DATA[key] || [];
    default:
      return [];
  }
};

/**
 * Get all available years and semesters
 */
export const getAvailableFilters = () => {
  const yearSet = new Set();
  const semesterSet = new Set();
  
  // Extract from projects data
  Object.keys(SAMPLE_PROJECTS_DATA).forEach(key => {
    const [year, semester] = key.split('-');
    yearSet.add(year);
    semesterSet.add(semester);
  });
  
  return {
    years: Array.from(yearSet).sort().reverse(),
    semesters: Array.from(semesterSet).sort()
  };
};
