// src/shared/utils/dummyStudentData.js

export const generateDummyStudents = () => [
  {
    id: '1',
    name: 'Rajesh Kumar',
    regNo: '21BCE1001',
    school: 'SCOPE',
    programme: 'B.Tech CSE',
    year: '2024-25',
    email: 'rajesh.kumar@vitstudent.ac.in',
    phone: '+91 9876543210',
    guide: 'Dr. Anita Sharma',
    panelMember: 'Dr. Rakesh Verma',
    projectTitle: 'AI-Based Student Performance Prediction System',
    reviewStatuses: [
      { 
        name: 'Review 1', 
        type: 'guide',
        status: 'approved',
        marks: { actionTaken: 8, moduleProgress: 18, quality: 12, documentation: 7 },
        attendance: 'present',
        locked: false
      },
      { 
        name: 'Review 2', 
        type: 'panel',
        status: 'approved',
        marks: { actionTaken: 9, moduleProgress: 16, quality: 11, documentation: 6 },
        attendance: 'present',
        locked: false
      },
      { name: 'Review 3', type: 'guide', status: 'pending' },
      { name: 'Review 4', type: 'panel', status: 'not-submitted' },
      { name: 'Review 5', type: 'guide', status: 'not-submitted' },
      { name: 'Final Review', type: 'panel', status: 'not-submitted' }
    ],
    teammates: [
      { id: '2', name: 'Priya Singh', regNo: '21BCE1002' },
      { id: '3', name: 'Amit Patel', regNo: '21BCE1003' }
    ]
  },
  {
    id: '2',
    name: 'Priya Singh',
    regNo: '21BCE1002',
    school: 'SCOPE',
    programme: 'B.Tech CSE',
    year: '2024-25',
    email: 'priya.singh@vitstudent.ac.in',
    phone: '+91 9876543211',
    guide: 'Dr. Anita Sharma',
    panelMember: 'Dr. Rakesh Verma',
    projectTitle: 'AI-Based Student Performance Prediction System',
    reviewStatuses: [
      { 
        name: 'Review 1', 
        type: 'guide',
        status: 'approved',
        marks: { actionTaken: 7, moduleProgress: 17, quality: 13, documentation: 8 },
        attendance: 'present',
        locked: false
      },
      { 
        name: 'Review 2', 
        type: 'panel',
        status: 'approved',
        marks: { actionTaken: 8, moduleProgress: 15, quality: 12, documentation: 7 },
        attendance: 'present',
        locked: false
      },
      { name: 'Review 3', type: 'guide', status: 'pending' },
      { name: 'Review 4', type: 'panel', status: 'not-submitted' },
      { name: 'Review 5', type: 'guide', status: 'not-submitted' },
      { name: 'Final Review', type: 'panel', status: 'not-submitted' }
    ],
    teammates: [
      { id: '1', name: 'Rajesh Kumar', regNo: '21BCE1001' },
      { id: '3', name: 'Amit Patel', regNo: '21BCE1003' }
    ]
  },
  {
    id: '3',
    name: 'Amit Patel',
    regNo: '21BCE1003',
    school: 'SCOPE',
    programme: 'B.Tech CSE',
    year: '2024-25',
    email: 'amit.patel@vitstudent.ac.in',
    phone: '+91 9876543212',
    guide: 'Dr. Anita Sharma',
    panelMember: 'Dr. Rakesh Verma',
    projectTitle: 'AI-Based Student Performance Prediction System',
    reviewStatuses: [
      { 
        name: 'Review 1', 
        type: 'guide',
        status: 'approved',
        marks: { actionTaken: 9, moduleProgress: 19, quality: 13, documentation: 9 }
      },
      { 
        name: 'Review 2', 
        type: 'panel',
        status: 'approved',
        marks: { actionTaken: 9, moduleProgress: 17, quality: 14, documentation: 8 }
      },
      { 
        name: 'Review 3', 
        type: 'guide',
        status: 'approved',
        marks: { actionTaken: 10, moduleProgress: 18, quality: 13, documentation: 9 }
      },
      { 
        name: 'Review 4', 
        type: 'panel',
        status: 'approved',
        marks: { actionTaken: 9, moduleProgress: 17, quality: 14, documentation: 10 }
      },
      { 
        name: 'Review 5', 
        type: 'guide',
        status: 'approved',
        marks: { actionTaken: 10, moduleProgress: 19, quality: 15, documentation: 11 }
      },
      { 
        name: 'Final Review', 
        type: 'panel',
        status: 'approved',
        marks: { actionTaken: 10, moduleProgress: 20, quality: 15, documentation: 10 }
      }
    ],
    teammates: [
      { id: '1', name: 'Rajesh Kumar', regNo: '21BCE1001' },
      { id: '2', name: 'Priya Singh', regNo: '21BCE1002' }
    ]
  },
  {
    id: '4',
    name: 'Sneha Reddy',
    regNo: '21BCE1004',
    school: 'SCOPE',
    programme: 'B.Tech IT',
    year: '2024-25',
    email: 'sneha.reddy@vitstudent.ac.in',
    phone: '+91 9876543213',
    guide: 'Dr. Suresh Kumar',
    panelMember: 'Dr. Meera Nair',
    projectTitle: 'Blockchain-Based Supply Chain Management',
    reviewStatuses: [
      { 
        name: 'Review 1', 
        type: 'guide',
        status: 'approved',
        marks: { actionTaken: 8, moduleProgress: 16, quality: 12, documentation: 7 }
      },
      { name: 'Review 2', type: 'panel', status: 'not-submitted' },
      { name: 'Review 3', type: 'guide', status: 'not-submitted' },
      { name: 'Review 4', type: 'panel', status: 'not-submitted' },
      { name: 'Review 5', type: 'guide', status: 'not-submitted' },
      { name: 'Final Review', type: 'panel', status: 'not-submitted' }
    ],
    teammates: [
      { id: '5', name: 'Vikram Joshi', regNo: '21BCE1005' }
    ]
  },
  {
    id: '5',
    name: 'Vikram Joshi',
    regNo: '21BCE1005',
    school: 'SCOPE',
    programme: 'B.Tech IT',
    year: '2024-25',
    email: 'vikram.joshi@vitstudent.ac.in',
    phone: '+91 9876543214',
    guide: 'Dr. Suresh Kumar',
    panelMember: 'Dr. Meera Nair',
    projectTitle: 'Blockchain-Based Supply Chain Management',
    reviewStatuses: [],
    teammates: [
      { id: '4', name: 'Sneha Reddy', regNo: '21BCE1004' }
    ]
  },
  {
    id: '6',
    name: 'Kavya Menon',
    regNo: '21BCE1006',
    school: 'SENSE',
    programme: 'B.Tech ECE',
    year: '2024-25',
    email: 'kavya.menon@vitstudent.ac.in',
    phone: '+91 9876543215',
    guide: 'Dr. Ramesh Iyer',
    panelMember: 'Dr. Lakshmi Pillai',
    projectTitle: 'IoT-Based Smart Home Automation',
    reviewStatuses: [],
    teammates: []
  },
  {
    id: '7',
    name: 'Arjun Nair',
    regNo: '21BCE1007',
    school: 'SENSE',
    programme: 'B.Tech ECE',
    year: '2024-25',
    email: 'arjun.nair@vitstudent.ac.in',
    phone: '+91 9876543216',
    guide: 'Dr. Priya Krishnan',
    panelMember: 'Dr. Arun Kumar',
    projectTitle: 'Smart Energy Management System',
    reviewStatuses: [
      { 
        name: 'Review 1', 
        type: 'guide',
        status: 'rejected',
        marks: { actionTaken: 3, moduleProgress: 8, quality: 5, documentation: 4 },
        attendance: 'absent'
      },
      { name: 'Review 2', type: 'panel', status: 'not-submitted' },
      { name: 'Review 3', type: 'guide', status: 'not-submitted' },
      { name: 'Review 4', type: 'panel', status: 'not-submitted' },
      { name: 'Review 5', type: 'guide', status: 'not-submitted' },
      { name: 'Final Review', type: 'panel', status: 'not-submitted' }
    ],
    teammates: [
      { id: '8', name: 'Divya Mohan', regNo: '21BCE1008' }
    ]
  },
  {
    id: '8',
    name: 'Divya Mohan',
    regNo: '21BCE1008',
    school: 'SENSE',
    programme: 'B.Tech ECE',
    year: '2024-25',
    email: 'divya.mohan@vitstudent.ac.in',
    phone: '+91 9876543217',
    guide: 'Dr. Priya Krishnan',
    panelMember: 'Dr. Arun Kumar',
    projectTitle: 'Smart Energy Management System',
    reviewStatuses: [
      { 
        name: 'Review 1', 
        type: 'guide',
        status: 'approved',
        marks: { actionTaken: 7, moduleProgress: 15, quality: 11, documentation: 7 },
        attendance: 'present'
      },
      { 
        name: 'Review 2', 
        type: 'panel',
        status: 'pending',
        attendance: 'present'
      },
      { name: 'Review 3', type: 'guide', status: 'not-submitted' },
      { name: 'Review 4', type: 'panel', status: 'not-submitted' },
      { name: 'Review 5', type: 'guide', status: 'not-submitted' },
      { name: 'Final Review', type: 'panel', status: 'not-submitted' }
    ],
    teammates: [
      { id: '7', name: 'Arjun Nair', regNo: '21BCE1007' }
    ]
  },
  {
    id: '9',
    name: 'Karthik Subramanian',
    regNo: '21BCE1009',
    school: 'SCOPE',
    programme: 'B.Tech CSE (AI&ML)',
    year: '2024-25',
    email: 'karthik.s@vitstudent.ac.in',
    phone: '+91 9876543218',
    guide: 'Dr. Vijay Kumar',
    panelMember: 'Dr. Santhosh Kumar',
    projectTitle: 'Machine Learning for Predictive Maintenance',
    reviewStatuses: [
      { 
        name: 'Review 1', 
        type: 'guide',
        status: 'approved',
        marks: { actionTaken: 9, moduleProgress: 19, quality: 14, documentation: 9 }
      },
      { 
        name: 'Review 2', 
        type: 'panel',
        status: 'approved',
        marks: { actionTaken: 10, moduleProgress: 18, quality: 13, documentation: 8 }
      },
      { 
        name: 'Review 3', 
        type: 'guide',
        status: 'approved',
        marks: { actionTaken: 9, moduleProgress: 19, quality: 14, documentation: 10 }
      },
      { 
        name: 'Review 4', 
        type: 'panel',
        status: 'approved',
        marks: { actionTaken: 10, moduleProgress: 18, quality: 14, documentation: 9 }
      },
      { name: 'Review 5', type: 'guide', status: 'pending', attendance: 'present' },
      { name: 'Final Review', type: 'panel', status: 'not-submitted' }
    ],
    teammates: [
      { id: '10', name: 'Lakshmi Rao', regNo: '21BCE1010' }
    ]
  },
  {
    id: '10',
    name: 'Lakshmi Rao',
    regNo: '21BCE1010',
    school: 'SCOPE',
    programme: 'B.Tech CSE (AI&ML)',
    year: '2024-25',
    email: 'lakshmi.rao@vitstudent.ac.in',
    phone: '+91 9876543219',
    guide: 'Dr. Vijay Kumar',
    panelMember: 'Dr. Santhosh Kumar',
    projectTitle: 'Machine Learning for Predictive Maintenance',
    reviewStatuses: [
      { 
        name: 'Review 1', 
        type: 'guide',
        status: 'approved',
        marks: { actionTaken: 9, moduleProgress: 18, quality: 13, documentation: 8 },
        attendance: 'present',
        locked: false
      },
      { 
        name: 'Review 2', 
        type: 'panel',
        status: 'approved',
        marks: { actionTaken: 9, moduleProgress: 17, quality: 14, documentation: 9 },
        attendance: 'present',
        locked: false
      },
      { 
        name: 'Review 3', 
        type: 'guide',
        status: 'approved',
        marks: { actionTaken: 10, moduleProgress: 19, quality: 14, documentation: 9 },
        attendance: 'present',
        locked: false
      },
      { 
        name: 'Review 4', 
        type: 'panel',
        status: 'approved',
        marks: { actionTaken: 9, moduleProgress: 18, quality: 15, documentation: 10 },
        attendance: 'present',
        locked: false
      },
      { 
        name: 'Review 5', 
        type: 'guide',
        status: 'approved',
        marks: { actionTaken: 10, moduleProgress: 19, quality: 14, documentation: 10 },
        attendance: 'present',
        locked: false
      },
      { 
        name: 'Final Review', 
        type: 'panel',
        status: 'approved',
        marks: { actionTaken: 10, moduleProgress: 20, quality: 15, documentation: 10 },
        attendance: 'present',
        locked: false
      }
    ],
    teammates: [
      { id: '9', name: 'Karthik Subramanian', regNo: '21BCE1009' }
    ]
  }
];
