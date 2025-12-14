// src/features/admin/hooks/useStudentManagement.js
import { useState, useEffect } from 'react';
import adminApi from '../services/adminApi';
import { useToast } from '../../../shared/hooks/useToast';

/**
 * Custom hook for student management functionality
 * Handles fetching, filtering, and managing student data
 */
export const useStudentManagement = (filters) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  // Fetch students when filters change
  useEffect(() => {
    if (filters?.school && filters?.programme && filters?.year && filters?.semester) {
      fetchStudents();
    }
  }, [filters]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.fetchStudents({
        schoolId: filters.school,
        programmeId: filters.programme,
        yearId: filters.year,
        semesterId: filters.semester
      });
      setStudents(data);
    } catch (err) {
      setError(err);
      showToast('Failed to load students', 'error');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchStudents();
  };

  return {
    students,
    loading,
    error,
    refetch
  };
};

/**
 * Custom hook for student details
 * Handles fetching individual student information
 */
export const useStudentDetails = (studentId) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (studentId) {
      fetchStudentDetails();
    }
  }, [studentId]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.fetchStudentDetails(studentId);
      setStudent(data);
    } catch (err) {
      setError(err);
      showToast('Failed to load student details', 'error');
      console.error('Error fetching student details:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchStudentDetails();
  };

  return {
    student,
    loading,
    error,
    refetch
  };
};

/**
 * Custom hook for academic context options
 * Handles fetching schools, programmes, years, and semesters
 */
export const useAcademicContext = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const data = await adminApi.fetchSchools();
      setSchools(data.map(s => ({ value: s.id, label: s.name })));
    } catch (err) {
      showToast('Failed to load schools', 'error');
      console.error('Error fetching schools:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgrammes = async (schoolId) => {
    try {
      setLoading(true);
      const data = await adminApi.fetchProgrammes(schoolId);
      return data.map(p => ({ value: p.id, label: p.name }));
    } catch (err) {
      showToast('Failed to load programmes', 'error');
      console.error('Error fetching programmes:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchYears = async (schoolId, programmeId) => {
    try {
      setLoading(true);
      const data = await adminApi.fetchYears(schoolId, programmeId);
      return data.map(y => ({ value: y.id, label: y.label }));
    } catch (err) {
      showToast('Failed to load years', 'error');
      console.error('Error fetching years:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchSemesters = async (schoolId, programmeId, yearId) => {
    try {
      setLoading(true);
      const data = await adminApi.fetchSemesters(schoolId, programmeId, yearId);
      return data.map(s => ({ value: s.id, label: s.name }));
    } catch (err) {
      showToast('Failed to load semesters', 'error');
      console.error('Error fetching semesters:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    schools,
    loading,
    fetchProgrammes,
    fetchYears,
    fetchSemesters
  };
};

/**
 * Custom hook for PPT status management
 */
export const usePPTStatus = () => {
  const [updating, setUpdating] = useState(false);
  const { showToast } = useToast();

  const updateStatus = async (studentId, status, remarks = '') => {
    try {
      setUpdating(true);
      await adminApi.updatePPTStatus(studentId, status, remarks);
      showToast('PPT status updated successfully', 'success');
      return true;
    } catch (err) {
      showToast('Failed to update PPT status', 'error');
      console.error('Error updating PPT status:', err);
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return {
    updateStatus,
    updating
  };
};

/**
 * Custom hook for faculty assignment
 */
export const useFacultyAssignment = () => {
  const [assigning, setAssigning] = useState(false);
  const { showToast } = useToast();

  const assignGuide = async (studentId, guideId) => {
    try {
      setAssigning(true);
      await adminApi.assignGuide(studentId, guideId);
      showToast('Guide assigned successfully', 'success');
      return true;
    } catch (err) {
      showToast('Failed to assign guide', 'error');
      console.error('Error assigning guide:', err);
      return false;
    } finally {
      setAssigning(false);
    }
  };

  const assignPanelMember = async (studentId, panelMemberId) => {
    try {
      setAssigning(true);
      await adminApi.assignPanelMember(studentId, panelMemberId);
      showToast('Panel member assigned successfully', 'success');
      return true;
    } catch (err) {
      showToast('Failed to assign panel member', 'error');
      console.error('Error assigning panel member:', err);
      return false;
    } finally {
      setAssigning(false);
    }
  };

  return {
    assignGuide,
    assignPanelMember,
    assigning
  };
};

export default {
  useStudentManagement,
  useStudentDetails,
  useAcademicContext,
  usePPTStatus,
  useFacultyAssignment
};
