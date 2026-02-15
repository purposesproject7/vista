import React, { useState, useEffect } from 'react';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import { PencilSquareIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import api from '../../../services/api';

const EditProjectModal = ({ isOpen, onClose, project, onSuccess }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && project) {
            setName(project.name || '');
            setError(null);
        }
    }, [isOpen, project]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            setError("Project name cannot be empty.");
            return;
        }

        if (name.trim() === project?.name) {
            onClose(); // No changes
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await api.put(`/project/${project._id}`, {
                projectId: project._id,
                projectUpdates: {
                    name: name.trim()
                }
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Failed to update project:", err);
            setError(err.response?.data?.message || "Failed to update project name.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Project Title"
            maxWidth="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl flex items-start gap-3 border border-slate-100">
                    <PencilSquareIcon className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
                    <div className="text-sm text-slate-600">
                        <p className="font-bold mb-1 text-slate-800">Update Project Name</p>
                        <p>Enter the new title for the project <strong>{project?.name}</strong>.</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter project name..."
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                        autoFocus
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        type="button"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={loading || !name.trim()}
                        className="font-bold shadow-lg shadow-blue-100"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default EditProjectModal;
