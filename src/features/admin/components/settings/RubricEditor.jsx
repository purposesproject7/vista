// src/features/admin/components/settings/RubricEditor.jsx
import React, { useState } from 'react';
import Card from '../../../../shared/components/Card';
import Button from '../../../../shared/components/Button';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';
import { PlusIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import MarkLevelEditor from './MarkLevelEditor';

const RubricEditor = ({ rubric, onSave, onCancel }) => {
  const [formData, setFormData] = useState(rubric || {
    name: '',
    description: '',
    reviewType: 'guide',
    components: []
  });

  const [editingComponent, setEditingComponent] = useState(null);
  const [showLevelEditor, setShowLevelEditor] = useState(false);

  const handleAddComponent = () => {
    setEditingComponent({
      name: '',
      maxMarks: 10,
      levels: []
    });
    setShowLevelEditor(true);
  };

  const handleEditComponent = (component, index) => {
    setEditingComponent({ ...component, index });
    setShowLevelEditor(true);
  };

  const handleDeleteComponent = (index) => {
    if (window.confirm('Delete this component?')) {
      const updated = formData.components.filter((_, i) => i !== index);
      setFormData({ ...formData, components: updated });
    }
  };

  const handleSaveComponent = (component) => {
    let updated;
    if (editingComponent.index !== undefined) {
      updated = formData.components.map((c, i) => 
        i === editingComponent.index ? component : c
      );
    } else {
      updated = [...formData.components, component];
    }
    setFormData({ ...formData, components: updated });
    setShowLevelEditor(false);
    setEditingComponent(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a rubric name');
      return;
    }
    
    if (formData.components.length === 0) {
      alert('Please add at least one component');
      return;
    }

    onSave(formData);
  };

  const totalMarks = formData.components.reduce((sum, c) => sum + (c.maxMarks || 0), 0);

  if (showLevelEditor) {
    return (
      <MarkLevelEditor
        component={editingComponent}
        onSave={handleSaveComponent}
        onCancel={() => {
          setShowLevelEditor(false);
          setEditingComponent(null);
        }}
      />
    );
  }

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
            Back to Rubrics
          </Button>
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          {rubric ? 'Edit Rubric' : 'Create New Rubric'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rubric Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Project Review 1 Rubric"
                required
                className="text-lg py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this rubric (optional)"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Type <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.reviewType}
                onChange={(e) => setFormData({ ...formData, reviewType: e.target.value })}
                options={[
                  { value: 'guide', label: 'Guide Review' },
                  { value: 'panel', label: 'Panel Review' }
                ]}
              />
            </div>
          </div>

          {/* Components */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">
                  Rubric Components
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Add evaluation criteria with mark levels and descriptions
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleAddComponent}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Component
              </Button>
            </div>

            {formData.components.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                <p className="text-lg">No components added yet</p>
                <p className="text-sm mt-2">Click the button above to add your first component</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.components.map((component, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-5 bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 text-lg mb-2">
                          {component.name}
                        </h5>
                        <div className="flex gap-3 text-sm mb-3">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                            Max: {component.maxMarks} marks
                          </span>
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                            {component.levels?.length || 0} mark level{component.levels?.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {component.levels && component.levels.length > 0 && (
                          <div className="space-y-1 text-sm">
                            {component.levels.map((level, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span className="font-semibold text-blue-600 min-w-[3rem]">
                                  {level.marks}m:
                                </span>
                                <span className="text-gray-700">{level.description}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEditComponent(component, index)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDeleteComponent(index)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total Marks Summary */}
          {formData.components.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">Total Marks</span>
                <span className="text-3xl font-bold text-blue-600">{totalMarks}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={onCancel} size="lg">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="lg">
              {rubric ? 'Update' : 'Create'} Rubric
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};

export default RubricEditor;
