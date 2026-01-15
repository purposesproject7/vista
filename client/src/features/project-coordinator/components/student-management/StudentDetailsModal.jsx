// src/features/project-coordinator/components/student-management/StudentDetailsModal.jsx
import React, { useState } from 'react';
import Modal from '../../../../shared/components/Modal';
import StudentHeader from './StudentHeader';
import ProjectFacultyCard from './ProjectFacultyCard';
import ContactCard from './ContactCard';
import MarksCard from './MarksCard';
import ReviewStatusCard from './ReviewStatusCard';
import TeamMembersCard from './TeamMembersCard';

const StudentDetailsModal = ({ isOpen, onClose, student, onNavigateToStudent, students = [] }) => {
  const [isMarksModalOpen, setIsMarksModalOpen] = useState(false);

  if (!student) return null;

  // marks object is now provided by backend
  const marks = student.marks || {
    total: student.totalMarks || 0,
    guide: 0,
    panel: 0
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Student Details"
        size="lg"
      >
        <div className="space-y-4">
          <StudentHeader student={student} />
          <ProjectFacultyCard student={student} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ContactCard student={student} />
            <MarksCard marks={marks} onClick={() => setIsMarksModalOpen(true)} />
          </div>

          <ReviewStatusCard reviewStatuses={student.reviewStatuses} />
          <TeamMembersCard
            teammates={student.teammates}
            onNavigateToStudent={onNavigateToStudent}
            onCloseModal={onClose}
            students={students}
          />
        </div>
      </Modal>
    </>
  );
};

export default StudentDetailsModal;
