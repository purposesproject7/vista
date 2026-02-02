// src/features/admin/components/student-management/StudentDetailsModal.jsx
import React, { useState } from 'react';
import Modal from '../../../../shared/components/Modal';
import MarksDetailModal from './MarksDetailModal';
import StudentHeader from './StudentHeader';
import ProjectFacultyCard from './ProjectFacultyCard';
import ContactCard from './ContactCard';
import MarksCard from './MarksCard';
import ReviewStatusCard from './ReviewStatusCard';
import TeamMembersCard from './TeamMembersCard';

const StudentDetailsModal = ({ isOpen, onClose, student, onNavigateToStudent, onRefresh }) => {
  const [isMarksModalOpen, setIsMarksModalOpen] = useState(false);

  if (!student) return null;

  const calculateMarks = () => {
    if (!student.reviewStatuses) return { total: 0, guide: 0, panel: 0 };

    let guideTotal = 0;
    let panelTotal = 0;

    student.reviewStatuses.forEach(review => {
      if (review.marks && review.status === 'approved') {
        const reviewTotal = (review.marks.actionTaken || 0) +
          (review.marks.moduleProgress || 0) +
          (review.marks.quality || 0) +
          (review.marks.documentation || 0);

        if (review.type === 'guide') {
          guideTotal += reviewTotal;
        } else if (review.type === 'panel') {
          panelTotal += reviewTotal;
        }
      }
    });

    return { total: guideTotal + panelTotal, guide: guideTotal, panel: panelTotal };
  };

  const marks = calculateMarks();

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
          />
        </div>
      </Modal>

      <MarksDetailModal
        isOpen={isMarksModalOpen}
        onClose={() => setIsMarksModalOpen(false)}
        student={student}
      />
    </>
  );
};

export default StudentDetailsModal;
