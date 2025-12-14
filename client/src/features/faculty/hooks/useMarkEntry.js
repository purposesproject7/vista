import { useState, useCallback } from 'react';
import { validateMarks, validateStudentTotal, calculateTotal } from '../../../shared/utils/validation';
import { adaptMarksForSubmission } from '../services/facultyAdapter';

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
      // Convert marks to backend format
      const payload = adaptMarksForSubmission(
        team.students.map(student => ({
          studentId: student.id,
          marks: marks[student.id]
        }))
      );

      // TODO: Replace with actual API call
      const response = await fetch(`/api/faculty/reviews/${review.id}/teams/${team.id}/marks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Submission failed');

      return { success: true, message: 'Marks submitted successfully' };
    } catch (err) {
      return { success: false, message: err.message };
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
