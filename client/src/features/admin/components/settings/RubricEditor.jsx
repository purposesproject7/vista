// src/features/admin/components/settings/RubricEditor.jsx
import React, { useState } from 'react';
import Card from '../../../../shared/components/Card';
import Button from '../../../../shared/components/Button';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';
import { PlusIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const RubricEditor = ({ component, onSave, onCancel }) => {
  const [formData, setFormData] = useState(() => {
    const initialData = component || {
      name: '',
      category: 'Other',
      description: [],
      suggestedWeight: 0,
      predefinedSubComponents: [],
      allowCustomSubComponents: true,
      isActive: true,
      applicableFor: ['both']
    };

    // Normalize description to array if it's a string
    if (typeof initialData.description === 'string') {
      initialData.description = initialData.description.trim() !== ''
        ? [{ label: initialData.description, marks: '' }]
        : [];
    } else if (!Array.isArray(initialData.description)) {
      initialData.description = [];
    }

    return initialData;
  });

  const [showSubComponentForm, setShowSubComponentForm] = useState(false);
  const [editingSubIndex, setEditingSubIndex] = useState(null);
  const [subComponentData, setSubComponentData] = useState({
    name: '',
    description: '',
    weight: 0
  });

  const categories = [
    'Research',
    'Implementation',
    'Documentation',
    'Presentation',
    'Testing',
    'Design',
    'Analysis',
    'Other'
  ];

  const handleAddSubComponent = () => {
    setSubComponentData({ name: '', description: '', weight: 0 });
    setEditingSubIndex(null);
    setShowSubComponentForm(true);
  };

  const handleEditSubComponent = (sub, index) => {
    setSubComponentData(sub);
    setEditingSubIndex(index);
    setShowSubComponentForm(true);
  };

  const handleSaveSubComponent = () => {
    if (!subComponentData.name.trim()) {
      alert('Please enter a sub-component name');
      return;
    }

    let updatedSubs;
    if (editingSubIndex !== null) {
      updatedSubs = formData.predefinedSubComponents.map((s, i) =>
        i === editingSubIndex ? subComponentData : s
      );
    } else {
      updatedSubs = [...formData.predefinedSubComponents, subComponentData];
    }

    setFormData({ ...formData, predefinedSubComponents: updatedSubs });
    setShowSubComponentForm(false);
    setSubComponentData({ name: '', description: '', weight: 0 });
  };

  const handleDeleteSubComponent = (index) => {
    if (window.confirm('Delete this sub-component?')) {
      const updated = formData.predefinedSubComponents.filter((_, i) => i !== index);
      setFormData({ ...formData, predefinedSubComponents: updated });
    }
  };

  // Description Criteria Handlers
  const handleAddDescriptionCriteria = () => {
    const updatedDescription = [...(formData.description || [])];
    updatedDescription.push({ label: '', marks: '' });
    setFormData({ ...formData, description: updatedDescription });
  };

  const handleUpdateDescriptionCriteria = (index, field, value) => {
    const updatedDescription = [...(formData.description || [])];
    updatedDescription[index] = { ...updatedDescription[index], [field]: value };
    setFormData({ ...formData, description: updatedDescription });
  };

  const handleRemoveDescriptionCriteria = (index) => {
    const updatedDescription = (formData.description || []).filter((_, i) => i !== index);
    setFormData({ ...formData, description: updatedDescription });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a component name');
      return;
    }

    onSave(formData);
  };

  // Auto-calculate suggested weight from sub-components - REMOVED
  // React.useEffect(() => {
  //   if (formData.predefinedSubComponents.length > 0) {
  //     const total = formData.predefinedSubComponents.reduce((sum, s) => sum + (parseFloat(s.weight) || 0), 0);
  //     setFormData(prev => {
  //       if (prev.suggestedWeight !== total) {
  //         return { ...prev, suggestedWeight: total };
  //       }
  //       return prev;
  //     });
  //   }
  // }, [formData.predefinedSubComponents]);

  const handleKeyDown = (e) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  if (showSubComponentForm) {
    return (
      <Card>
        <div className="p-6">
          <div className="mb-6">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowSubComponentForm(false);
                setSubComponentData({ name: '', description: '', weight: 0 });
              }}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Component
            </Button>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            {editingSubIndex !== null ? 'Edit Sub-Component' : 'Add Sub-Component'}
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sub-Component Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subComponentData.name}
                onChange={(e) => setSubComponentData({ ...subComponentData, name: e.target.value })}
                placeholder="e.g., Literature Review"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={subComponentData.description || ''}
                onChange={(e) => setSubComponentData({ ...subComponentData, description: e.target.value })}
                placeholder="Brief description"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight
              </label>
              <input
                type="number"
                value={subComponentData.weight || ''}
                onChange={(e) => setSubComponentData({ ...subComponentData, weight: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                onKeyDown={handleKeyDown}
                onWheel={(e) => e.target.blur()}
                min="0"
                step="0.1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowSubComponentForm(false);
                  setSubComponentData({ name: '', description: '', weight: 0 });
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSaveSubComponent}
              >
                Save Sub-Component
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const totalWeight = formData.predefinedSubComponents.reduce((sum, s) => sum + (parseFloat(s.weight) || 0), 0);

  return (
    <Card>
      <div className="p-6">
        <div className="mb-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Components
          </Button>
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          {component ? 'Edit Component' : 'Create New Component'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Component Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Problem Definition, Implementation Quality"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.category}
                onChange={(value) => setFormData({ ...formData, category: value })}
                options={categories.map(cat => ({ value: cat, label: cat }))}
              />
            </div>

            <div className="border-l-2 border-yellow-200 pl-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description Criteria (JSON)
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddDescriptionCriteria}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-1" /> Add Criteria
                </Button>
              </div>

              <div className="space-y-3">
                {Array.isArray(formData.description) && formData.description.map((crit, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      type="text"
                      placeholder="Label (e.g., Implemented 5 papers)"
                      value={crit.label || ''}
                      onChange={(e) => handleUpdateDescriptionCriteria(index, 'label', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Marks"
                      value={crit.marks || ''}
                      onChange={(e) => handleUpdateDescriptionCriteria(index, 'marks', e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveDescriptionCriteria(index)}
                      className="text-gray-400 hover:text-red-600 p-1"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                {(!Array.isArray(formData.description) || formData.description.length === 0) && (
                  <div className="text-sm text-gray-500 italic py-2">
                    No description criteria added. Click "Add Criteria" to define specific requirements.
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suggested Weight
              </label>
              <input
                type="number"
                value={formData.suggestedWeight || ''}
                onChange={(e) => setFormData({ ...formData, suggestedWeight: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                onKeyDown={handleKeyDown}
                onWheel={(e) => e.target.blur()}
                min="0"
                step="0.1"
                // readOnly={formData.predefinedSubComponents.length > 0} 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Suggested weightage for this component in marking schema
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Applicable For
              </label>
              <Select
                value={formData.applicableFor[0] || 'both'}
                onChange={(value) => setFormData({ ...formData, applicableFor: [value] })}
                options={[
                  { value: 'both', label: 'Both Hardware & Software' },
                  { value: 'hardware', label: 'Hardware Projects Only' },
                  { value: 'software', label: 'Software Projects Only' }
                ]}
              />
            </div>

            <div className="flex items-center gap-3">


              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>

          {/* Sub-Components Section Removed */}

          {/* Total Weight Summary Removed */}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={onCancel} size="lg">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="lg">
              {component ? 'Update' : 'Create'} Component
            </Button>
          </div>
        </form>
      </div >
    </Card >
  );
};

export default RubricEditor;
