// src/features/project-coordinator/components/faculty-management/FacultyModal.jsx
import React, { useState } from 'react';
import Modal from '../../../../shared/components/Modal';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';
import Button from '../../../../shared/components/Button';
import { SCHOOLS, PROGRAMMES_BY_SCHOOL } from '../../../../shared/constants/config';

const FacultyModal = ({ isOpen, faculty = null, onClose, onSave }) => {
  const [formData, setFormData] = useState(faculty || {
    name: '',
    email: '',
    phone: '',
    school: '',
    programme: '',
    year: '',
    semester: '',
    department: '',
    designation: '',
    specialization: '',
  });

  const [programmes, setProgrammes] = useState(
    formData.school ? PROGRAMMES_BY_SCHOOL[formData.school] : []
  );

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSchoolChange = (e) => {
    const school = e.target.value;
    setFormData(prev => ({
      ...prev,
      school,
      programme: '',
      year: '',
      semester: '',
    }));
    setProgrammes(PROGRAMMES_BY_SCHOOL[school] || []);
  };

  const handleProgrammeChange = (e) => {
    const programme = e.target.value;
    setFormData(prev => ({
      ...prev,
      programme,
      year: '',
      semester: '',
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Valid email is required';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    if (!formData.school) newErrors.school = 'School is required';
    if (!formData.programme) newErrors.programme = 'Programme is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.designation) newErrors.designation = 'Designation is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={faculty ? 'Edit Faculty Member' : 'Add Faculty Member'}
      size="lg"
    >
      <div className="space-y-6 p-6">
        {/* Basic Information Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              error={errors.name}
              placeholder="Enter faculty name"
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              placeholder="Enter email address"
            />
            <Input
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              error={errors.phone}
              placeholder="Enter phone number"
            />
            <Input
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              error={errors.department}
              placeholder="e.g., Computer Science"
            />
          </div>
        </div>

        {/* Academic Information Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="School"
              name="school"
              value={formData.school}
              onChange={handleSchoolChange}
              options={SCHOOLS.map(s => ({ value: s.id, label: s.name }))}
              error={errors.school}
              placeholder="Select School"
            />
            <Select
              label="Programme"
              name="programme"
              value={formData.programme}
              onChange={handleProgrammeChange}
              options={programmes.map(p => ({ value: p.id, label: p.name }))}
              error={errors.programme}
              placeholder="Select Programme"
              disabled={!formData.school}
            />
            <Input
              label="Specialization"
              name="specialization"
              value={formData.specialization}
              onChange={handleInputChange}
              placeholder="e.g., Artificial Intelligence"
            />
            <Input
              label="Designation"
              name="designation"
              value={formData.designation}
              onChange={handleInputChange}
              error={errors.designation}
              placeholder="e.g., Professor, Assistant Professor"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {faculty ? 'Update Faculty' : 'Add Faculty'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default FacultyModal;
