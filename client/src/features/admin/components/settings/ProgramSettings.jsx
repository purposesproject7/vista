// src/features/admin/components/settings/ProgramSettings.jsx
import React, { useState } from 'react';
import Card from '../../../../shared/components/Card';
import Button from '../../../../shared/components/Button';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';
import Modal from '../../../../shared/components/Modal';
import { PlusIcon, PencilIcon, TrashIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../../../shared/hooks/useToast';

const ProgramSettings = ({ schools, programs, onUpdate }) => {
  const [programsBySchool, setProgramsBySchool] = useState(programs);
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [formData, setFormData] = useState({ schoolId: '', name: '' });
  const { showToast } = useToast();

  const handleAdd = () => {
    setEditingProgram(null);
    setFormData({ schoolId: schools[0]?.id || '', name: '' });
    setShowModal(true);
  };

  const handleEdit = (program, schoolId) => {
    setEditingProgram({ ...program, schoolId });
    setFormData({ schoolId, name: program.name });
    setShowModal(true);
  };

  const handleDelete = (programId, schoolId) => {
    if (window.confirm('Are you sure you want to delete this program? This action cannot be undone.')) {
      const updated = { ...programsBySchool };
      updated[schoolId] = updated[schoolId].filter(p => p.id !== programId);
      setProgramsBySchool(updated);
      onUpdate(updated);
      showToast('Program deleted successfully', 'success');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.schoolId) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    const updated = { ...programsBySchool };
    
    if (editingProgram) {
      // Remove from old school if school changed
      if (editingProgram.schoolId !== formData.schoolId) {
        updated[editingProgram.schoolId] = updated[editingProgram.schoolId].filter(
          p => p.id !== editingProgram.id
        );
      }
      
      // Update or add to new school
      if (!updated[formData.schoolId]) {
        updated[formData.schoolId] = [];
      }
      
      const existingIndex = updated[formData.schoolId].findIndex(
        p => p.id === editingProgram.id
      );
      
      if (existingIndex >= 0) {
        updated[formData.schoolId][existingIndex] = {
          ...updated[formData.schoolId][existingIndex],
          name: formData.name.trim()
        };
      } else {
        updated[formData.schoolId].push({
          id: editingProgram.id,
          name: formData.name.trim()
        });
      }
      
      showToast('Program updated successfully', 'success');
    } else {
      // Add new program
      if (!updated[formData.schoolId]) {
        updated[formData.schoolId] = [];
      }
      
      const newProgram = {
        id: String(Date.now()),
        name: formData.name.trim()
      };
      
      updated[formData.schoolId].push(newProgram);
      showToast('Program added successfully', 'success');
    }

    setProgramsBySchool(updated);
    onUpdate(updated);
    setShowModal(false);
    setFormData({ schoolId: '', name: '' });
  };

  const schoolOptions = schools.map(school => ({
    value: school.id,
    label: school.name
  }));

  return (
    <>
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Programs</h3>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAdd}
              disabled={schools.length === 0}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Program
            </Button>
          </div>

          {schools.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AcademicCapIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>Please add schools first before adding programs</p>
            </div>
          ) : (
            <div className="space-y-6">
              {schools.map((school) => (
                <div key={school.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 text-lg">
                    {school.name}
                  </h4>
                  {!programsBySchool[school.id] || programsBySchool[school.id].length === 0 ? (
                    <p className="text-gray-500 text-sm italic py-2">
                      No programs added for this school yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {programsBySchool[school.id].map((program) => (
                        <div
                          key={program.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <span className="text-gray-900 font-medium">{program.name}</span>
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEdit(program, school.id)}
                            >
                              <PencilIcon className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleDelete(program.id, school.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <TrashIcon className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setFormData({ schoolId: '', name: '' });
        }}
        title={editingProgram ? 'Edit Program' : 'Add Program'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.schoolId}
              onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
              options={schoolOptions}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Program Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., B.Tech Computer Science"
              required
              className="text-lg py-3"
            />
            <p className="mt-2 text-sm text-gray-500">
              Enter the full program name (e.g., B.Tech CSE, MBA, M.Tech ECE)
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                setFormData({ schoolId: '', name: '' });
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingProgram ? 'Update' : 'Add'} Program
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default ProgramSettings;
