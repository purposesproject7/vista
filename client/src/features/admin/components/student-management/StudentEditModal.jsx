// src/features/admin/components/student-management/StudentEditModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../../../../shared/components/Modal';
import Button from '../../../../shared/components/Button';
import Input from '../../../../shared/components/Input';
import Card from '../../../../shared/components/Card';
import { useAuth } from '../../../../shared/hooks/useAuth';
import { useToast } from '../../../../shared/hooks/useToast';
import { updateStudent, updateStudentMarks, updateProject } from '../../services/adminApi';
import {
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    AcademicCapIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline';

const StudentEditModal = ({ isOpen, onClose, student, onSuccess }) => {
    const { isSudoAdmin } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');

    // Basic info state
    const [formData, setFormData] = useState({
        name: '',
        emailId: '',
        phoneNumber: '',
        projectTitle: '',
        PAT: false
    });

    // Marks state (for ADMIN001 only)
    const [marksData, setMarksData] = useState({});

    useEffect(() => {
        if (student) {
            setFormData({
                name: student.name || '',
                emailId: student.emailId || '',
                phoneNumber: student.phoneNumber || '',
                projectTitle: student.projectTitle || '',
                PAT: student.PAT || false
            });

            // Initialize marks data for all admins (view for regular, edit for ADMIN001)
            if (student.reviews) {
                setMarksData(student.reviews);
            }
        }
    }, [student]);

    const handleBasicInfoChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleMarksChange = (reviewName, componentName, value) => {
        setMarksData(prev => ({
            ...prev,
            [reviewName]: {
                ...prev[reviewName],
                marks: {
                    ...prev[reviewName]?.marks,
                    [componentName]: parseFloat(value) || 0
                }
            }
        }));
    };

    const handleSaveBasicInfo = async () => {
        try {
            setLoading(true);

            // 1. Update Student Info
            const studentResponse = await updateStudent(student.regNo, {
                name: formData.name,
                emailId: formData.emailId,
                phoneNumber: formData.phoneNumber,
                PAT: formData.PAT
            });

            if (!studentResponse.success) {
                showToast(studentResponse.message || 'Failed to update student', 'error');
                setLoading(false);
                return;
            }

            // 2. Update Project Title if changed and project exists
            if (student.projectId && formData.projectTitle !== student.projectTitle) {
                const projectResponse = await updateProject(student.projectId, { name: formData.projectTitle });
                if (!projectResponse.success) {
                    showToast(projectResponse.message || 'Failed to update project title', 'error');
                    // We continue even if project update fails, but warn user
                }
            }

            showToast('Information updated successfully', 'success');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating information:', error);
            showToast(error.response?.data?.message || 'Failed to update information', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveMarks = async () => {
        try {
            setLoading(true);
            const response = await updateStudentMarks(student.regNo, marksData);

            if (response.success) {
                showToast('Student marks updated successfully', 'success');
                onSuccess();
                onClose();
            } else {
                showToast(response.message || 'Failed to update marks', 'error');
            }
        } catch (error) {
            console.error('Error updating marks:', error);
            showToast(error.response?.data?.message || 'Failed to update marks', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!student) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Edit Student - ${student.name}`}
            size="xl"
        >
            <div className="space-y-4">
                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('basic')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'basic'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            Basic Information
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('marks')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'marks'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <AcademicCapIcon className="w-4 h-4" />
                            Marks {!isSudoAdmin() && <LockClosedIcon className="w-3 h-3 text-gray-400" />}
                        </div>
                    </button>
                </div>

                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                    <Card>
                        <div className="space-y-4">
                            <Input
                                label="Name"
                                name="name"
                                value={formData.name}
                                onChange={handleBasicInfoChange}
                                placeholder="Student name"
                                required
                                startIcon={<UserIcon className="w-5 h-5" />}
                            />
                            <Input
                                label="Email"
                                name="emailId"
                                type="email"
                                value={formData.emailId}
                                onChange={handleBasicInfoChange}
                                placeholder="student@example.com"
                                required
                                startIcon={<EnvelopeIcon className="w-5 h-5" />}
                            />
                            <Input
                                label="Phone Number"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleBasicInfoChange}
                                placeholder="+91 1234567890"
                                startIcon={<PhoneIcon className="w-5 h-5" />}
                            />

                            {student.projectId && (
                                <Input
                                    label="Project Title"
                                    name="projectTitle"
                                    value={formData.projectTitle}
                                    onChange={handleBasicInfoChange}
                                    placeholder="Project Title"
                                />
                            )}

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="PAT"
                                    name="PAT"
                                    checked={formData.PAT}
                                    onChange={handleBasicInfoChange}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="PAT" className="ml-2 text-sm text-gray-700">
                                    PAT Student (Project Assistance Team)
                                </label>
                            </div>

                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <p className="text-xs text-gray-600">
                                    <strong>Registration Number:</strong> {student.regNo} (Read-only)
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="secondary" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSaveBasicInfo}
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Marks Tab - Visible to all, editable only by ADMIN001 */}
                {activeTab === 'marks' && (
                    <div className="space-y-4">
                        {!isSudoAdmin() && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                                <LockClosedIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-blue-800">
                                    <strong>Read-Only Mode:</strong> Only ADMIN001 can edit student marks. You can view the marks below.
                                </p>
                            </div>
                        )}

                        {Object.entries(marksData).length === 0 ? (
                            <Card>
                                <p className="text-center text-gray-500 py-8">
                                    No review data available for this student
                                </p>
                            </Card>
                        ) : (
                            Object.entries(marksData).map(([reviewName, reviewData]) => (
                                <Card key={reviewName}>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <AcademicCapIcon className="w-4 h-4 text-blue-600" />
                                        {reviewName}
                                    </h3>
                                    <div className="space-y-3">
                                        {reviewData.marks && Object.entries(reviewData.marks).map(([componentName, value]) => (
                                            <div key={componentName}>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    {componentName}
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.5"
                                                    value={value}
                                                    onChange={(e) => handleMarksChange(reviewName, componentName, e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-not-allowed"
                                                    disabled={!isSudoAdmin() || reviewData.locked}
                                                />
                                            </div>
                                        ))}
                                        {reviewData.locked && (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                                                <LockClosedIcon className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                                <p className="text-xs text-yellow-800">
                                                    This review is locked and cannot be edited
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))
                        )}

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="secondary" onClick={onClose}>
                                {isSudoAdmin() ? 'Cancel' : 'Close'}
                            </Button>
                            {isSudoAdmin() && (
                                <Button
                                    variant="primary"
                                    onClick={handleSaveMarks}
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : 'Save Marks'}
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default StudentEditModal;
