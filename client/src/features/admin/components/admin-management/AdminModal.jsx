// src/features/admin/components/admin-management/AdminModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../../../../shared/components/Modal';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';
import Button from '../../../../shared/components/Button';

const AdminModal = ({ isOpen, onClose, onSave, admin }) => {
    const [formData, setFormData] = useState({
        name: '',
        employeeId: '',
        emailId: '',
        phoneNumber: '',
        password: '',
        school: '',
    });

    useEffect(() => {
        if (isOpen) {
            if (admin) {
                setFormData({
                    name: admin.name || '',
                    employeeId: admin.employeeId || '',
                    emailId: admin.emailId || admin.email || '',
                    phoneNumber: admin.phoneNumber || admin.phone || '',
                    password: '',
                    school: admin.school || '',
                });
            } else {
                setFormData({
                    name: '',
                    employeeId: '',
                    emailId: '',
                    phoneNumber: '',
                    password: '',
                    school: '',
                });
            }
        }
    }, [admin, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.emailId.trim() || !formData.employeeId.trim() || !formData.phoneNumber.trim() || !formData.school.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        // Validate email domain
        if (!formData.emailId.endsWith('@vit.ac.in')) {
            alert('Email must end with @vit.ac.in');
            return;
        }

        // Validate phone number (10 digits)
        if (!/^[6-9]\d{9}$/.test(formData.phoneNumber)) {
            alert('Please enter a valid 10-digit Indian phone number');
            return;
        }

        // Validate password for new admin
        if (!admin && !formData.password) {
            alert('Password is required for new admin');
            return;
        }

        if (!admin && formData.password.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }

        onSave(formData);
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={admin ? 'Edit Admin' : 'Add Admin'}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="Admin Name"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Employee ID <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={formData.employeeId}
                            onChange={(e) => handleChange('employeeId', e.target.value)}
                            placeholder="ADMIN002"
                            required
                            disabled={!!admin}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="email"
                                value={formData.emailId}
                                onChange={(e) => handleChange('emailId', e.target.value)}
                                placeholder="admin@vit.ac.in"
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">Must end with @vit.ac.in</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                                placeholder="9876543210"
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">10-digit Indian number</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            School <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={formData.school}
                            onChange={(e) => handleChange('school', e.target.value)}
                            placeholder="SCOPE"
                            required
                        />
                    </div>

                    {!admin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="password"
                                value={formData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                placeholder="Enter password"
                                required={!admin}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Minimum 6 characters
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                        {admin ? 'Update' : 'Add'} Admin
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AdminModal;
