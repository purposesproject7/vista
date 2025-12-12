// src/features/admin/components/settings/AcademicDataSettings.jsx
import React, { useState } from 'react';
import Card from '../../../../shared/components/Card';
import Button from '../../../../shared/components/Button';
import Input from '../../../../shared/components/Input';
import Modal from '../../../../shared/components/Modal';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../../../shared/hooks/useToast';

const AcademicDataSettings = ({ data, onUpdate, title, type }) => {
  const [items, setItems] = useState(data);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const { showToast } = useToast();

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ name: '' });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ name: item.name });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      const updated = items.filter(item => item.id !== id);
      setItems(updated);
      onUpdate(updated);
      showToast(`${title} deleted successfully`, 'success');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showToast('Please enter a name', 'error');
      return;
    }

    let updated;
    if (editingItem) {
      // Update existing
      updated = items.map(item => 
        item.id === editingItem.id 
          ? { ...item, name: formData.name.trim() }
          : item
      );
      showToast(`${title} updated successfully`, 'success');
    } else {
      // Add new
      const newItem = {
        id: String(Date.now()),
        name: formData.name.trim()
      };
      updated = [...items, newItem];
      showToast(`${title} added successfully`, 'success');
    }

    setItems(updated);
    onUpdate(updated);
    setShowModal(false);
    setFormData({ name: '' });
  };

  return (
    <>
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage {title.toLowerCase()} in the system
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAdd}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add {title}
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No {title.toLowerCase()} configured yet</p>
              <p className="text-sm mt-2">Click the button above to add your first item</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-gray-900 font-medium text-lg">{item.name}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
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
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setFormData({ name: '' });
        }}
        title={editingItem ? `Edit ${title}` : `Add ${title}`}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {title} Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              placeholder={`Enter ${title.toLowerCase()} name`}
              required
              autoFocus
              className="text-lg py-3"
            />
            <p className="mt-2 text-sm text-gray-500">
              Enter a clear, descriptive name for this {title.toLowerCase()}
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
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingItem ? 'Update' : 'Add'} {title}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default AcademicDataSettings;
