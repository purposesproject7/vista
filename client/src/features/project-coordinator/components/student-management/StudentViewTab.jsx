// src/features/project-coordinator/components/student-management/StudentViewTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import AcademicFilterSelector from '../shared/AcademicFilterSelector';
import StudentList from './StudentList';
import StudentDetailsModal from './StudentDetailsModal';
import { useToast } from '../../../../shared/hooks/useToast';
import { fetchStudents, fetchStudentDetails } from '../../services/coordinatorApi';
import { useAuth } from '../../../../shared/hooks/useAuth';

const StudentViewTab = () => {
    const [filters, setFilters] = useState(null);
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const { user } = useAuth();

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

            // Mix user context into filters for Coordinator API
            const apiFilters = {
                ...filters,
                school: user?.school,
                program: user?.program,
                academicYear: filters.year // PC API expects 'academicYear' usually, verify if it expects 'year' or 'academicYear'
            };
            // In StudentManagement.jsx it was calling: school, program, academicYear: filters.year

            const response = await fetchStudents(apiFilters);

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

    const handleViewDetails = async (studentOrPartial) => {
        try {
            let student = studentOrPartial;

            if (!student.regNo && student.id) {
                const found = students.find(s => s._id === student.id || s.id === student.id);
                if (found) {
                    student = found;
                } else {
                    // Try to fetch if not in list (e.g. teammate reference)
                    // Does coordinatorApi have fetchStudentById? No, fetchStudentDetails takes regNo.
                    // If we only have ID, we might be stuck unless we find it in list.
                    // Assuming teammates are in the list.
                    console.warn("Student details not found for ID:", student.id);
                    return;
                }
            }

            // Fetch full details if needed, or just use what we have if it's rich enough. 
            // Admin side fetched details? No, Admin side just sets selectedStudent. 
            // Wait, looking at Admin StudentViewTab again (step 375):
            // It calls fetchStudentDetails(student.id) ONLY if it wasn't valid. 
            // Actually lines 60-70 of Admin StudentViewTab were commented out/logic was complex about IDs.
            // But setSelectedStudent(student) is the main action.

            // However, PC 'StudentDetailsModal' might expect full data structure.
            // Let's reuse the logic: set selected student and open modal.
            setSelectedStudent(student);
            setIsModalOpen(true);

        } catch (error) {
            console.error('Error viewing student details:', error);
            showToast('Failed to load student details', 'error');
        }
    };

    const handleNavigateToStudent = async (student) => {
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
                        students={students} // PC Modal might use this list for finding others? Admin modal didn't seem to pass 'students' prop in my read. 
                    // Wait, checking PC StudentList again (step 385), it uses StudentDetailsModal inside it and passes 'students'. 
                    // I will pass it here to be safe if PC modal needs it.
                    />
                </>
            )}
        </div>
    );
};

export default StudentViewTab;
