import React, { useState, useEffect } from 'react';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import { UserGroupIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import api from '../../../services/api';

const MergeTeamsModal = ({ isOpen, onClose, context, projects = [], onSuccess }) => {
    const [selectedProjectIds, setSelectedProjectIds] = useState([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedProjectIds([]);
            setNewProjectName('');
            setError(null);
        }
    }, [isOpen]);

    // Filter projects relevant to the current context (School/Program/Year)
    // Although `projects` passed in should ideally already be filtered, double check here
    const availableProjects = projects.filter(p =>
        p.status !== 'archived' &&
        p.school === context.school &&
        p.program === context.program &&
        p.academicYear === context.year
    );

    const handleToggleProject = (id) => {
        setSelectedProjectIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(pid => pid !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handleMerge = async () => {
        if (selectedProjectIds.length < 2) {
            setError("Please select at least two teams to merge.");
            return;
        }
        if (!newProjectName.trim()) {
            setError("Please enter a name for the new merged team.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await api.post('/faculty/projects/merge', {
                projectIds: selectedProjectIds,
                newName: newProjectName
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Merge failed:", err);
            setError(err.response?.data?.message || "Failed to merge teams.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Merge Teams">
            <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3">
                    <UserGroupIcon className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-sm text-blue-800">
                        <p className="font-bold mb-1">Merge Multiple Teams</p>
                        <p>Combine selected teams into a new single project. Students and their existing marks will be preserved and linked to the new team.</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        New Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="e.g., AI Based Traffic Management (Merged)"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Select Teams to Merge <span className="text-red-500">*</span>
                    </label>
                    <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                        {availableProjects.length === 0 ? (
                            <div className="p-4 text-center text-slate-500 text-sm">
                                No active teams found in this context.
                            </div>
                        ) : (
                            availableProjects.map(project => (
                                <div
                                    key={project._id}
                                    className={`p-3 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors ${selectedProjectIds.includes(project._id) ? 'bg-blue-50' : ''}`}
                                    onClick={() => handleToggleProject(project._id)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedProjectIds.includes(project._id)}
                                        onChange={() => { }} // Handled by div click
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-slate-800">{project.name}</div>
                                        <div className="text-xs text-slate-500">{project.students?.length || 0} Students</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <p className="text-xs text-slate-400 mt-2 text-right">
                        {selectedProjectIds.length} teams selected
                    </p>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button variant="secondary" onClick={onClose} className="flex-1" disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleMerge}
                        className="flex-1"
                        disabled={loading || selectedProjectIds.length < 2 || !newProjectName.trim()}
                    >
                        {loading ? 'Merging...' : 'Merge Teams'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default MergeTeamsModal;
