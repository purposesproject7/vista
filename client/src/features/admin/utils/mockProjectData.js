// src/features/admin/utils/mockProjectData.js

export const MOCK_PROJECTS = [
  {
    id: 'PRJ-001',
    title: 'Smart Campus Navigation Assistant',
    description:
      'Mobile-first campus navigation with accessibility routes, live crowd hints, and indoor wayfinding.',
    schoolId: '1',
    programId: '1',
    yearId: '2024',
    semesterId: '1',
    department: 'Computer Science',
    guide: {
      employeeID: 'SCOPE-CSE-101',
      name: 'Dr. Anita Sharma'
    },
    team: [
      { regNo: '21BCE1001', name: 'Aarav Kumar' },
      { regNo: '21BCE1002', name: 'Diya Nair' },
      { regNo: '21BCE1003', name: 'Mohammed Faiz' }
    ],
    marksByStudent: {
      '21BCE1001': [
        {
          reviewName: 'Guide Review 1',
          components: [
            { name: 'Action Taken', max: 10, score: 8 },
            { name: 'Module Progress', max: 10, score: 7 },
            { name: 'Quality', max: 10, score: 8 },
            { name: 'Documentation', max: 10, score: 6 }
          ]
        },
        {
          reviewName: 'Guide Review 2',
          components: [
            { name: 'Action Taken', max: 10, score: 9 },
            { name: 'Module Progress', max: 10, score: 8 },
            { name: 'Quality', max: 10, score: 8 },
            { name: 'Documentation', max: 10, score: 7 }
          ]
        },
        {
          reviewName: 'Panel Review',
          components: [
            { name: 'Action Taken', max: 10, score: 8 },
            { name: 'Module Progress', max: 10, score: 8 },
            { name: 'Quality', max: 10, score: 7 },
            { name: 'Documentation', max: 10, score: 7 }
          ]
        }
      ],
      '21BCE1002': [
        {
          reviewName: 'Guide Review 1',
          components: [
            { name: 'Action Taken', max: 10, score: 7 },
            { name: 'Module Progress', max: 10, score: 8 },
            { name: 'Quality', max: 10, score: 7 },
            { name: 'Documentation', max: 10, score: 7 }
          ]
        },
        {
          reviewName: 'Guide Review 2',
          components: [
            { name: 'Action Taken', max: 10, score: 8 },
            { name: 'Module Progress', max: 10, score: 8 },
            { name: 'Quality', max: 10, score: 8 },
            { name: 'Documentation', max: 10, score: 8 }
          ]
        },
        {
          reviewName: 'Panel Review',
          components: [
            { name: 'Action Taken', max: 10, score: 8 },
            { name: 'Module Progress', max: 10, score: 7 },
            { name: 'Quality', max: 10, score: 8 },
            { name: 'Documentation', max: 10, score: 7 }
          ]
        }
      ],
      '21BCE1003': [
        {
          reviewName: 'Guide Review 1',
          components: [
            { name: 'Action Taken', max: 10, score: 8 },
            { name: 'Module Progress', max: 10, score: 6 },
            { name: 'Quality', max: 10, score: 7 },
            { name: 'Documentation', max: 10, score: 6 }
          ]
        },
        {
          reviewName: 'Guide Review 2',
          components: [
            { name: 'Action Taken', max: 10, score: 8 },
            { name: 'Module Progress', max: 10, score: 7 },
            { name: 'Quality', max: 10, score: 7 },
            { name: 'Documentation', max: 10, score: 7 }
          ]
        },
        {
          reviewName: 'Panel Review',
          components: [
            { name: 'Action Taken', max: 10, score: 7 },
            { name: 'Module Progress', max: 10, score: 7 },
            { name: 'Quality', max: 10, score: 7 },
            { name: 'Documentation', max: 10, score: 6 }
          ]
        }
      ]
    }
  },
  {
    id: 'PRJ-002',
    title: 'AI-Assisted Attendance & Alerts',
    description:
      'Automated attendance insights with anomaly alerts and analytics dashboards for coordinators.',
    schoolId: '1',
    programId: '2',
    yearId: '2024',
    semesterId: '1',
    department: 'Information Technology',
    guide: {
      employeeID: 'SCOPE-IT-204',
      name: 'Dr. Rahul Verma'
    },
    team: [
      { regNo: '21BIT1101', name: 'Keerthana S' },
      { regNo: '21BIT1102', name: 'Nikhil Jain' },
      { regNo: '21BIT1103', name: 'Sarah Thomas' },
      { regNo: '21BIT1104', name: 'Vikram Singh' }
    ],
    marksByStudent: {
      '21BIT1101': [
        {
          reviewName: 'Guide Review 1',
          components: [
            { name: 'Action Taken', max: 10, score: 8 },
            { name: 'Module Progress', max: 10, score: 8 },
            { name: 'Quality', max: 10, score: 7 },
            { name: 'Documentation', max: 10, score: 7 }
          ]
        },
        {
          reviewName: 'Panel Review',
          components: [
            { name: 'Action Taken', max: 10, score: 7 },
            { name: 'Module Progress', max: 10, score: 8 },
            { name: 'Quality', max: 10, score: 7 },
            { name: 'Documentation', max: 10, score: 6 }
          ]
        }
      ],
      '21BIT1102': [
        {
          reviewName: 'Guide Review 1',
          components: [
            { name: 'Action Taken', max: 10, score: 7 },
            { name: 'Module Progress', max: 10, score: 7 },
            { name: 'Quality', max: 10, score: 7 },
            { name: 'Documentation', max: 10, score: 8 }
          ]
        },
        {
          reviewName: 'Panel Review',
          components: [
            { name: 'Action Taken', max: 10, score: 8 },
            { name: 'Module Progress', max: 10, score: 7 },
            { name: 'Quality', max: 10, score: 7 },
            { name: 'Documentation', max: 10, score: 7 }
          ]
        }
      ],
      '21BIT1103': [
        {
          reviewName: 'Guide Review 1',
          components: [
            { name: 'Action Taken', max: 10, score: 8 },
            { name: 'Module Progress', max: 10, score: 6 },
            { name: 'Quality', max: 10, score: 7 },
            { name: 'Documentation', max: 10, score: 7 }
          ]
        },
        {
          reviewName: 'Panel Review',
          components: [
            { name: 'Action Taken', max: 10, score: 7 },
            { name: 'Module Progress', max: 10, score: 6 },
            { name: 'Quality', max: 10, score: 7 },
            { name: 'Documentation', max: 10, score: 7 }
          ]
        }
      ],
      '21BIT1104': [
        {
          reviewName: 'Guide Review 1',
          components: [
            { name: 'Action Taken', max: 10, score: 6 },
            { name: 'Module Progress', max: 10, score: 7 },
            { name: 'Quality', max: 10, score: 7 },
            { name: 'Documentation', max: 10, score: 6 }
          ]
        },
        {
          reviewName: 'Panel Review',
          components: [
            { name: 'Action Taken', max: 10, score: 7 },
            { name: 'Module Progress', max: 10, score: 7 },
            { name: 'Quality', max: 10, score: 6 },
            { name: 'Documentation', max: 10, score: 6 }
          ]
        }
      ]
    }
  },
  {
    id: 'PRJ-003',
    title: 'Energy Monitoring for Labs',
    description:
      'IoT energy monitoring with device-level dashboards and automated cost optimization suggestions.',
    schoolId: '2',
    programId: '5',
    yearId: '2025',
    semesterId: '2',
    department: 'Electronics & Communication',
    guide: {
      employeeID: 'SENSE-ECE-311',
      name: 'Dr. Priya Menon'
    },
    team: [
      { regNo: '21BEC2001', name: 'Arjun R' },
      { regNo: '21BEC2002', name: 'Meera Iyer' },
      { regNo: '21BEC2003', name: 'Siddharth K' }
    ],
    marksByStudent: {
      '21BEC2001': [
        {
          reviewName: 'Guide Review 1',
          components: [
            { name: 'Action Taken', max: 10, score: 7 },
            { name: 'Module Progress', max: 10, score: 6 },
            { name: 'Quality', max: 10, score: 7 },
            { name: 'Documentation', max: 10, score: 6 }
          ]
        },
        {
          reviewName: 'Panel Review',
          components: [
            { name: 'Action Taken', max: 10, score: 7 },
            { name: 'Module Progress', max: 10, score: 7 },
            { name: 'Quality', max: 10, score: 7 },
            { name: 'Documentation', max: 10, score: 7 }
          ]
        }
      ],
      '21BEC2002': [
        {
          reviewName: 'Guide Review 1',
          components: [
            { name: 'Action Taken', max: 10, score: 8 },
            { name: 'Module Progress', max: 10, score: 7 },
            { name: 'Quality', max: 10, score: 7 },
            { name: 'Documentation', max: 10, score: 7 }
          ]
        },
        {
          reviewName: 'Panel Review',
          components: [
            { name: 'Action Taken', max: 10, score: 7 },
            { name: 'Module Progress', max: 10, score: 7 },
            { name: 'Quality', max: 10, score: 6 },
            { name: 'Documentation', max: 10, score: 7 }
          ]
        }
      ],
      '21BEC2003': [
        {
          reviewName: 'Guide Review 1',
          components: [
            { name: 'Action Taken', max: 10, score: 7 },
            { name: 'Module Progress', max: 10, score: 7 },
            { name: 'Quality', max: 10, score: 6 },
            { name: 'Documentation', max: 10, score: 6 }
          ]
        },
        {
          reviewName: 'Panel Review',
          components: [
            { name: 'Action Taken', max: 10, score: 8 },
            { name: 'Module Progress', max: 10, score: 7 },
            { name: 'Quality', max: 10, score: 7 },
            { name: 'Documentation', max: 10, score: 6 }
          ]
        }
      ]
    }
  },
  {
    id: 'PRJ-004',
    title: 'Blockchain-based Voting System',
    description:
      'Secure, transparent voting platform using blockchain for campus elections with real-time results.',
    schoolId: '1',
    programId: '1',
    yearId: '2024',
    semesterId: '2',
    department: 'Computer Science',
    guide: {
      employeeID: 'SCOPE-CSE-105',
      name: 'Prof. Rajesh Kumar'
    },
    team: [
      { regNo: '21BCE1201', name: 'Priya Sharma' },
      { regNo: '21BCE1202', name: 'Rahul Gupta' }
    ],
    marksByStudent: {
      '21BCE1201': [
        {
          reviewName: 'Guide Review 1',
          components: [
            { name: 'Action Taken', max: 10, score: 9 },
            { name: 'Module Progress', max: 10, score: 8 },
            { name: 'Quality', max: 10, score: 9 },
            { name: 'Documentation', max: 10, score: 8 }
          ]
        },
        {
          reviewName: 'Panel Review',
          components: [
            { name: 'Action Taken', max: 10, score: 8 },
            { name: 'Module Progress', max: 10, score: 9 },
            { name: 'Quality', max: 10, score: 8 },
            { name: 'Documentation', max: 10, score: 8 }
          ]
        }
      ],
      '21BCE1202': [
        {
          reviewName: 'Guide Review 1',
          components: [
            { name: 'Action Taken', max: 10, score: 8 },
            { name: 'Module Progress', max: 10, score: 7 },
            { name: 'Quality', max: 10, score: 8 },
            { name: 'Documentation', max: 10, score: 7 }
          ]
        },
        {
          reviewName: 'Panel Review',
          components: [
            { name: 'Action Taken', max: 10, score: 9 },
            { name: 'Module Progress', max: 10, score: 8 },
            { name: 'Quality', max: 10, score: 8 },
            { name: 'Documentation', max: 10, score: 7 }
          ]
        }
      ]
    }
  },
  {
    id: 'PRJ-005',
    title: 'Smart Traffic Management',
    description:
      'IoT-based traffic control system with real-time congestion monitoring and route optimization.',
    schoolId: '2',
    programId: '6',
    yearId: '2024',
    semesterId: '1',
    department: 'Electrical Engineering',
    guide: {
      employeeID: 'SENSE-EEE-201',
      name: 'Dr. Suresh Babu'
    },
    team: [
      { regNo: '21BEE1001', name: 'Amit Patel' },
      { regNo: '21BEE1002', name: 'Neha Singh' },
      { regNo: '21BEE1003', name: 'Karan Malhotra' }
    ],
    marksByStudent: {
      '21BEE1001': [
        {
          reviewName: 'Guide Review 1',
          components: [
            { name: 'Action Taken', max: 10, score: 7 },
            { name: 'Module Progress', max: 10, score: 7 },
            { name: 'Quality', max: 10, score: 8 },
            { name: 'Documentation', max: 10, score: 7 }
          ]
        },
        {
          reviewName: 'Guide Review 2',
          components: [
            { name: 'Action Taken', max: 10, score: 8 },
            { name: 'Module Progress', max: 10, score: 8 },
            { name: 'Quality', max: 10, score: 8 },
            { name: 'Documentation', max: 10, score: 7 }
          ]
        }
      ],
      '21BEE1002': [
        {
          reviewName: 'Guide Review 1',
          components: [
            { name: 'Action Taken', max: 10, score: 8 },
            { name: 'Module Progress', max: 10, score: 7 },
            { name: 'Quality', max: 10, score: 7 },
            { name: 'Documentation', max: 10, score: 8 }
          ]
        },
        {
          reviewName: 'Guide Review 2',
          components: [
            { name: 'Action Taken', max: 10, score: 8 },
            { name: 'Module Progress', max: 10, score: 8 },
            { name: 'Quality', max: 10, score: 7 },
            { name: 'Documentation', max: 10, score: 8 }
          ]
        }
      ],
      '21BEE1003': [
        {
          reviewName: 'Guide Review 1',
          components: [
            { name: 'Action Taken', max: 10, score: 6 },
            { name: 'Module Progress', max: 10, score: 7 },
            { name: 'Quality', max: 10, score: 7 },
            { name: 'Documentation', max: 10, score: 6 }
          ]
        },
        {
          reviewName: 'Guide Review 2',
          components: [
            { name: 'Action Taken', max: 10, score: 7 },
            { name: 'Module Progress', max: 10, score: 7 },
            { name: 'Quality', max: 10, score: 7 },
            { name: 'Documentation', max: 10, score: 7 }
          ]
        }
      ]
    }
  },
  {
    id: 'PRJ-006',
    title: 'Drone-based Package Delivery',
    description:
      'Autonomous drone system for last-mile package delivery with GPS tracking and obstacle avoidance.',
    schoolId: '3',
    programId: '10',
    yearId: '2025',
    semesterId: '1',
    department: 'Aerospace Engineering',
    guide: {
      employeeID: 'SELECT-AERO-401',
      name: 'Dr. Venkat Rao'
    },
    team: [
      { regNo: '21BAE3001', name: 'Akash Kumar' },
      { regNo: '21BAE3002', name: 'Divya Reddy' },
      { regNo: '21BAE3003', name: 'Rohan Sharma' },
      { regNo: '21BAE3004', name: 'Sneha Iyer' }
    ],
    marksByStudent: {
      '21BAE3001': [
        {
          reviewName: 'Guide Review 1',
          components: [
            { name: 'Action Taken', max: 10, score: 8 },
            { name: 'Module Progress', max: 10, score: 7 },
            { name: 'Quality', max: 10, score: 8 },
            { name: 'Documentation', max: 10, score: 7 }
          ]
        }
      ],
      '21BAE3002': [
        {
          reviewName: 'Guide Review 1',
          components: [
            { name: 'Action Taken', max: 10, score: 9 },
            { name: 'Module Progress', max: 10, score: 8 },
            { name: 'Quality', max: 10, score: 8 },
            { name: 'Documentation', max: 10, score: 8 }
          ]
        }
      ],
      '21BAE3003': [
        {
          reviewName: 'Guide Review 1',
          components: [
            { name: 'Action Taken', max: 10, score: 7 },
            { name: 'Module Progress', max: 10, score: 7 },
            { name: 'Quality', max: 10, score: 7 },
            { name: 'Documentation', max: 10, score: 6 }
          ]
        }
      ],
      '21BAE3004': [
        {
          reviewName: 'Guide Review 1',
          components: [
            { name: 'Action Taken', max: 10, score: 8 },
            { name: 'Module Progress', max: 10, score: 8 },
            { name: 'Quality', max: 10, score: 7 },
            { name: 'Documentation', max: 10, score: 7 }
          ]
        }
      ]
    }
  },
  {
    id: 'PRJ-007',
    title: 'Financial Analytics Dashboard',
    description:
      'Real-time financial data visualization and predictive analytics for market trend forecasting.',
    schoolId: '4',
    programId: '12',
    yearId: '2024',
    semesterId: '2',
    department: 'Business Analytics',
    guide: {
      employeeID: 'VITBS-MBA-501',
      name: 'Prof. Lakshmi Menon'
    },
    team: [
      { regNo: '21MBA4001', name: 'Aditya Shah' },
      { regNo: '21MBA4002', name: 'Kavya Nair' }
    ],
    marksByStudent: {
      '21MBA4001': [
        {
          reviewName: 'Guide Review 1',
          components: [
            { name: 'Action Taken', max: 10, score: 8 },
            { name: 'Module Progress', max: 10, score: 9 },
            { name: 'Quality', max: 10, score: 8 },
            { name: 'Documentation', max: 10, score: 9 }
          ]
        },
        {
          reviewName: 'Panel Review',
          components: [
            { name: 'Action Taken', max: 10, score: 9 },
            { name: 'Module Progress', max: 10, score: 8 },
            { name: 'Quality', max: 10, score: 9 },
            { name: 'Documentation', max: 10, score: 8 }
          ]
        }
      ],
      '21MBA4002': [
        {
          reviewName: 'Guide Review 1',
          components: [
            { name: 'Action Taken', max: 10, score: 9 },
            { name: 'Module Progress', max: 10, score: 8 },
            { name: 'Quality', max: 10, score: 8 },
            { name: 'Documentation', max: 10, score: 8 }
          ]
        },
        {
          reviewName: 'Panel Review',
          components: [
            { name: 'Action Taken', max: 10, score: 8 },
            { name: 'Module Progress', max: 10, score: 9 },
            { name: 'Quality', max: 10, score: 8 },
            { name: 'Documentation', max: 10, score: 9 }
          ]
        }
      ]
    }
  },
  {
    id: 'PRJ-008',
    title: 'E-Learning Platform with Gamification',
    description:
      'Interactive learning system with progress tracking, achievements, and adaptive content delivery.',
    schoolId: '1',
    programId: '1',
    yearId: '2025',
    semesterId: '1',
    department: 'Computer Science',
    guide: {
      employeeID: 'SCOPE-CSE-110',
      name: 'Dr. Kavitha Ramesh'
    },
    team: [
      { regNo: '21BCE1301', name: 'Harish Kumar' },
      { regNo: '21BCE1302', name: 'Pooja Reddy' },
      { regNo: '21BCE1303', name: 'Sanjay Verma' }
    ],
    marksByStudent: {
      '21BCE1301': [
        {
          reviewName: 'Guide Review 1',
          components: [
            { name: 'Action Taken', max: 10, score: 7 },
            { name: 'Module Progress', max: 10, score: 8 },
            { name: 'Quality', max: 10, score: 7 },
            { name: 'Documentation', max: 10, score: 7 }
          ]
        }
      ],
      '21BCE1302': [
        {
          reviewName: 'Guide Review 1',
          components: [
            { name: 'Action Taken', max: 10, score: 8 },
            { name: 'Module Progress', max: 10, score: 8 },
            { name: 'Quality', max: 10, score: 8 },
            { name: 'Documentation', max: 10, score: 7 }
          ]
        }
      ],
      '21BCE1303': [
        {
          reviewName: 'Guide Review 1',
          components: [
            { name: 'Action Taken', max: 10, score: 7 },
            { name: 'Module Progress', max: 10, score: 7 },
            { name: 'Quality', max: 10, score: 8 },
            { name: 'Documentation', max: 10, score: 7 }
          ]
        }
      ]
    }
  }
];
