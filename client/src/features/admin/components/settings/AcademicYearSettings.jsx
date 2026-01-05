// src/features/admin/components/settings/AcademicYearSettings.jsx
import React, { useState, useEffect } from 'react';
import Card from '../../../../shared/components/Card';
import Button from '../../../../shared/components/Button';
import Input from '../../../../shared/components/Input';
import Modal from '../../../../shared/components/Modal';
import { PlusIcon, PencilIcon, TrashIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../../../shared/hooks/useToast';
import { createAcademicYear, updateAcademicYear, deleteAcademicYear } from '../../services/adminApi';

const AcademicYearSettings = ({ years, onUpdate }) => {
  const [yearList, setYearList] = useState(years);

  // Sync with props when they change
  useEffect(() => {
    setYearList(years);
  }, [years]);
  const [showModal, setShowModal] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const handleAdd = () => {
    setEditingYear(null);
    setFormData({ name: '' });
    setShowModal(true);
  };

  const handleEdit = (year) => {
    setEditingYear(year);
    setFormData({ name: year.name });
    setShowModal(true);
  };

  const handleDelete = async (yearId) => {
    if (!window.confirm('Are you sure you want to delete this academic year? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      const response = await deleteAcademicYear(yearId);
      
      if (response.success) {
        const updated = yearList.filter(y => y.id !== yearId);
        setYearList(updated);
        onUpdate(updated);
        showToast('Academic year deleted successfully', 'success');
      } else {
        showToast(response.message || 'Failed to delete academic year', 'error');
      }
    } catch (error) {
      console.error('Error deleting academic year:', error);
      showToast(error.response?.data?.message || 'Failed to delete academic year', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showToast('Please enter an academic year', 'error');
      return;
    }

    try {
      setSaving(true);
      let response;
      
      if (editingYear) {
        // Update existing year
        response = await updateAcademicYear(
          editingYear.id,
          formData.name.trim()
        );
      } else {
        // Create new year
        response = await createAcademicYear(formData.name.trim());
      }
      
      if (response.success) {
        // Reload years from backend
        window.location.reload();
        showToast(editingYear ? 'Academic year updated successfully' : 'Academic year added successfully', 'success');
      } else {
        showToast(response.message || 'Operation failed', 'error');
      }
    } catch (error) {
      console.error('Error saving academic year:', error);
      showToast(error.response?.data?.message || 'Failed to save academic year', 'error');
    } finally {
      setSaving(false);
      setShowModal(false);
      setFormData({ name: '' });
    }
  };

  return (
    <>
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Academic Years & Semesters</h3>
              <p className="text-sm text-gray-500 mt-1">Manage academic years with semester information (e.g., 2024-25 Fall, 2024-25 Winter)</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAdd}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Academic Year
            </Button>
          </div>

          {yearList.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CalendarDaysIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No academic years configured yet</p>
              <p className="text-sm mt-2">Click the button above to add your first academic year with semester (e.g., 2024-25 Fall)</p>
            </div>
          ) : (
            <div className="space-y-2">
              {yearList.map((year) => (
                <div
                  key={year.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-gray-900 font-medium text-lg">{year.name}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEdit(year)}
                      disabled={saving}
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDelete(year.id)}
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
          setFormData({ name: '' });
        }}
        title={editingYear ? 'Edit Academic Year' : 'Add Academic Year'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Year & Semester <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              placeholder="e.g., 2024-25 Fall, 2024-25 Winter, 2025-26 Fall"
              required
              autoFocus
              className="text-lg py-3"
            />
            <p className="mt-2 text-sm text-gray-500">
              Enter the academic year with semester (e.g., 2024-25 Fall, 2024-25 Winter, 2025-26 Fall)
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                setFormData({ name: '' });
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : (editingYear ? 'Update' : 'Add')} Academic Year
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default AcademicYearSettings;
