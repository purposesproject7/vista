// src/features/admin/components/faculty-management/FacultyModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../../../shared/components/Modal';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';
import Button from '../../../../shared/components/Button';
import { SCHOOLS, PROGRAMMES_BY_SCHOOL, YEARS } from '../../../../shared/constants/config';

const FacultyModal = ({ isOpen, onClose, onSave, faculty }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    school: '',
    program: '',
    year: '',
    department: '',
    designation: '',
    specialization: ''
  });

  useEffect(() => {
    if (faculty) {
      setFormData(faculty);
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        school: SCHOOLS[0]?.name || '',
        program: '',
        year: YEARS[0]?.label || '',
        department: '',
        designation: '',
        specialization: ''
      });
    }
  }, [faculty, isOpen]);

  const schools = useMemo(() => 
    SCHOOLS.map(school => ({ value: school.name, label: school.name })),
  []);

  const programs = useMemo(() => {
    const allPrograms = Object.values(PROGRAMMES_BY_SCHOOL).flat();
    return allPrograms.map(program => ({ value: program.name, label: program.name }));
  }, []);

  const years = useMemo(() => 
    YEARS.map(year => ({ value: year.label, label: year.label })),
  []);

  const departments = [
    { value: 'Computer Science', label: 'Computer Science' },
    { value: 'Electronics', label: 'Electronics' },
    { value: 'Mechanical', label: 'Mechanical' },
    { value: 'Civil', label: 'Civil' },
    { value: 'Business', label: 'Business' }
  ];

  const designations = [
    { value: 'Professor', label: 'Professor' },
    { value: 'Associate Professor', label: 'Associate Professor' },
    { value: 'Assistant Professor', label: 'Assistant Professor' },
    { value: 'Senior Lecturer', label: 'Senior Lecturer' },
    { value: 'Lecturer', label: 'Lecturer' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
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
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
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
              <Select
                value={formData.school}
                onChange={(e) => handleChange('school', e.target.value)}
                options={schools}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.program}
                onChange={(e) => handleChange('program', e.target.value)}
                options={programs}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.year}
                onChange={(e) => handleChange('year', e.target.value)}
                options={years}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                options={departments}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Designation <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.designation}
                onChange={(e) => handleChange('designation', e.target.value)}
                options={designations}
                required
              />
            </div>

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
