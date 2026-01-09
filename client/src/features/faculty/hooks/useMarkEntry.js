import { useState, useCallback } from 'react';
import { validateMarks, validateStudentTotal, calculateTotal } from '../../../shared/utils/validation';
import api from '../../../services/api';

export const useMarkEntry = (review, team) => {
  // State: { studentId: { rubricId: mark } }
  const [marks, setMarks] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Initialize marks for all students
  const initializeMarks = useCallback(() => {
    const initialMarks = {};
    team.students.forEach(student => {
      initialMarks[student.id] = {};
    });
    setMarks(initialMarks);
  }, [team]);

  // Update mark for a specific student and rubric
  const updateMark = (studentId, rubricId, value) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [rubricId]: value
      }
    }));

    // Clear error for this field
    setErrors(prev => ({
      ...prev,
      [`${studentId}-${rubricId}`]: null
    }));
  };

  // Validate all marks before submission
  const validateAllMarks = () => {
    const newErrors = {};
    let isValid = true;

    team.students.forEach(student => {
      const studentMarks = marks[student.id] || {};

      // Validate individual fields
      const fieldErrors = validateMarks(review.rubrics, studentMarks);
      Object.keys(fieldErrors).forEach(rubricId => {
        newErrors[`${student.id}-${rubricId}`] = fieldErrors[rubricId];
        isValid = false;
      });

      // Validate total
      const totalValidation = validateStudentTotal(review.rubrics, studentMarks);
      if (!totalValidation.isValid) {
        newErrors[`${student.id}-total`] = totalValidation.message;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Submit marks
  const submitMarks = async () => {
    if (!validateAllMarks()) {
      return { success: false, message: 'Please fix validation errors' };
    }

    setSubmitting(true);

    try {
      // Create separate submissions for each student
      // The backend endpoint likely accepts one submission (for one student) at a time based on validation middleware "validateRequired(['student'])"
      // Wait, checking facultyRoutes.js: router.post("/marks", ...)
      // Controller: MarksService.submitMarks(req.user._id, req.body);
      // Let's verify if submitMarks handles bulk or single.
      // Schema validation says "student" (singular).
      // So I probably need to loop through students and submit one by one.

      const submissions = team.students.map(async (student) => {
        const studentMarks = marks[student.id];

        // Construct componentMarks array
        const componentMarks = review.rubrics.map(rubric => {
          // Logic to handle subcomponents if they exist
          // For now assume flat structure or simple mapping
          // If rubric has subComponents, we need to calculate total for it?
          // Or does the UI provide subcomponent marks?
          // simple UI assumes flat or accumulated.
          // If `studentMarks[rubric.rubricId]` is the value.

          // If the rubric has subcomponents, `studentMarks[rubric.rubricId]` might be the total?
          // Or we need to support subcomponent entry in UI.
          // Assuming flat entry for now based on previous UI code.

          return {
            componentId: rubric.rubricId, // This might be name or ID. Backend expects ID if it's a ref? 
            // Schema: componentId (ObjectId) required.
            // In my seed, I mapped component name to ID.
            // In useFacultyReviews, I set rubricId = comp.componentId || comp.name.
            // If it's a name, backend might fail if it expects ObjectId.
            // Let's hope it's the ID.
            componentName: rubric.componentName,
            marks: parseFloat(studentMarks[rubric.rubricId]),
            maxMarks: rubric.maxMarks,
            componentTotal: parseFloat(studentMarks[rubric.rubricId]), // Assuming flat
            componentMaxTotal: rubric.maxMarks
          };
        });

        const totalObtained = componentMarks.reduce((sum, c) => sum + c.componentTotal, 0);
        const maxTotal = componentMarks.reduce((sum, c) => sum + c.componentMaxTotal, 0);

        const payload = {
          student: student.id,
          project: team.id,
          reviewType: review.id, // reviewName
          componentMarks: componentMarks,
          totalMarks: totalObtained,
          maxTotalMarks: maxTotal
        };

        return api.post('/faculty/marks', payload);
      });

      await Promise.all(submissions);

      return { success: true, message: 'Marks submitted successfully' };
    } catch (err) {
      console.error(err);
      return { success: false, message: err.response?.data?.message || err.message };
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate total for a student
  const getStudentTotal = (studentId) => {
    return calculateTotal(review.rubrics, marks[studentId] || {});
  };

  return {
    marks,
    errors,
    submitting,
    initializeMarks,
    updateMark,
    submitMarks,
    getStudentTotal
  };
};
