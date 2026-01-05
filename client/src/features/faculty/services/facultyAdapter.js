import { adaptBackendData } from '../../../shared/utils/dataAdapter';

// Backend to Frontend mapping - change only these when backend structure changes
const REVIEW_MAPPING = {
  id: 'review_id',
  name: 'review_name',
  startDate: 'start_date',
  endDate: 'end_date',
  type: 'review_type' // 'guide' or 'panel'
};

// Backend to Frontend mapping - keep original structure for now
const TEAM_MAPPING = {
  id: 'team_id',
  name: 'team_name',
  projectTitle: 'project_title',
  students: 'students',
  marksEntered: 'marks_entered'
};

const STUDENT_MAPPING = {
  id: 'student_id',
  name: 'student_name',
  rollNumber: 'roll_no',
  profileImage: 'profile_image'
};

// Adapt rubric structure with components and sub-components
export const adaptRubrics = (backendRubrics) => {
  return backendRubrics.map(rubric => ({
    rubricId: rubric.rubric_id || rubric.id,
    componentName: rubric.component_name || rubric.name,
    componentDescription: rubric.component_description || rubric.description || '',
    maxMarks: rubric.max_marks || rubric.maxMarks,
    subComponents: rubric.sub_components?.map(sub => ({
      subId: sub.sub_id || sub.id,
      name: sub.name,
      description: sub.description || '',
      maxMarks: sub.max_marks || sub.maxMarks
    })) || [],
    levels: rubric.levels?.map(level => ({
      score: level.score,
      label: level.label,
      description: level.description || ''
    })) || []
  }));
};

export const adaptReviewData = (backendData) => {
  const review = adaptBackendData(backendData, REVIEW_MAPPING);
  
  // Adapt teams if present - keep students as-is
  if (backendData.teams || backendData.team_list) {
    review.teams = (backendData.teams || backendData.team_list).map(team => {
      // Keep the original structure
      return {
        id: team.team_id || team.id,
        name: team.team_name || team.name,
        projectTitle: team.project_title || team.projectTitle,
        marksEntered: team.marks_entered || team.marksEntered || false,
        students: team.students || team.student_list || []
      };
    });
  }
  
  // Keep rubric structure as-is from backend
  if (backendData.rubric_structure) {
    review.rubric_structure = backendData.rubric_structure;
  }
  
  return review;
};

// Adapt marks submission to backend format
export const adaptMarksForSubmission = (frontendMarks) => {
  // Transform frontend mark structure to backend format
  // frontendMarks includes: { marks, subMarks, meta }
  return {
    student_marks: Object.entries(frontendMarks.marks).map(([studentId, componentMarks]) => ({
      student_id: studentId,
      attendance: frontendMarks.meta[studentId]?.attendance || 'present',
      pat: frontendMarks.meta[studentId]?.pat || false,
      comment: frontendMarks.meta[studentId]?.comment || '',
      component_marks: Object.entries(componentMarks).map(([rubricId, level]) => ({
        rubric_id: rubricId,
        level_selected: level,
        sub_component_marks: frontendMarks.subMarks[studentId]?.[rubricId] 
          ? Object.entries(frontendMarks.subMarks[studentId][rubricId]).map(([subId, mark]) => ({
              sub_component_id: subId,
              marks_obtained: parseFloat(mark) || 0
            }))
          : []
      }))
    }))
  };
};

// Reverse adapter - Backend marks to frontend format
export const adaptMarksFromBackend = (backendMarks) => {
  const marks = {};
  const subMarks = {};
  const meta = {};

  backendMarks.student_marks?.forEach(sm => {
    const studentId = sm.student_id;
    marks[studentId] = {};
    subMarks[studentId] = {};
    
    meta[studentId] = {
      attendance: sm.attendance || 'present',
      pat: sm.pat || false,
      comment: sm.comment || ''
    };

    sm.component_marks?.forEach(cm => {
      marks[studentId][cm.rubric_id] = cm.level_selected;
      
      if (cm.sub_component_marks && cm.sub_component_marks.length > 0) {
        subMarks[studentId][cm.rubric_id] = {};
        cm.sub_component_marks.forEach(scm => {
          subMarks[studentId][cm.rubric_id][scm.sub_component_id] = scm.marks_obtained;
        });
      }
    });
  });

  return { marks, subMarks, meta };
};
