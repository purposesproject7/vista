// src/shared/utils/mockData.js - REPLACE ENTIRE FILE
export const MOCK_USERS = {
  faculty: {
    id: 'F001',
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh@university.edu',
    role: 'faculty'
  },
  admin: {
    id: 'A001',
    name: 'Admin User',
    email: 'admin@university.edu',
    role: 'admin'
  },
  coordinator: {
    id: 'PC001',
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@university.edu',
    role: 'project_coordinator',
    school: 'SCOPE',
    programme: 'B.Tech CSE',
    department: 'CSE',
    isPrimary: true
  }
};

export const MOCK_MASTER_DATA = {
  academicYears: [
    { year: '2025-26', isActive: true },
    { year: '2024-25', isActive: false }
  ],
  schools: [
    { code: 'SCOPE', name: 'School of Computer Science', isActive: true },
    { code: 'SENSE', name: 'School of Electronics', isActive: true },
    { code: 'SELECT', name: 'School of Electrical', isActive: true }
  ],
  programs: [
    { name: 'B.Tech CSE', isActive: true },
    { name: 'B.Tech ECE', isActive: true },
    { name: 'M.Tech SE', isActive: true }
  ]
};

export const MOCK_REVIEWS = [
  {
    review_id: 'R1',
    review_name: 'Project Proposal Review',
    start_date: '2026-01-01',
    end_date: '2026-01-20',
    review_type: 'guide',
    rubric_structure: [
      {
        rubric_id: 'R1-C1',
        component_name: 'Problem Statement',
        max_marks: 1,
        sub_components: [],
        levels: [
          { 
            score: 5, 
            label: 'Excellent',
            description: 'Clearly and precisely defined; fully addresses the research gap with strong relevance and clarity.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: 'Well defined with minor gaps; generally clear and relevant to the research area.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: 'Stated but lacks clarity or depth; partially addresses the research gap.'
          },
          { 
            score: 2, 
            label: 'Fair',
            description: 'Vaguely stated; unclear relevance or incomplete understanding of the problem.'
          }
        ]
      },
      {
        rubric_id: 'R1-C2',
        component_name: 'Literature Review',
        max_marks: 1,
        sub_components: [],
        levels: [
          { 
            score: 5, 
            label: 'Excellent',
            description: 'Comprehensive review of 10+ high-quality papers from reputed journals/conferences; critically analyzed.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: 'Review includes 10+ relevant papers; good coverage with mostly clear synthesis and some critical insight.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: 'Includes 10+ papers; summary provided but lacks critical analysis or connection to research problem.'
          },
          { 
            score: 2, 
            label: 'Fair',
            description: 'Includes 10+ papers; incomplete review; limited relevance or understanding of topic.'
          }
        ]
      },
      {
        rubric_id: 'R1-C3',
        component_name: 'Research Objectives',
        max_marks: 1,
        sub_components: [],
        levels: [
          { 
            score: 5, 
            label: 'Excellent',
            description: 'Clearly stated, specific, measurable, and aligned with the problem and literature review.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: 'Objectives mostly clear and relevant; some minor vagueness or lack of alignment with problem.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: 'Objectives stated but somewhat broad or vague; partial alignment with problem.'
          },
          { 
            score: 2, 
            label: 'Fair',
            description: 'Objectives unclear, too broad, or only loosely connected to problem or literature.'
          }
        ]
      },
      {
        rubric_id: 'R1-C4',
        component_name: 'Proposed Solution',
        max_marks: 1,
        sub_components: [],
        levels: [
          { 
            score: 5, 
            label: 'Excellent',
            description: 'Innovative, well-justified, and directly addresses the problem; clearly described with rationale.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: 'Solution is appropriate and mostly justified; rationale is mostly clear and relevant.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: 'Solution described but lacks innovation or strong justification; partially related to the problem.'
          },
          { 
            score: 2, 
            label: 'Fair',
            description: 'Solution unclear or weakly justified; limited connection to the problem.'
          }
        ]
      },
      {
        rubric_id: 'R1-C5',
        component_name: 'Dataset Description',
        max_marks: 1,
        sub_components: [],
        levels: [
          { 
            score: 5, 
            label: 'Excellent',
            description: 'Detailed and accurate description of dataset(s); relevance and appropriateness clearly explained.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: 'Dataset description mostly complete; relevance and appropriateness mostly clear.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: 'Basic dataset description; some details missing or relevance not fully explained.'
          },
          { 
            score: 2, 
            label: 'Fair',
            description: 'Dataset description incomplete or unclear; limited explanation of relevance or appropriateness.'
          }
        ]
      }
    ],
    teams: [
      {
        team_id: 'T1',
        team_name: 'Team Alpha',
        marks_entered: false,
        students: [
          { student_id: 'S1', student_name: 'Arjun Patel', roll_no: '21BCE001' },
          { student_id: 'S2', student_name: 'Priya Sharma', roll_no: '21BCE002' },
          { student_id: 'S3', student_name: 'Vikram Singh', roll_no: '21BCE003' }
        ]
      },
      {
        team_id: 'T2',
        team_name: 'Team Beta',
        marks_entered: false,
        students: [
          { student_id: 'S4', student_name: 'Anjali Reddy', roll_no: '21BCE004' },
          { student_id: 'S5', student_name: 'Rahul Kumar', roll_no: '21BCE005' },
          { student_id: 'S6', student_name: 'Neha Gupta', roll_no: '21BCE006' },
          { student_id: 'S7', student_name: 'Karthik Raj', roll_no: '21BCE007' }
        ]
      }
    ]
  },
  {
    review_id: 'R2',
    review_name: 'Mid-Term Progress Review',
    start_date: '2026-01-05',
    end_date: '2026-01-25',
    review_type: 'panel',
    rubric_structure: [
      {
        rubric_id: 'R2-C1',
        component_name: 'Work Completed',
        max_marks: 3,
        sub_components: [],
        levels: [
          { 
            score: 5, 
            label: 'Excellent',
            description: '80-100% of planned work completed; all milestones achieved on time; exceptional progress.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: '60-79% of planned work completed; most milestones achieved; good progress overall.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: '40-59% of planned work completed; some delays but on track; acceptable progress.'
          },
          { 
            score: 2, 
            label: 'Fair',
            description: '20-39% of planned work completed; significant delays; needs improvement.'
          }
        ]
      },
      {
        rubric_id: 'R2-C2',
        component_name: 'Code Quality',
        max_marks: 2,
        sub_components: [],
        levels: [
          { 
            score: 5, 
            label: 'Excellent',
            description: 'Clean, well-documented code; follows best practices; properly structured; maintainable.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: 'Good code quality; minor improvements needed in documentation or structure.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: 'Working code; needs improvement in organization or documentation.'
          },
          { 
            score: 2, 
            label: 'Fair',
            description: 'Code works but poorly organized; minimal documentation; needs refactoring.'
          }
        ]
      },
      {
        rubric_id: 'R2-C3',
        component_name: 'Testing',
        max_marks: 2,
        sub_components: [],
        levels: [
          { 
            score: 5, 
            label: 'Excellent',
            description: 'Comprehensive testing; unit tests written; bugs identified and fixed; test coverage >80%.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: 'Good testing coverage; most bugs identified and fixed; test coverage 60-80%.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: 'Basic testing done; some bugs remain; test coverage 40-60%.'
          },
          { 
            score: 2, 
            label: 'Fair',
            description: 'Limited testing; multiple bugs present; test coverage <40%.'
          }
        ]
      },
      {
        rubric_id: 'R2-C4',
        component_name: 'Documentation',
        max_marks: 2,
        sub_components: [],
        levels: [
          { 
            score: 5, 
            label: 'Excellent',
            description: 'Complete documentation updated; clear explanations; well-organized; includes diagrams.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: 'Most documentation updated; minor sections incomplete; good organization.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: 'Basic documentation present; needs more detail; acceptable organization.'
          },
          { 
            score: 2, 
            label: 'Fair',
            description: 'Minimal documentation; many sections missing; poor organization.'
          }
        ]
      },
      {
        rubric_id: 'R2-C5',
        component_name: 'Team Collaboration',
        max_marks: 1,
        sub_components: [],
        levels: [
          { 
            score: 5, 
            label: 'Excellent',
            description: 'Excellent teamwork; regular meetings; clear communication; equal contribution.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: 'Good teamwork; most members contributing; effective communication.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: 'Adequate teamwork; some communication gaps; uneven contribution.'
          },
          { 
            score: 2, 
            label: 'Fair',
            description: 'Poor teamwork; limited communication; highly uneven contribution.'
          }
        ]
      }
    ],
    teams: [
      {
        team_id: 'T1',
        team_name: 'Team Alpha',
        marks_entered: false,
        students: [
          { student_id: 'S1', student_name: 'Arjun Patel', roll_no: '21BCE001' },
          { student_id: 'S2', student_name: 'Priya Sharma', roll_no: '21BCE002' },
          { student_id: 'S3', student_name: 'Vikram Singh', roll_no: '21BCE003' }
        ]
      },
      {
        team_id: 'T3',
        team_name: 'Team Gamma',
        marks_entered: false,
        students: [
          { student_id: 'S8', student_name: 'Sneha Iyer', roll_no: '21BCE008' },
          { student_id: 'S9', student_name: 'Aditya Menon', roll_no: '21BCE009' }
        ]
      }
    ]
  },
  {
    review_id: 'R3',
    review_name: 'Design Review',
    start_date: '2025-11-10',
    end_date: '2025-11-28',
    review_type: 'guide',
    rubric_structure: [
      {
        rubric_id: 'R3-C1',
        component_name: 'UI/UX Design',
        max_marks: 4,
        sub_components: [],
        levels: [
          { 
            score: 5, 
            label: 'Excellent',
            description: 'Professional, intuitive interface; excellent user experience; modern design; accessibility considered.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: 'Good interface design; mostly intuitive; minor UX improvements needed.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: 'Acceptable design; functional but could be more user-friendly.'
          },
          { 
            score: 2, 
            label: 'Fair',
            description: 'Basic design; usability issues present; needs significant improvement.'
          }
        ]
      },
      {
        rubric_id: 'R3-C2',
        component_name: 'System Architecture',
        max_marks: 3,
        sub_components: [],
        levels: [
          { 
            score: 5, 
            label: 'Excellent',
            description: 'Well-designed architecture; scalable, maintainable; follows design patterns; microservices/modular.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: 'Good architecture; mostly scalable; minor improvements possible.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: 'Acceptable architecture; works but limited scalability.'
          },
          { 
            score: 2, 
            label: 'Fair',
            description: 'Weak architecture; scalability concerns; needs redesign.'
          }
        ]
      },
      {
        rubric_id: 'R3-C3',
        component_name: 'Database Design',
        max_marks: 3,
        sub_components: [],
        levels: [
          { 
            score: 5, 
            label: 'Excellent',
            description: 'Normalized, efficient schema; proper indexing; relationships well-defined; optimized queries.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: 'Good schema design; mostly normalized; minor optimization needed.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: 'Functional schema; some normalization issues; works for current needs.'
          },
          { 
            score: 2, 
            label: 'Fair',
            description: 'Poor schema design; denormalized; inefficient queries.'
          }
        ]
      }
    ],
    teams: [
      {
        team_id: 'T1',
        team_name: 'Team Alpha',
        marks_entered: true,
        students: [
          { student_id: 'S1', student_name: 'Arjun Patel', roll_no: '21BCE001' },
          { student_id: 'S2', student_name: 'Priya Sharma', roll_no: '21BCE002' },
          { student_id: 'S3', student_name: 'Vikram Singh', roll_no: '21BCE003' }
        ]
      },
      {
        team_id: 'T2',
        team_name: 'Team Beta',
        marks_entered: true,
        students: [
          { student_id: 'S4', student_name: 'Anjali Reddy', roll_no: '21BCE004' },
          { student_id: 'S5', student_name: 'Rahul Kumar', roll_no: '21BCE005' }
        ]
      }
    ]
  }
];
