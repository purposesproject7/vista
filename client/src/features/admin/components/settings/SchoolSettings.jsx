// src/features/admin/components/settings/SchoolSettings.jsx
import React, { useState, useEffect } from 'react';
import Card from '../../../../shared/components/Card';
import Button from '../../../../shared/components/Button';
import Input from '../../../../shared/components/Input';
import Modal from '../../../../shared/components/Modal';
import { PlusIcon, PencilIcon, TrashIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { useToast } from '../../../../shared/hooks/useToast';
import { createSchool, updateSchool, deleteSchool } from '../../services/adminApi';

const SchoolSettings = ({ schools, onUpdate }) => {
  const [schoolList, setSchoolList] = useState(schools);

  // Sync with props when they change
  useEffect(() => {
    setSchoolList(schools);
  }, [schools]);
  const [showModal, setShowModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const handleAdd = () => {
    setEditingSchool(null);
    setFormData({ name: '', code: '' });
    setShowModal(true);
  };

  const handleEdit = (school) => {
    setEditingSchool(school);
    setFormData({ name: school.name, code: school.code });
    setShowModal(true);
  };

  const handleDelete = async (schoolId) => {
    if (!window.confirm('Are you sure you want to delete this school? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      const response = await deleteSchool(schoolId);
      
      if (response.success) {
        const updated = schoolList.filter(s => s.id !== schoolId);
        setSchoolList(updated);
        onUpdate(updated);
        showToast('School deleted successfully', 'success');
      } else {
        showToast(response.message || 'Failed to delete school', 'error');
      }
    } catch (error) {
      console.error('Error deleting school:', error);
      showToast(error.response?.data?.message || 'Failed to delete school', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.code.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      setSaving(true);
      let response;
      
      if (editingSchool) {
        // Update existing school
        response = await updateSchool(
          editingSchool.id,
          formData.name.trim(),
          formData.code.trim().toUpperCase()
        );
      } else {
        // Create new school
        response = await createSchool(
          formData.name.trim(),
          formData.code.trim().toUpperCase()
        );
      }
      
      if (response.success) {
        // Reload schools from backend
        window.location.reload();
        showToast(editingSchool ? 'School updated successfully' : 'School added successfully', 'success');
      } else {
        showToast(response.message || 'Operation failed', 'error');
      }
    } catch (error) {
      console.error('Error saving school:', error);
      showToast(error.response?.data?.message || 'Failed to save school', 'error');
    } finally {
      setSaving(false);
      setShowModal(false);
      setFormData({ name: '', code: '' });
    }
  };

  return (
    <>
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Schools</h3>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAdd}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add School
            </Button>
          </div>

          {schoolList.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BuildingOffice2Icon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No schools configured yet</p>
              <p className="text-sm mt-2">Click the button above to add your first school</p>
            </div>
          ) : (
            <div className="space-y-2">
              {schoolList.map((school) => (
                <div
                  key={school.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <span className="text-gray-900 font-medium text-lg">{school.name}</span>
                    <span className="text-gray-500 text-sm ml-2">({school.code})</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEdit(school)}
                      disabled={saving}
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDelete(school.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={saving}
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
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setFormData({ name: '', code: '' });
        }}
        title={editingSchool ? 'Edit School' : 'Add School'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., School of Computing"
              required
              autoFocus
              className="text-lg py-3"
            />
            <p className="mt-2 text-sm text-gray-500">
              Enter the full school name
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School Code <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g., SCOPE"
              required
              className="text-lg py-3"
            />
            <p className="mt-2 text-sm text-gray-500">
              Enter a short code for the school (will be converted to uppercase)
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                setFormData({ name: '', code: '' });
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : (editingSchool ? 'Update' : 'Add')} School
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default SchoolSettings;
