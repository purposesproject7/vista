// src/features/admin/pages/StudentManagement.jsx
import React, { useState, useEffect } from 'react';
import Navbar from '../../../shared/components/Navbar';
import AdminTabs from '../components/shared/AdminTabs';
import AcademicFilterSelector from '../components/student-management/AcademicFilterSelector';
import StudentList from '../components/student-management/StudentList';
import StudentDetailsModal from '../components/student-management/StudentDetailsModal';
import { useToast } from '../../../shared/hooks/useToast';
import api from '../../../services/api';
import { generateDummyStudents } from '../../../shared/utils/dummyStudentData';

const StudentManagement = () => {
  const [filters, setFilters] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // Fetch students when filters are complete
  useEffect(() => {
    if (filters) {
      // fetchStudents(); // Commented for dummy data
      // Use dummy data instead
      setLoading(true);
      setTimeout(() => {
        setStudents(generateDummyStudents());
        setLoading(false);
      }, 500);
    }
  }, [filters]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/students', {
        params: {
          schoolId: filters.school,
          programmeId: filters.programme,
          yearId: filters.year,
          semesterId: filters.semester
        }
      });
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      showToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (student) => {
    // Use dummy data - find student from the list
    const fullStudent = students.find(s => s.id === student.id);
    setSelectedStudent(fullStudent || student);
    setIsModalOpen(true);
    
    // try {
    //   // Fetch full student details
    //   const response = await api.get(`/admin/students/${student.id}`);
    //   setSelectedStudent(response.data);
    //   setIsModalOpen(true);
    // } catch (error) {
    //   console.error('Error fetching student details:', error);
    //   showToast('Failed to load student details', 'error');
    // }
  };

  const handleFilterComplete = (selectedFilters) => {
    setFilters(selectedFilters);
  };

  const handleNavigateToStudent = (student) => {
    handleViewDetails(student);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <AdminTabs />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            
          </p>
        </div>

        {/* Filter Selector */}
        <div className="mb-6">
          <AcademicFilterSelector onFilterComplete={handleFilterComplete} />
        </div>

        {/* Student List */}
        {filters && (
          <StudentList 
            students={students} 
            loading={loading}
            onViewDetails={handleViewDetails}
          />
        )}

        {/* Student Details Modal */}
        <StudentDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          student={selectedStudent}
          onNavigateToStudent={handleNavigateToStudent}
        />
      </div>
    </div>
  );
};

export default StudentManagement;
