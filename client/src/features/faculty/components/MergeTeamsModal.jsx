import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import { UserGroupIcon, ExclamationTriangleIcon, TrashIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import api from '../../../services/api';

const MergeTeamsModal = ({ isOpen, onClose, context, projects = [], onSuccess }) => {
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
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
            setSelectedStudentIds([]);
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

    // Action: Add Project to Workspace (Adds ALL students from project)
    const handleAddProject = (projectId) => {
        if (!projectId) return;
        const project = contextProjects.find(p => p._id === projectId);
        if (project && project.students) {
            const studentIds = project.students.map(s => s._id);
            setSelectedStudentIds(prev => {
                const newIds = new Set([...prev, ...studentIds]);
                return Array.from(newIds);
            });
        }
        setSelectedProjectToAdd(''); // Reset dropdown
    };

    // Action: Add Student to Workspace
    const handleAddStudent = (studentRegNo) => {
        if (!studentRegNo) return;
        const student = allStudents.find(s => s.regNo === studentRegNo);
        if (student) {
            setSelectedStudentIds(prev => {
                if (!prev.includes(student._id)) {
                    return [...prev, student._id];
                }
                return prev;
            });
        }
        setSelectedStudentToAdd(''); // Reset dropdown
    };

    // Action: Remove Member from Workspace
    const handleUnselect = (e, studentId) => {
        e.stopPropagation();
        setSelectedStudentIds(prev => prev.filter(id => id !== studentId));
    };

    const handleMerge = async () => {
        if (selectedStudentIds.length < 1) { // Technically can make a project with 1 student, but usually merge implies > 1. Let's say >= 1 for flexibility or >= 2 per requirement? User said "merge", implies >= 2.
            // Actually, if they just want to move 1 student to a new project (extract), that's valid too.
            // But existing validation was < 2. Let's keep < 2 for now unless user asked otherwise.
            // Wait, user wants to "fix that only that student form that team should be added".
            // If I want to merge Student A and Student B, count is 2.
            if (selectedStudentIds.length < 2) {
                setError("Please select at least two students to form a new team.");
                return;
            }
        }

        if (!newProjectName.trim()) {
            setError("Please enter a name for the new merged team.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await api.post('/faculty/projects/merge', {
                studentIds: selectedStudentIds,
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
                // Remove students of this project from selection if deleted?
                // Logic: If project deleted, its students are "free" or removed? 
                // Requirement says "project should only be deleted after creating... OR ... selected completely".
                // This delete button is for manual deletion.
                // We should probably remove them from workspace to avoid confusion.
                const project = contextProjects.find(p => p._id === projectId);
                if (project && project.students) {
                    const pStudentIds = project.students.map(s => s._id);
                    setSelectedStudentIds(prev => prev.filter(id => !pStudentIds.includes(id)));
                }

                onSuccess(); // Refresh parent data
            } catch (err) {
                console.error("Delete failed:", err);
                setError(err.response?.data?.message || "Failed to delete project.");
            } finally {
                setDeleteLoading(null);
            }
        }
    };

    // Get the students objects for the selected IDs to display in Workspace
    const workspaceStudents = useMemo(() => {
        return allStudents.filter(s => selectedStudentIds.includes(s._id));
    }, [allStudents, selectedStudentIds]);

    // Group by Project for display
    const workspaceByProject = useMemo(() => {
        const groups = {};
        workspaceStudents.forEach(s => {
            const pName = s.projectName || 'Unknown Project';
            const pId = s.projectId || 'unknown';
            if (!groups[pId]) {
                groups[pId] = { name: pName, students: [] };
            }
            groups[pId].students.push(s);
        });
        return groups;
    }, [workspaceStudents]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Project Teams" maxWidth="max-w-4xl">
            <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl flex items-start gap-3 border border-slate-100">
                    <UserGroupIcon className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
                    <div className="text-sm text-slate-600">
                        <p className="font-bold mb-1 text-slate-800">Team Construction Workspace</p>
                        <p>Select individual students or whole teams to add to the workspace. Then create a new team with them.</p>
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
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Add All from Project</label>
                        <div className="flex gap-2">
                            <select
                                value={selectedProjectToAdd}
                                onChange={(e) => handleAddProject(e.target.value)}
                                className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white hover:border-blue-300"
                            >
                                <option value="">Select a project...</option>
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
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Add Single Student</label>
                        <div className="flex gap-2">
                            <select
                                value={selectedStudentToAdd}
                                onChange={(e) => handleAddStudent(e.target.value)}
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
                                Workspace ({workspaceStudents.length} Students)
                            </label>
                            {workspaceStudents.length > 0 && (
                                <button
                                    onClick={() => setSelectedStudentIds([])}
                                    className="text-xs text-slate-400 hover:text-red-500 underline"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-sm">
                            {workspaceStudents.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center border-2 border-dashed border-slate-100 m-2 rounded-lg">
                                    <PlusIcon className="w-8 h-8 mb-2 opacity-50" />
                                    <p className="text-sm font-medium">Workspace is empty</p>
                                    <p className="text-xs mt-1">Select students to form a new team.</p>
                                </div>
                            ) : (
                                Object.entries(workspaceByProject).map(([pId, group]) => (
                                    <div key={pId} className="p-4 bg-slate-50/50">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            {group.name}
                                            <span className="bg-slate-200 text-slate-600 px-1.5 rounded text-[10px]">{group.students.length} selected</span>
                                        </div>
                                        <div className="space-y-2">
                                            {group.students.map(student => (
                                                <div key={student._id || student.regNo} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                            {student.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-700">{student.name}</p>
                                                            <p className="text-[10px] text-slate-400">{student.regNo}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => handleUnselect(e, student._id)}
                                                        className="text-slate-300 hover:text-red-500 p-1"
                                                        title="Remove student"
                                                    >
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
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
                            Create New Team
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
                                    <span>Selected Students:</span>
                                    <span className="font-bold">{selectedStudentIds.length}</span>
                                </div>
                                <p className="italic text-[10px] text-slate-400">
                                    {selectedStudentIds.length < 2 ? "Select at least 2 students to form a team." : "Ready to create team."}
                                </p>
                            </div>

                            <Button
                                variant="primary"
                                onClick={handleMerge}
                                className="w-full justify-center mt-2 font-bold shadow-lg shadow-blue-100"
                                disabled={loading || selectedStudentIds.length < 2 || !newProjectName.trim()}
                            >
                                {loading ? 'Creating...' : 'Create Team'}
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
