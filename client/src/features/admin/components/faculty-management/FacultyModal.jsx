// src/features/admin/components/faculty-management/FacultyModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../../../../shared/components/Modal';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';
import Button from '../../../../shared/components/Button';

const FacultyModal = ({ isOpen, onClose, onSave, faculty }) => {
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    emailId: '',
    phoneNumber: '',
    school: '',
    department: '',
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
          school: faculty.school || '',
          department: faculty.department || '',
          specialization: faculty.specialization || '',
          role: faculty.role || 'faculty'
        });
      } else {
        setFormData({
          name: '',
          employeeId: '',
          emailId: '',
          phoneNumber: '',
          school: '',
          department: '',
          specialization: '',
          role: 'faculty'
        });
      }
    }
  }, [faculty, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.emailId.trim()) {
      alert('Please fill in all required fields');
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
              onChange={(value) => handleChange('name', value)}
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
              onChange={(value) => handleChange('employeeId', value)}
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
                onChange={(value) => handleChange('emailId', value)}
                placeholder="john.smith@university.edu"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <Input
                type="tel"
                value={formData.phoneNumber}
                onChange={(value) => handleChange('phoneNumber', value)}
                placeholder="+91 9876543210"
              />
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h4 className="font-semibold text-gray-900 mb-3">Academic Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.school}
                onChange={(value) => handleChange('school', value)}
                placeholder="School of Engineering"
                required
                disabled={!!faculty}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.department}
                onChange={(value) => handleChange('department', value)}
                placeholder="Computer Science"
                required
                disabled={!!faculty}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialization
              </label>
              <Input
                value={formData.specialization}
                onChange={(value) => handleChange('specialization', value)}
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
