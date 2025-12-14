
import React, { useState } from 'react';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import { useEditRequest } from '../hooks/useEditRequest';

const EditRequestButton = ({ review, team, onSuccess }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reason, setReason] = useState('');
  const { requestEdit, requesting } = useEditRequest();

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason');
      return;
    }

    const result = await requestEdit(review.id, team.id, reason);
    if (result.success) {
      alert('Edit request submitted successfully!');
      setIsModalOpen(false);
      setReason('');
      onSuccess?.();
    } else {
      alert(result.message);
    }
  };

  return (
    <>
      <Button 
        variant="secondary" 
        size="sm"
        onClick={() => setIsModalOpen(true)}
      >
        Request Edit
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Request Edit Access"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Review:</p>
            <p className="font-semibold text-gray-900">{review.name}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Team:</p>
            <p className="font-semibold text-gray-900">{team.name}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Edit Request *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Explain why you need to edit after deadline..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              variant="secondary" 
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSubmit}
              disabled={requesting || !reason.trim()}
            >
              {requesting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default EditRequestButton;
