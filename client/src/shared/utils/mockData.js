// src/shared/utils/mockData.js
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

export const MOCK_REVIEWS = [
  {
    review_id: 'R1',
    review_name: 'Review 1 - Proposal Defense',
    start_date: '2026-01-08',
    end_date: '2026-01-20',
    review_type: 'guide',
    rubric_structure: [
      {
        rubric_id: 'R1-C1',
        component_name: 'Problem Definition',
        component_description: 'Clear articulation of the problem statement, research gap, and objectives',
        max_marks: 20,
        sub_components: [
          {
            sub_id: 'R1-C1-S1',
            name: 'Problem Statement',
            description: 'Clarity and precision in defining the problem',
            max_marks: 8
          },
          {
            sub_id: 'R1-C1-S2',
            name: 'Research Gap',
            description: 'Identification of gaps in existing literature',
            max_marks: 7
          },
          {
            sub_id: 'R1-C1-S3',
            name: 'Objectives',
            description: 'Clear, measurable research objectives',
            max_marks: 5
          }
        ],
        levels: [
          { 
            score: 5, 
            label: 'Outstanding',
            description: 'Problem clearly defined with excellent understanding; research gap well-identified; objectives SMART and aligned.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: 'Problem well defined with good understanding; research gap identified; objectives clear and mostly measurable.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: 'Problem defined but lacks depth; research gap mentioned but not thoroughly explored; objectives stated.'
          },
          { 
            score: 2, 
            label: 'Satisfactory',
            description: 'Problem vaguely stated; research gap unclear; objectives broad or not well-defined.'
          },
          { 
            score: 1, 
            label: 'Needs Improvement',
            description: 'Problem poorly defined; no clear research gap; objectives missing or unclear.'
          }
        ]
      },
      {
        rubric_id: 'R1-C2',
        component_name: 'Literature Review',
        component_description: 'Comprehensive analysis of existing research and related work',
        max_marks: 20,
        sub_components: [
          {
            sub_id: 'R1-C2-S1',
            name: 'Coverage',
            description: 'Breadth and depth of literature covered (minimum 10 papers)',
            max_marks: 8
          },
          {
            sub_id: 'R1-C2-S2',
            name: 'Critical Analysis',
            description: 'Quality of analysis and synthesis of literature',
            max_marks: 7
          },
          {
            sub_id: 'R1-C2-S3',
            name: 'Relevance',
            description: 'Connection to research problem and objectives',
            max_marks: 5
          }
        ],
        levels: [
          { 
            score: 5, 
            label: 'Outstanding',
            description: '10+ high-quality papers; excellent critical analysis; perfectly aligned with problem; well-synthesized.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: '10+ relevant papers; good analysis with some critical insights; mostly aligned with problem.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: '10+ papers included; basic summary provided; somewhat connected to problem.'
          },
          { 
            score: 2, 
            label: 'Satisfactory',
            description: 'Fewer than 10 papers or low quality; limited analysis; weak connection to problem.'
          },
          { 
            score: 1, 
            label: 'Needs Improvement',
            description: 'Insufficient papers; poor quality; no analysis; disconnected from problem.'
          }
        ]
      },
      {
        rubric_id: 'R1-C3',
        component_name: 'Proposed Methodology',
        component_description: 'Detailed approach, algorithms, and implementation strategy',
        max_marks: 25,
        sub_components: [
          {
            sub_id: 'R1-C3-S1',
            name: 'Approach Design',
            description: 'Clarity and innovation in the proposed solution',
            max_marks: 10
          },
          {
            sub_id: 'R1-C3-S2',
            name: 'Technical Feasibility',
            description: 'Practicality and achievability of the approach',
            max_marks: 8
          },
          {
            sub_id: 'R1-C3-S3',
            name: 'Tools & Technologies',
            description: 'Appropriate selection and justification of tools',
            max_marks: 7
          }
        ],
        levels: [
          { 
            score: 5, 
            label: 'Outstanding',
            description: 'Innovative, well-justified approach; highly feasible; excellent tool selection; clear implementation plan.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: 'Good approach with clear methodology; feasible with minor concerns; appropriate tools selected.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: 'Acceptable approach; somewhat feasible; tools selected but justification lacking.'
          },
          { 
            score: 2, 
            label: 'Satisfactory',
            description: 'Basic approach; feasibility concerns; tool selection questionable.'
          },
          { 
            score: 1, 
            label: 'Needs Improvement',
            description: 'Unclear approach; not feasible; poor tool selection; no implementation plan.'
          }
        ]
      },
      {
        rubric_id: 'R1-C4',
        component_name: 'Dataset & Resources',
        component_description: 'Data sources, dataset characteristics, and resource requirements',
        max_marks: 15,
        sub_components: [
          {
            sub_id: 'R1-C4-S1',
            name: 'Dataset Description',
            description: 'Completeness of dataset details and characteristics',
            max_marks: 7
          },
          {
            sub_id: 'R1-C4-S2',
            name: 'Data Availability',
            description: 'Accessibility and reliability of data sources',
            max_marks: 5
          },
          {
            sub_id: 'R1-C4-S3',
            name: 'Resource Planning',
            description: 'Identification of hardware/software requirements',
            max_marks: 3
          }
        ],
        levels: [
          { 
            score: 5, 
            label: 'Outstanding',
            description: 'Detailed dataset description; readily available; well-planned resources; ethical considerations addressed.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: 'Good dataset description; accessible; resources mostly identified.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: 'Basic dataset info; availability confirmed; minimal resource planning.'
          },
          { 
            score: 2, 
            label: 'Satisfactory',
            description: 'Incomplete dataset info; availability uncertain; poor resource planning.'
          },
          { 
            score: 1, 
            label: 'Needs Improvement',
            description: 'No clear dataset; availability issues; no resource planning.'
          }
        ]
      },
      {
        rubric_id: 'R1-C5',
        component_name: 'Presentation & Communication',
        component_description: 'Quality of presentation, clarity, and ability to answer questions',
        max_marks: 20,
        sub_components: [
          {
            sub_id: 'R1-C5-S1',
            name: 'Slide Quality',
            description: 'Visual appeal, organization, and content clarity',
            max_marks: 7
          },
          {
            sub_id: 'R1-C5-S2',
            name: 'Oral Communication',
            description: 'Delivery, confidence, and time management',
            max_marks: 8
          },
          {
            sub_id: 'R1-C5-S3',
            name: 'Q&A Handling',
            description: 'Understanding and response to questions',
            max_marks: 5
          }
        ],
        levels: [
          { 
            score: 5, 
            label: 'Outstanding',
            description: 'Excellent slides; confident delivery; answered all questions comprehensively; within time limit.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: 'Good slides; clear delivery; answered most questions well; minor timing issues.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: 'Acceptable slides; adequate delivery; answered some questions; timing concerns.'
          },
          { 
            score: 2, 
            label: 'Satisfactory',
            description: 'Basic slides; unclear delivery; struggled with questions; poor time management.'
          },
          { 
            score: 1, 
            label: 'Needs Improvement',
            description: 'Poor slides; weak delivery; unable to answer questions; exceeded time.'
          }
        ]
      }
    ],
    teams: [
      {
        team_id: 'T1',
        team_name: 'Team Alpha - AI Medical Diagnosis',
        project_title: 'AI-Powered Early Disease Detection System',
        marks_entered: false,
        students: [
          { 
            student_id: 'S1', 
            student_name: 'Arjun Patel', 
            roll_no: '21BCE001',
            profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun'
          },
          { 
            student_id: 'S2', 
            student_name: 'Priya Sharma', 
            roll_no: '21BCE002',
            profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya'
          },
          { 
            student_id: 'S3', 
            student_name: 'Vikram Singh', 
            roll_no: '21BCE003',
            profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram'
          }
        ]
      },
      {
        team_id: 'T2',
        team_name: 'Team Beta - Smart IoT',
        project_title: 'IoT-Based Smart Home Automation System',
        marks_entered: false,
        students: [
          { 
            student_id: 'S4', 
            student_name: 'Anjali Reddy', 
            roll_no: '21BCE004',
            profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali'
          },
          { 
            student_id: 'S5', 
            student_name: 'Rahul Kumar', 
            roll_no: '21BCE005',
            profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul'
          },
          { 
            student_id: 'S6', 
            student_name: 'Neha Gupta', 
            roll_no: '21BCE006',
            profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Neha'
          },
          { 
            student_id: 'S7', 
            student_name: 'Karthik Raj', 
            roll_no: '21BCE007',
            profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karthik'
          }
        ]
      },
      {
        team_id: 'T5',
        team_name: 'Team Epsilon - Blockchain',
        project_title: 'Decentralized Supply Chain Management',
        marks_entered: false,
        students: [
          { 
            student_id: 'S10', 
            student_name: 'Meera Nair', 
            roll_no: '21BCE010',
            profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Meera'
          },
          { 
            student_id: 'S11', 
            student_name: 'Rohan Das', 
            roll_no: '21BCE011',
            profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan'
          }
        ]
      }
    ]
  },
  {
    review_id: 'R2',
    review_name: 'Review 2 - Mid-Term Progress',
    start_date: '2026-01-02',
    end_date: '2026-01-15',
    review_type: 'guide',
    rubric_structure: [
      {
        rubric_id: 'R2-C1',
        component_name: 'Work Completion',
        component_description: 'Progress against planned timeline and milestones',
        max_marks: 25,
        sub_components: [
          {
            sub_id: 'R2-C1-S1',
            name: 'Milestone Achievement',
            description: 'Percentage of planned milestones completed',
            max_marks: 12
          },
          {
            sub_id: 'R2-C1-S2',
            name: 'Timeline Adherence',
            description: 'Following the project schedule',
            max_marks: 8
          },
          {
            sub_id: 'R2-C1-S3',
            name: 'Work Quality',
            description: 'Quality of work completed so far',
            max_marks: 5
          }
        ],
        levels: [
          { 
            score: 5, 
            label: 'Outstanding',
            description: '80-100% milestones completed on time; exceptional progress; high-quality deliverables.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: '60-79% milestones achieved; good progress; minor delays; quality work.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: '40-59% milestones completed; acceptable progress; some delays.'
          },
          { 
            score: 2, 
            label: 'Satisfactory',
            description: '20-39% milestones achieved; significant delays; needs improvement.'
          },
          { 
            score: 1, 
            label: 'Needs Improvement',
            description: 'Less than 20% completed; major delays; poor progress.'
          }
        ]
      },
      {
        rubric_id: 'R2-C2',
        component_name: 'Implementation Quality',
        component_description: 'Code quality, architecture, and technical implementation',
        max_marks: 30,
        sub_components: [
          {
            sub_id: 'R2-C2-S1',
            name: 'Code Quality',
            description: 'Clean, maintainable, and well-documented code',
            max_marks: 12
          },
          {
            sub_id: 'R2-C2-S2',
            name: 'Architecture',
            description: 'System design and component structure',
            max_marks: 10
          },
          {
            sub_id: 'R2-C2-S3',
            name: 'Best Practices',
            description: 'Following coding standards and patterns',
            max_marks: 8
          }
        ],
        levels: [
          { 
            score: 5, 
            label: 'Outstanding',
            description: 'Excellent code quality; well-architected; follows all best practices; properly documented.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: 'Good quality code; solid architecture; mostly follows best practices; adequate documentation.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: 'Acceptable code; basic architecture; some best practices followed; minimal documentation.'
          },
          { 
            score: 2, 
            label: 'Satisfactory',
            description: 'Working code but poorly organized; weak architecture; limited best practices.'
          },
          { 
            score: 1, 
            label: 'Needs Improvement',
            description: 'Poor code quality; no clear architecture; no best practices; undocumented.'
          }
        ]
      },
      {
        rubric_id: 'R2-C3',
        component_name: 'Testing & Validation',
        component_description: 'Test coverage, bug identification, and quality assurance',
        max_marks: 20,
        sub_components: [
          {
            sub_id: 'R2-C3-S1',
            name: 'Test Coverage',
            description: 'Unit tests and integration tests written',
            max_marks: 10
          },
          {
            sub_id: 'R2-C3-S2',
            name: 'Bug Management',
            description: 'Identification and resolution of bugs',
            max_marks: 6
          },
          {
            sub_id: 'R2-C3-S3',
            name: 'Validation',
            description: 'Testing methodology and results validation',
            max_marks: 4
          }
        ],
        levels: [
          { 
            score: 5, 
            label: 'Outstanding',
            description: 'Comprehensive testing (>80% coverage); all critical bugs fixed; thorough validation.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: 'Good test coverage (60-80%); most bugs identified and fixed; adequate validation.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: 'Basic testing (40-60% coverage); some bugs remain; partial validation.'
          },
          { 
            score: 2, 
            label: 'Satisfactory',
            description: 'Limited testing (<40% coverage); multiple bugs present; minimal validation.'
          },
          { 
            score: 1, 
            label: 'Needs Improvement',
            description: 'No systematic testing; many bugs; no validation process.'
          }
        ]
      },
      {
        rubric_id: 'R2-C4',
        component_name: 'Documentation',
        component_description: 'Technical documentation, user guides, and code comments',
        max_marks: 15,
        sub_components: [
          {
            sub_id: 'R2-C4-S1',
            name: 'Technical Documentation',
            description: 'System design, API docs, architecture diagrams',
            max_marks: 7
          },
          {
            sub_id: 'R2-C4-S2',
            name: 'Code Comments',
            description: 'Inline documentation and code clarity',
            max_marks: 5
          },
          {
            sub_id: 'R2-C4-S3',
            name: 'User Documentation',
            description: 'Installation guide and usage instructions',
            max_marks: 3
          }
        ],
        levels: [
          { 
            score: 5, 
            label: 'Outstanding',
            description: 'Complete, well-organized documentation; includes all technical details, diagrams, and user guides.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: 'Most documentation complete; good technical content; minor sections need work.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: 'Basic documentation present; covers essentials; needs more detail.'
          },
          { 
            score: 2, 
            label: 'Satisfactory',
            description: 'Minimal documentation; many sections incomplete; poorly organized.'
          },
          { 
            score: 1, 
            label: 'Needs Improvement',
            description: 'Little to no documentation; major sections missing.'
          }
        ]
      },
      {
        rubric_id: 'R2-C5',
        component_name: 'Team Collaboration & Communication',
        component_description: 'Teamwork, coordination, and contribution distribution',
        max_marks: 10,
        sub_components: [
          {
            sub_id: 'R2-C5-S1',
            name: 'Team Coordination',
            description: 'Regular meetings and effective communication',
            max_marks: 4
          },
          {
            sub_id: 'R2-C5-S2',
            name: 'Work Distribution',
            description: 'Equal and appropriate task allocation',
            max_marks: 4
          },
          {
            sub_id: 'R2-C5-S3',
            name: 'Version Control',
            description: 'Proper use of Git/collaboration tools',
            max_marks: 2
          }
        ],
        levels: [
          { 
            score: 5, 
            label: 'Outstanding',
            description: 'Excellent teamwork; regular meetings; equal contribution; proper version control usage.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: 'Good teamwork; effective communication; mostly equal contribution.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: 'Adequate teamwork; some communication gaps; acceptable contribution.'
          },
          { 
            score: 2, 
            label: 'Satisfactory',
            description: 'Limited teamwork; irregular meetings; uneven contribution.'
          },
          { 
            score: 1, 
            label: 'Needs Improvement',
            description: 'Poor teamwork; no coordination; highly uneven contribution.'
          }
        ]
      }
    ],
    teams: [
      {
        team_id: 'T1',
        team_name: 'Team Alpha - AI Medical Diagnosis',
        project_title: 'AI-Powered Early Disease Detection System',
        marks_entered: false,
        students: [
          { 
            student_id: 'S1', 
            student_name: 'Arjun Patel', 
            roll_no: '21BCE001',
            profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun'
          },
          { 
            student_id: 'S2', 
            student_name: 'Priya Sharma', 
            roll_no: '21BCE002',
            profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya'
          },
          { 
            student_id: 'S3', 
            student_name: 'Vikram Singh', 
            roll_no: '21BCE003',
            profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram'
          }
        ]
      },
      {
        team_id: 'T3',
        team_name: 'Team Gamma - Cloud Security',
        project_title: 'Cloud-Based Security Monitoring System',
        marks_entered: false,
        students: [
          { 
            student_id: 'S8', 
            student_name: 'Sneha Iyer', 
            roll_no: '21BCE008',
            profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha'
          },
          { 
            student_id: 'S9', 
            student_name: 'Aditya Menon', 
            roll_no: '21BCE009',
            profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aditya'
          }
        ]
      }
    ]
  },
  {
    review_id: 'R3',
    review_name: 'Review 3 - Design & Architecture',
    start_date: '2025-12-10',
    end_date: '2025-12-28',
    review_type: 'panel',
    rubric_structure: [
      {
        rubric_id: 'R3-C1',
        component_name: 'UI/UX Design',
        component_description: 'User interface quality, experience design, and usability',
        max_marks: 30,
        sub_components: [
          {
            sub_id: 'R3-C1-S1',
            name: 'Visual Design',
            description: 'Aesthetics, consistency, and modern design principles',
            max_marks: 12
          },
          {
            sub_id: 'R3-C1-S2',
            name: 'User Experience',
            description: 'Intuitive navigation and user-friendly interface',
            max_marks: 10
          },
          {
            sub_id: 'R3-C1-S3',
            name: 'Accessibility',
            description: 'WCAG compliance and inclusive design',
            max_marks: 8
          }
        ],
        levels: [
          { 
            score: 5, 
            label: 'Outstanding',
            description: 'Professional, modern design; exceptional UX; fully accessible; consistent throughout.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: 'Good design quality; mostly intuitive; basic accessibility; minor inconsistencies.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: 'Acceptable design; functional interface; limited accessibility considerations.'
          },
          { 
            score: 2, 
            label: 'Satisfactory',
            description: 'Basic design; usability issues; no accessibility; inconsistent.'
          },
          { 
            score: 1, 
            label: 'Needs Improvement',
            description: 'Poor design; confusing interface; major usability problems.'
          }
        ]
      },
      {
        rubric_id: 'R3-C2',
        component_name: 'System Architecture',
        component_description: 'System design, scalability, and architectural patterns',
        max_marks: 35,
        sub_components: [
          {
            sub_id: 'R3-C2-S1',
            name: 'Architecture Design',
            description: 'System structure, modularity, and design patterns',
            max_marks: 15
          },
          {
            sub_id: 'R3-C2-S2',
            name: 'Scalability',
            description: 'Ability to handle growth and load',
            max_marks: 12
          },
          {
            sub_id: 'R3-C2-S3',
            name: 'Integration',
            description: 'Component integration and API design',
            max_marks: 8
          }
        ],
        levels: [
          { 
            score: 5, 
            label: 'Outstanding',
            description: 'Well-designed, scalable architecture; follows best practices; microservices/modular; excellent integration.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: 'Good architecture; mostly scalable; appropriate patterns used; good integration.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: 'Acceptable architecture; limited scalability; basic patterns; adequate integration.'
          },
          { 
            score: 2, 
            label: 'Satisfactory',
            description: 'Weak architecture; scalability concerns; poor patterns; integration issues.'
          },
          { 
            score: 1, 
            label: 'Needs Improvement',
            description: 'Poor architecture; not scalable; no design patterns; broken integration.'
          }
        ]
      },
      {
        rubric_id: 'R3-C3',
        component_name: 'Database Design',
        component_description: 'Data modeling, schema design, and query optimization',
        max_marks: 35,
        sub_components: [
          {
            sub_id: 'R3-C3-S1',
            name: 'Schema Design',
            description: 'Normalization, relationships, and data integrity',
            max_marks: 15
          },
          {
            sub_id: 'R3-C3-S2',
            name: 'Query Optimization',
            description: 'Indexing, query performance, and efficiency',
            max_marks: 12
          },
          {
            sub_id: 'R3-C3-S3',
            name: 'Data Modeling',
            description: 'ER diagrams and logical data models',
            max_marks: 8
          }
        ],
        levels: [
          { 
            score: 5, 
            label: 'Outstanding',
            description: 'Normalized schema; proper indexing; efficient queries; excellent data modeling; complete ER diagrams.'
          },
          { 
            score: 4, 
            label: 'Very Good',
            description: 'Good schema; mostly normalized; adequate indexing; good queries; data models present.'
          },
          { 
            score: 3, 
            label: 'Good',
            description: 'Functional schema; some normalization; basic indexing; queries work; basic models.'
          },
          { 
            score: 2, 
            label: 'Satisfactory',
            description: 'Poor schema; denormalized; no indexing; inefficient queries; incomplete models.'
          },
          { 
            score: 1, 
            label: 'Needs Improvement',
            description: 'Very poor schema; no normalization; no optimization; no data models.'
          }
        ]
      }
    ],
    teams: [
      {
        team_id: 'T1',
        team_name: 'Team Alpha - AI Medical Diagnosis',
        project_title: 'AI-Powered Early Disease Detection System',
        marks_entered: true,
        students: [
          { 
            student_id: 'S1', 
            student_name: 'Arjun Patel', 
            roll_no: '21BCE001',
            profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun'
          },
          { 
            student_id: 'S2', 
            student_name: 'Priya Sharma', 
            roll_no: '21BCE002',
            profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya'
          },
          { 
            student_id: 'S3', 
            student_name: 'Vikram Singh', 
            roll_no: '21BCE003',
            profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram'
          }
        ]
      },
      {
        team_id: 'T2',
        team_name: 'Team Beta - Smart IoT',
        project_title: 'IoT-Based Smart Home Automation System',
        marks_entered: true,
        students: [
          { 
            student_id: 'S4', 
            student_name: 'Anjali Reddy', 
            roll_no: '21BCE004',
            profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali'
          },
          { 
            student_id: 'S5', 
            student_name: 'Rahul Kumar', 
            roll_no: '21BCE005',
            profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul'
          }
        ]
      }
    ]
  }
];
