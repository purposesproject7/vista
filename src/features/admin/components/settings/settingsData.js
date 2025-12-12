// src/features/admin/components/settings/settingsData.js
// Initial/mock data for settings

export const initialSchools = [
  { id: '1', name: 'SCOPE' },
  { id: '2', name: 'SENSE' },
  { id: '3', name: 'SELECT' },
  { id: '4', name: 'VITBS' }
];

export const initialPrograms = {
  '1': [
    { id: '1', name: 'B.Tech CSE' },
    { id: '2', name: 'B.Tech IT' },
    { id: '3', name: 'M.Tech CSE' }
  ],
  '2': [
    { id: '4', name: 'B.Tech ECE' },
    { id: '5', name: 'B.Tech EEE' }
  ],
  '3': [
    { id: '6', name: 'B.Tech Mech' },
    { id: '7', name: 'B.Tech Civil' }
  ],
  '4': [
    { id: '8', name: 'BBA' },
    { id: '9', name: 'MBA' }
  ]
};

export const initialYears = [
  { id: '2025', name: '2025-26' },
  { id: '2024', name: '2024-25' },
  { id: '2023', name: '2023-24' }
];

export const initialSemesters = [
  { id: '1', name: 'Winter Semester' },
  { id: '2', name: 'Summer Semester' }
];

export const initialTeamSettings = {
  // Example configurations (keyed by: schoolId-programId-yearId-semesterId)
  '1-1-2025-1': { // SCOPE - B.Tech CSE - 2025-26 - Winter
    minStudentsPerTeam: 2,
    maxStudentsPerTeam: 4,
    defaultStudentsPerTeam: 3
  },
  '1-1-2025-2': { // SCOPE - B.Tech CSE - 2025-26 - Summer
    minStudentsPerTeam: 1,
    maxStudentsPerTeam: 3,
    defaultStudentsPerTeam: 2
  }
};

export const initialRubrics = [
  {
    id: '1',
    name: 'Review 1 - Project Proposal',
    description: 'Evaluation rubric for initial project proposal review',
    reviewType: 'guide',
    components: [
      {
        name: 'Problem Statement',
        maxMarks: 10,
        levels: [
          { marks: 10, description: 'Excellent - Clear, well-defined problem with strong justification and scope' },
          { marks: 8, description: 'Very Good - Well-defined problem with good justification' },
          { marks: 6, description: 'Good - Problem stated adequately with basic justification' },
          { marks: 4, description: 'Satisfactory - Problem mentioned but lacks clarity or justification' },
          { marks: 2, description: 'Needs Improvement - Vague or poorly defined problem statement' }
        ]
      },
      {
        name: 'Literature Review',
        maxMarks: 20,
        levels: [
          { marks: 20, description: 'Excellent - 20+ citations from peer-reviewed journals, comprehensive coverage' },
          { marks: 16, description: 'Very Good - 15-20 citations, good coverage of recent literature' },
          { marks: 12, description: 'Good - 10-15 citations, adequate literature review' },
          { marks: 8, description: 'Satisfactory - 5-10 citations, basic coverage' },
          { marks: 4, description: 'Needs Improvement - Less than 5 citations or outdated references' }
        ]
      },
      {
        name: 'Methodology',
        maxMarks: 15,
        levels: [
          { marks: 15, description: 'Excellent - Well-structured, detailed methodology with clear justification' },
          { marks: 12, description: 'Very Good - Clear methodology with good level of detail' },
          { marks: 9, description: 'Good - Methodology outlined adequately' },
          { marks: 6, description: 'Satisfactory - Basic methodology mentioned' },
          { marks: 3, description: 'Needs Improvement - Unclear or incomplete methodology' }
        ]
      }
    ]
  }
];
