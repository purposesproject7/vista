import React, { useState, useEffect } from 'react';
import Modal from '../../../../shared/components/Modal';
import Button from '../../../../shared/components/Button';
import { useToast } from '../../../../shared/hooks/useToast';
import * as adminApi from '../../services/adminApi';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

const ProjectEditModal = ({ isOpen, onClose, project, onProjectUpdated }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        guideFacultyEmpId: '',
        specialization: '',
        type: ''
    });
    const [students, setStudents] = useState([]); // List of current students
    const [removedStudents, setRemovedStudents] = useState([]); // RegNos to remove
    const [newStudentRegNo, setNewStudentRegNo] = useState(''); // Input for adding
    const [addedStudents, setAddedStudents] = useState([]); // RegNos to add

    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        if (project && isOpen) {
            setFormData({
                name: project.name || '',
                description: project.description || '',
                guideFacultyEmpId: project.guideFaculty?.employeeId || '',
                specialization: project.specialization || '',
                type: project.type || 'Capstone Project'
            });
            setStudents(project.students || []);
            setRemovedStudents([]);
            setAddedStudents([]);
            setNewStudentRegNo('');
        }
    }, [project, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRemoveStudent = (student) => {
        // If student was just added locally, just remove from added list
        if (addedStudents.includes(student.regNo)) {
            setAddedStudents(prev => prev.filter(r => r !== student.regNo));
            setStudents(prev => prev.filter(s => s.regNo !== student.regNo));
            return;
        }

        // Mark for removal
        setRemovedStudents(prev => [...prev, student.regNo]);
        // Visually remove
        setStudents(prev => prev.filter(s => s.regNo !== student.regNo));
    };

    const handleAddStudent = async () => {
        if (!newStudentRegNo.trim()) return;
        const regNo = newStudentRegNo.trim().toUpperCase();

        // Check if already in list
        if (students.some(s => s.regNo === regNo)) {
            showToast('Student is already in the project', 'error');
            return;
        }

        // We don't validate existence here, backend will do it. 
        // Or we can add to 'addedStudents' and show visual feedback.
        // Ideally we should lookup name, but for now we just add the RegNo entry.
        setAddedStudents(prev => [...prev, regNo]);
        setStudents(prev => [...prev, { regNo: regNo, name: 'Pending Verification...' }]); // Placeholder
        setNewStudentRegNo('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            const updates = {
                ...formData, // basic fields
                addStudents: addedStudents,
                removeStudents: removedStudents
            };

            // Only include guide if changed (to trigger reassignment logic properly)
            if (formData.guideFacultyEmpId === project.guideFaculty?.employeeId) {
                delete updates.guideFacultyEmpId;
            }

            const response = await adminApi.updateProject(project._id, updates);

            if (response.success) {
                showToast('Project updated successfully', 'success');
                onProjectUpdated(response.data);
                onClose();
            } else {
                showToast(response.message || 'Failed to update project', 'error');
            }
        } catch (error) {
            // If error details in response
            const msg = error.response?.data?.message || error.message || 'Error updating project';
            showToast(msg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !project) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Project"
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Project Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Project Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    />
                </div>

                {/* Guide */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Guide Employee ID</label>
                    <input
                        type="text"
                        name="guideFacultyEmpId"
                        value={formData.guideFacultyEmpId}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        placeholder="e.g. 10025"
                    />
                    <p className="text-xs text-gray-500 mt-1">Changing this will reassign the guide.</p>
                </div>

                {/* Team Members */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Team Members</label>

                    {/* List */}
                    <div className="bg-gray-50 p-3 rounded-md mb-3 space-y-2 max-h-40 overflow-y-auto">
                        {students.map((student, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-2 border rounded shadow-sm">
                                <span className="text-sm">
                                    <span className="font-medium">{student.regNo}</span>
                                    {student.name && <span className="text-gray-500 ml-2">- {student.name}</span>}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveStudent(student)}
                                    className="text-red-500 hover:text-red-700"
                                    title="Remove Student"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {students.length === 0 && <p className="text-sm text-gray-500 text-center">No students assigned.</p>}
                    </div>

                    {/* Add Student */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newStudentRegNo}
                            onChange={(e) => setNewStudentRegNo(e.target.value)}
                            placeholder="Enter Student Reg No to Add"
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        />
                        <Button type="button" variant="secondary" onClick={handleAddStudent} className="gap-1">
                            <PlusIcon className="w-4 h-4" /> Add
                        </Button>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default ProjectEditModal;
