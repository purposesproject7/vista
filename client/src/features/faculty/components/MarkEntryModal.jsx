// src/features/faculty/components/MarkEntryModal.jsx - REPLACE
import React, { useEffect, useState } from 'react';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import CompactRubricTable from './CompactRubricTable';
import Toast from '../../../shared/components/Toast';
import { useMarkEntry } from '../hooks/useMarkEntry';

const MarkEntryModal = ({ isOpen, onClose, review, team, onSuccess }) => {
  const [toast, setToast] = useState(null);
  
  const {
    marks,
    errors,
    submitting,
    initializeMarks,
    updateMark,
    submitMarks,
    getStudentTotal
  } = useMarkEntry(review, team);

  useEffect(() => {
    if (isOpen) {
      initializeMarks();
    }
  }, [isOpen, initializeMarks]);

  const handleSubmit = async () => {
    const result = await submitMarks();
    if (result.success) {
      setToast({ message: 'Marks submitted successfully!', type: 'success' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } else {
      setToast({ message: result.message, type: 'error' });
    }
  };

  if (!team) return null;

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`${review.name} - ${team.name}`}
        size="full"
      >
        <div className="max-h-[80vh] overflow-y-auto">
          <CompactRubricTable
            students={team.students}
            rubrics={review.rubrics}
            marks={marks}
            errors={errors}
            onMarkChange={updateMark}
            getStudentTotal={getStudentTotal}
          />
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-t-2 border-blue-200 bg-white">
          <div className="text-sm">
            {hasErrors ? (
              <span className="text-red-600 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                Please fix errors before submitting
              </span>
            ) : (
              <span className="text-green-600 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                ✓ Ready to submit
              </span>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button 
              variant="success" 
              onClick={handleSubmit}
              disabled={submitting || hasErrors}
              size="sm"
            >
              {submitting ? 'Submitting...' : 'Submit Marks'}
            </Button>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default MarkEntryModal;
