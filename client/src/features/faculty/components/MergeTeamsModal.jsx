import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import { UserGroupIcon, ExclamationTriangleIcon, TrashIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import api from '../../../services/api';

const MergeTeamsModal = ({ isOpen, onClose, context, projects = [], onSuccess }) => {
    const [selectedProjectIds, setSelectedProjectIds] = useState([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(null); // ID of project being deleted

    // Dropdown States
    const [selectedProjectToAdd, setSelectedProjectToAdd] = useState('');
    const [selectedStudentToAdd, setSelectedStudentToAdd] = useState('');

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedProjectIds([]);
            setNewProjectName('');
            setError(null);
            setSelectedProjectToAdd('');
            setSelectedStudentToAdd('');
        }
    }, [isOpen]);

    // Context Projects (Source of Truth)
    const contextProjects = useMemo(() => {
        return projects.filter(p =>
            p.status !== 'archived' &&
            p.school === context.school &&
            p.program === context.program &&
            p.academicYear === context.year
        );
    }, [projects, context]);

    // Derived: All Students for Dropdown
    const allStudents = useMemo(() => {
        const students = [];
        contextProjects.forEach(p => {
            if (p.students) {
                p.students.forEach(s => {
                    // Enrich student object with their project ID for easy lookup
                    if (!students.find(existing => existing.regNo === s.regNo)) {
                        students.push({ ...s, projectId: p._id, projectName: p.name });
                    }
                });
            }
        });
        return students.sort((a, b) => a.regNo.localeCompare(b.regNo));
    }, [contextProjects]);

    // Action: Add Project to Workspace
    const handleAddProject = (projectId) => {
        if (!projectId) return;
        if (!selectedProjectIds.includes(projectId)) {
            setSelectedProjectIds(prev => [...prev, projectId]);
        }
        setSelectedProjectToAdd(''); // Reset dropdown
    };

    // Action: Add Student's Project to Workspace
    const handleAddStudentProject = (studentRegNo) => {
        if (!studentRegNo) return;
        const student = allStudents.find(s => s.regNo === studentRegNo);
        if (student && student.projectId) {
            handleAddProject(student.projectId);
        }
        setSelectedStudentToAdd(''); // Reset dropdown
    };

    // Action: Remove from Workspace
    const handleUnselect = (e, projectId) => {
        e.stopPropagation();
        setSelectedProjectIds(prev => prev.filter(id => id !== projectId));
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

    const handleDelete = async (e, projectId) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this project? The students will remain in the system but the project allocation will be removed.")) {
            setDeleteLoading(projectId);
            try {
                await api.delete(`/project/${projectId}`);
                // Remove from selection if deleted
                setSelectedProjectIds(prev => prev.filter(id => id !== projectId));
                onSuccess(); // Refresh parent data
            } catch (err) {
                console.error("Delete failed:", err);
                setError(err.response?.data?.message || "Failed to delete project.");
            } finally {
                setDeleteLoading(null);
            }
        }
    };

    // Get the actual project objects for the selected IDs
    const workspaceProjects = useMemo(() => {
        return contextProjects.filter(p => selectedProjectIds.includes(p._id));
    }, [contextProjects, selectedProjectIds]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Project Teams" maxWidth="max-w-4xl">
            <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl flex items-start gap-3 border border-slate-100">
                    <UserGroupIcon className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
                    <div className="text-sm text-slate-600">
                        <p className="font-bold mb-1 text-slate-800">Team Workspace</p>
                        <p>Select teams using the dropdowns below to add them to your workspace. From there, you can merge or delete them.</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {/* Selection Area (Dropdowns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative group">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Add by Project</label>
                        <div className="flex gap-2">
                            <select
                                value={selectedProjectToAdd}
                                onChange={(e) => handleAddProject(e.target.value)}
                                className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white hover:border-blue-300"
                            >
                                <option value="">Select a project to add...</option>
                                {contextProjects.map(p => {
                                    // Format: Name (Reg1, Reg2...)
                                    const regNos = p.students?.map(s => s.regNo).join(', ') || 'No Students';
                                    return (
                                        <option key={p._id} value={p._id}>
                                            {p.name} ({regNos})
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>

                    <div className="relative group">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Add by Student</label>
                        <div className="flex gap-2">
                            <select
                                value={selectedStudentToAdd}
                                onChange={(e) => handleAddStudentProject(e.target.value)}
                                className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white hover:border-blue-300"
                            >
                                <option value="">Select a student...</option>
                                {allStudents.map(s => (
                                    <option key={s.regNo} value={s.regNo}>
                                        {s.regNo} - {s.name} (in {s.projectName})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                    {/* Workspace List */}
                    <div className="lg:col-span-2 flex flex-col h-[400px]">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <label className="block text-sm font-bold text-slate-700">
                                Workspace ({workspaceProjects.length})
                            </label>
                            {workspaceProjects.length > 0 && (
                                <button
                                    onClick={() => setSelectedProjectIds([])}
                                    className="text-xs text-slate-400 hover:text-red-500 underline"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-sm">
                            {workspaceProjects.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center border-2 border-dashed border-slate-100 m-2 rounded-lg">
                                    <PlusIcon className="w-8 h-8 mb-2 opacity-50" />
                                    <p className="text-sm font-medium">Workspace is empty</p>
                                    <p className="text-xs mt-1">Select projects or students above to add them here.</p>
                                </div>
                            ) : (
                                workspaceProjects.map(project => (
                                    <div
                                        key={project._id}
                                        className="p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors group relative"
                                    >
                                        <div className="flex-1 min-w-0 pr-8">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-sm font-bold text-slate-800 truncate" title={project.name}>
                                                    {project.name}
                                                </h4>
                                            </div>

                                            <div className="flex flex-wrap gap-1.5">
                                                {project.students && project.students.length > 0 ? (
                                                    project.students.map(student => (
                                                        <span key={student._id || student} className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                            {student.regNo}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs italic text-slate-400">No students</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-1 items-end">
                                            <button
                                                onClick={(e) => handleUnselect(e, project._id)}
                                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                                                title="Remove from Workspace"
                                            >
                                                <XMarkIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(e, project._id)}
                                                className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Permanently Delete Project"
                                                disabled={deleteLoading === project._id}
                                            >
                                                {deleteLoading === project._id ? (
                                                    <div className="w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                                                ) : (
                                                    <TrashIcon className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Merge Actions */}
                    <div className="lg:col-span-1 bg-slate-50 p-5 rounded-xl border border-slate-200 h-fit">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <UserGroupIcon className="w-4 h-4 text-blue-600" />
                            Merge Selected
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    New Project Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    placeholder="Enter new combined title..."
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                                />
                            </div>

                            <div className="text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-100">
                                <div className="flex justify-between mb-1">
                                    <span>Selected Teams:</span>
                                    <span className="font-bold">{selectedProjectIds.length}</span>
                                </div>
                                <p className="italic text-[10px] text-slate-400">
                                    {selectedProjectIds.length < 2 ? "Select at least 2 teams to enable merging." : "Ready to merge."}
                                </p>
                            </div>

                            <Button
                                variant="primary"
                                onClick={handleMerge}
                                className="w-full justify-center mt-2 font-bold shadow-lg shadow-blue-100"
                                disabled={loading || selectedProjectIds.length < 2 || !newProjectName.trim()}
                            >
                                {loading ? 'Merging...' : 'Confirm Merge'}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                    <Button variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default MergeTeamsModal;
