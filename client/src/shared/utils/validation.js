// src/shared/utils/validation.js - REPLACE ENTIRE FILE
// Recursively calculate total marks from nested rubric structure
export const calculateTotal = (rubrics, marks) => {
  let total = 0;
  
  rubrics.forEach(rubric => {
    if (rubric.children && rubric.children.length > 0) {
      // Has sub-components, recurse
      total += calculateTotal(rubric.children, marks);
    } else {
      // Leaf node, get mark value
      const mark = marks[rubric.id] || 0;
      total += parseFloat(mark) || 0;
    }
  });
  
  return total;
};

export const validateMarks = (rubrics, marks) => {
  const errors = {};
  
  rubrics.forEach(rubric => {
    if (rubric.children && rubric.children.length > 0) {
      // Validate children recursively
      const childErrors = validateMarks(rubric.children, marks);
      Object.assign(errors, childErrors);
    } else {
      // Validate leaf node
      const mark = parseFloat(marks[rubric.id]) || 0;
      if (mark < 0) {
        errors[rubric.id] = 'Cannot be negative';
      } else if (mark > rubric.maxMarks) {
        errors[rubric.id] = `Max ${rubric.maxMarks}`;
      }
    }
  });
  
  return errors;
};

// Just validate that no individual component exceeds its max
export const validateStudentTotal = (rubrics, marks) => {
  const total = calculateTotal(rubrics, marks);
  const errors = validateMarks(rubrics, marks);
  
  return {
    total,
    isValid: Object.keys(errors).length === 0,
    message: Object.keys(errors).length === 0 ? 'Valid' : 'Some marks exceed maximum'
  };
};
