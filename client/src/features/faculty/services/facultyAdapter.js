import { adaptBackendData } from '../../../shared/utils/dataAdapter';

// Backend to Frontend mapping - change only these when backend structure changes
const REVIEW_MAPPING = {
  id: 'review_id',
  name: 'review_name',
  startDate: 'start_date',
  endDate: 'end_date',
  type: 'review_type' // 'guide' or 'panel'
};

const TEAM_MAPPING = {
  id: 'team_id',
  name: 'team_name',
  students: 'student_list',
  isMarked: 'marks_entered'
};

const STUDENT_MAPPING = {
  id: 'student_id',
  name: 'student_name',
  rollNumber: 'roll_no'
};

// Recursive rubric adapter for nested structure
export const adaptRubrics = (backendRubrics) => {
  return backendRubrics.map(rubric => ({
    id: rubric.rubric_id || rubric.id,
    component: rubric.component_name || rubric.name,
    description: rubric.desc || rubric.description || '',
    maxMarks: rubric.max_marks || rubric.maxMarks,
    children: rubric.sub_components 
      ? adaptRubrics(rubric.sub_components) 
      : (rubric.children ? adaptRubrics(rubric.children) : [])
  }));
};

export const adaptReviewData = (backendData) => {
  const review = adaptBackendData(backendData, REVIEW_MAPPING);
  
  // Adapt teams if present
  if (backendData.teams || backendData.team_list) {
    review.teams = (backendData.teams || backendData.team_list).map(team => {
      const adaptedTeam = adaptBackendData(team, TEAM_MAPPING);
      
      // Adapt students within team
      if (team.students || team.student_list) {
        adaptedTeam.students = (team.students || team.student_list).map(student =>
          adaptBackendData(student, STUDENT_MAPPING)
        );
      }
      
      return adaptedTeam;
    });
  }
  
  // Adapt rubrics if present
  if (backendData.rubrics || backendData.rubric_structure) {
    review.rubrics = adaptRubrics(backendData.rubrics || backendData.rubric_structure);
  }
  
  return review;
};

// Adapt marks submission to backend format
export const adaptMarksForSubmission = (frontendMarks) => {
  // Transform frontend mark structure to whatever backend expects
  return {
    student_marks: frontendMarks.map(sm => ({
      student_id: sm.studentId,
      rubric_marks: Object.entries(sm.marks).map(([rubricId, value]) => ({
        rubric_id: rubricId,
        marks_obtained: parseFloat(value)
      }))
    }))
  };
};
