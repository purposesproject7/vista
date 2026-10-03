// src/features/admin/components/student-management/StudentViewTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import AcademicFilterSelector from './AcademicFilterSelector';
import StudentList from './StudentList';
import StudentDetailsModal from './StudentDetailsModal';
import StudentEditModal from './StudentEditModal';
import { useToast } from '../../../../shared/hooks/useToast';
import { fetchStudents, fetchStudentDetails, deleteStudent, undoStudentPAT } from '../../services/adminApi';

const StudentViewTab = ({ onStudentsLoaded }) => {
  const [filters, setFilters] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters(selectedFilters);
    setStudents([]);
  }, []);

  // Fetch students when filters change
  useEffect(() => {
    if (filters) {
      loadStudents();
    }
  }, [filters]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await fetchStudents(filters);

      if (response.success) {
        const studentList = response.students || [];
        setStudents(studentList);

        // Notify parent component of student count
        if (onStudentsLoaded) {
          onStudentsLoaded(studentList.length);
        }
      } else {
        showToast(response.message || 'Failed to load students', 'error');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      showToast(error.response?.data?.message || 'Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (studentOrPartial) => {
    try {
      // Check if we already have the full student details 
      // (The list now returns full details including guide, panel, teammates)
      let student = studentOrPartial;

      // If we only have an ID (e.g. from teammate click), find it in the list first
      if (!student.regNo && student.id) {
        const found = students.find(s => s._id === student.id);
        if (found) {
          // Even if found in list, we fetch fresh details to ensure we have marks and latest info
          try {
            // We need regNo. If found has it, good.
            if (found.regNo) {
              setLoading(true);
              const detailsResponse = await fetchStudentDetails(found.regNo);
              if (detailsResponse.success && detailsResponse.student) {
                student = detailsResponse.student;
              } else {
                // Fallback to list item if fetch fails or returns empty
                student = found;
              }
              setLoading(false);
            } else {
              student = found;
            }
          } catch (err) {
            console.error("Failed to fetch fresh details, using list data", err);
            student = found;
            setLoading(false);
          }
        } else {
          // If not in current list (filtered out?), fallback to fetch
          const response = await fetchStudentDetails(student.id); // Note: API expects regNo usually, but let's check if we can get regNo or use another endpoint? 
          // Actually fetchStudentDetails takes regNo. Using ID here would fail if API expects regNo.
          // If we are clicking a teammate, we passed { id: ... }. We don't have regNo in that partial object unless we put it there.
          // In StudentService backend update, teammates = { id, name }.
          // So we only have ID.
          // If the student is not in the loaded 'students' list, we can't easily get their regNo to call fetchStudentDetails(regNo).
          // BUT, usually teammates are in the same batch/program, so they should be in the list.
          // If they aren't, we might need to fetch by ID. 
          // Let's assume for now they are in the list.
          console.warn("Teammate not found in current list, cannot open details without RegNo");
          return;
        }
      }

      setSelectedStudent(student);
      setIsModalOpen(true);

    } catch (error) {
      console.error('Error viewing student details:', error);
      showToast('Failed to load student details', 'error');
    }
  };

  const handleEdit = async (studentOrPartial) => {
    try {
      let student = studentOrPartial;

      // If we only have an ID, find it in the list
      if (!student.regNo && student.id) {
        const found = students.find(s => s._id === student.id);
        if (found) {
          student = found;
        } else {
          console.warn("Student not found in current list");
          return;
        }
      }

      setSelectedStudent(student);
      setIsEditModalOpen(true);

    } catch (error) {
      console.error('Error opening edit modal:', error);
      showToast('Failed to open edit modal', 'error');
    }
  };

  const handleNavigateToStudent = async (student) => {
    // Close current modal and open details for the selected teammate
    await handleViewDetails(student);
  };

  const handleEditSuccess = () => {
    loadStudents();
  };

  const handleDelete = async (student) => {
    if (window.confirm(`Are you sure you want to delete student ${student.name} (${student.regNo})?`)) {
      try {
        setLoading(true);
        const response = await deleteStudent(student.regNo);
        if (response.success) {
          showToast('Student deleted successfully', 'success');
          loadStudents();
        } else {
          showToast(response.message || 'Failed to delete student', 'error');
        }
      } catch (error) {
        console.error('Error deleting student:', error);
        showToast(error.response?.data?.message || 'Failed to delete student', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUndoPAT = async (student) => {
    try {
      setLoading(true);
      const response = await undoStudentPAT(student.regNo);
      if (response.success) {
        showToast('Successfully removed PAT status', 'success');
        // Optimistic UI update to instantly flush out the button
        setStudents(prev => prev.map(s => s.regNo === student.regNo ? { ...s, PAT: false } : s));
        await loadStudents();
      } else {
        showToast(response.message || 'Failed to undo PAT', 'error');
      }
    } catch (error) {
      console.error('Error undoing PAT:', error);
      showToast(error.response?.data?.message || 'Failed to undo PAT', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Academic Filter Selector */}
      <AcademicFilterSelector onFilterComplete={handleFilterComplete} />

      {/* Student List - only show when filters are complete */}
      {filters && (
        <>
          <StudentList
            students={students}
            loading={loading}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onUndoPAT={handleUndoPAT}
          />

          <StudentDetailsModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            student={selectedStudent}
            onNavigateToStudent={handleNavigateToStudent}
            onRefresh={loadStudents}
          />

          <StudentEditModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            student={selectedStudent}
            onSuccess={handleEditSuccess}
          />
        </>
      )}
    </div>
  );
};

export default StudentViewTab;
