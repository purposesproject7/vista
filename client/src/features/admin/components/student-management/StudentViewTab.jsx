// src/features/admin/components/student-management/StudentViewTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import AcademicFilterSelector from './AcademicFilterSelector';
import StudentList from './StudentList';
import StudentDetailsModal from './StudentDetailsModal';
import { useToast } from '../../../../shared/hooks/useToast';
import { fetchStudents, fetchStudentDetails } from '../../services/adminApi';

const StudentViewTab = () => {
  const [filters, setFilters] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        setStudents(response.students || []);
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

  const handleViewDetails = async (student) => {
    try {
      // Fetch detailed student information
      const response = await fetchStudentDetails(student.regNo);
      
      if (response.success) {
        setSelectedStudent(response.student);
        setIsModalOpen(true);
      } else {
        showToast(response.message || 'Failed to load student details', 'error');
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
      showToast(error.response?.data?.message || 'Failed to load student details', 'error');
    }
  };

  const handleNavigateToStudent = async (student) => {
    // Close current modal and open details for the selected teammate
    await handleViewDetails(student);
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
          />

          <StudentDetailsModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            student={selectedStudent}
            onNavigateToStudent={handleNavigateToStudent}
          />
        </>
      )}
    </div>
  );
};

export default StudentViewTab;
