import React, { useState } from 'react';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import { LockClosedIcon } from '@heroicons/react/24/outline';

const RequestEditModal = ({ isOpen, onClose, teamName, onConfirm }) => {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) return;

        setIsSubmitting(true);
        // Simulate API call
        await new Promise(r => setTimeout(r, 800));
        onConfirm(reason);
        setIsSubmitting(false);
        setReason('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Request Edit Access"
            size="md"
        >
            <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                        <LockClosedIcon className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">Metric Entry Locked</h3>
                        <p className="text-gray-500 text-sm mt-1">
                            The deadline for <strong>{teamName}</strong> has passed.
                            Please provide a valid reason to request temporary edit access.
                        </p>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Reason for Request <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none outline-none"
                        placeholder="e.g., Medical emergency, technical issue..."
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        variant="warning" // Assuming we have or 'primary' if not
                        onClick={handleSubmit}
                        disabled={!reason.trim() || isSubmitting}
                        className="bg-orange-600 hover:bg-orange-700 text-white border-transparent"
                    >
                        {isSubmitting ? 'Requesting...' : 'Submit Request'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default RequestEditModal;
