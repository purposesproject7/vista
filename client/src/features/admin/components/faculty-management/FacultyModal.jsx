// src/features/admin/components/faculty-management/FacultyModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../../../../shared/components/Modal';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';
import Button from '../../../../shared/components/Button';

const FacultyModal = ({ isOpen, onClose, onSave, faculty, filters }) => {
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    emailId: '',
    phoneNumber: '',
    password: '',
    specialization: '',
    role: 'faculty'
  });

  useEffect(() => {
    if (isOpen) {
      if (faculty) {
        // Map backend fields to form fields
        setFormData({
          name: faculty.name || '',
          employeeId: faculty.employeeId || '',
          emailId: faculty.emailId || faculty.email || '',
          phoneNumber: faculty.phoneNumber || faculty.phone || '',
          password: '', // Don't show existing password
          specialization: faculty.specialization || '',
          role: faculty.role || 'faculty'
        });
      } else {
        setFormData({
          name: '',
          employeeId: '',
          emailId: '',
          phoneNumber: '',
          password: '',
          specialization: '',
          role: 'faculty'
        });
      }
    }
  }, [faculty, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.emailId.trim() || !formData.employeeId.trim() || !formData.phoneNumber.trim()) {
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

    // Validate password for new faculty
    if (!faculty && !formData.password) {
      alert('Password is required for new faculty');
      return;
    }

    if (!faculty && formData.password.length < 8) {
      alert('Password must be at least 8 characters long');
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
      title={faculty ? 'Edit Faculty Member' : 'Add Faculty Member'}
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
              placeholder="Dr. John Smith"
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
              placeholder="EMP001"
              required
              disabled={!!faculty}
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
                placeholder="john.smith@vit.ac.in"
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

          {!faculty && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Enter password"
                required={!faculty}
              />
              <p className="mt-1 text-xs text-gray-500">
                Min 8 chars with uppercase, lowercase, number & special char
              </p>
            </div>
          )}
        </div>

        {/* Academic Information */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h4 className="font-semibold text-gray-900 mb-3">Academic Information</h4>

          {/* Display School and Department from filters as read-only */}
          {filters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  School (from filter)
                </label>
                <p className="text-sm font-semibold text-blue-900">{filters.school}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Department (from filter)
                </label>
                <p className="text-sm font-semibold text-blue-900">
                  {Array.isArray(filters.department) ? filters.department.join(', ') : filters.department}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialization
              </label>
              <Input
                value={formData.specialization}
                onChange={(e) => handleChange('specialization', e.target.value)}
                placeholder="e.g., Machine Learning, IoT"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                options={[
                  { value: 'faculty', label: 'Faculty' },
                  { value: 'admin', label: 'Admin' }
                ]}
                required
              />
            </div>
          </div>
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
            {faculty ? 'Update' : 'Add'} Faculty
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default FacultyModal;
