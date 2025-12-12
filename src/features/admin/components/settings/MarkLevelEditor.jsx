// src/features/admin/components/settings/MarkLevelEditor.jsx
import React, { useState } from 'react';
import Card from '../../../../shared/components/Card';
import Button from '../../../../shared/components/Button';
import Input from '../../../../shared/components/Input';
import { PlusIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const MarkLevelEditor = ({ component, onSave, onCancel }) => {
  const [formData, setFormData] = useState(component || {
    name: '',
    maxMarks: 10,
    levels: []
  });

  const handleAddLevel = () => {
    const newLevel = {
      marks: 0,
      description: ''
    };
    setFormData({
      ...formData,
      levels: [...formData.levels, newLevel]
    });
  };

  const handleUpdateLevel = (index, field, value) => {
    const updated = formData.levels.map((level, i) =>
      i === index ? { ...level, [field]: value } : level
    );
    setFormData({ ...formData, levels: updated });
  };

  const handleDeleteLevel = (index) => {
    const updated = formData.levels.filter((_, i) => i !== index);
    setFormData({ ...formData, levels: updated });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a component name');
      return;
    }

    if (!formData.maxMarks || formData.maxMarks <= 0) {
      alert('Please enter valid maximum marks');
      return;
    }

    if (formData.levels.length === 0) {
      alert('Please add at least one mark level');
      return;
    }

    // Validate levels
    for (let i = 0; i < formData.levels.length; i++) {
      const level = formData.levels[i];
      if (!level.description.trim()) {
        alert(`Please enter a description for mark level ${i + 1}`);
        return;
      }
      if (level.marks > formData.maxMarks) {
        alert(`Mark value ${level.marks} exceeds maximum marks ${formData.maxMarks}`);
        return;
      }
    }

    onSave(formData);
  };

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
            Back to Rubric
          </Button>
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          {component?.index !== undefined ? 'Edit Component' : 'Add New Component'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Component Details */}
          <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Component Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Problem Statement, Literature Review, Implementation"
                required
                className="text-lg py-3"
              />
              <p className="text-sm text-gray-500 mt-2">
                Name of the evaluation criterion (e.g., "Documentation Quality", "Code Implementation")
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Marks <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                max="100"
                value={formData.maxMarks}
                onChange={(e) => setFormData({ ...formData, maxMarks: parseInt(e.target.value) || 0 })}
                required
                className="text-lg py-3"
              />
              <p className="text-sm text-gray-500 mt-2">
                Maximum marks that can be awarded for this component
              </p>
            </div>
          </div>

          {/* Mark Levels */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">
                  Mark Levels & Descriptions
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Define what each mark value represents (e.g., "10m: 20+ citations from peer-reviewed journals")
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleAddLevel}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Level
              </Button>
            </div>

            {formData.levels.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                <p className="text-lg">No mark levels defined yet</p>
                <p className="text-sm mt-2">Click the button above to add your first mark level</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.levels.map((level, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0" style={{ width: '120px' }}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Marks
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max={formData.maxMarks}
                          value={level.marks}
                          onChange={(e) => handleUpdateLevel(index, 'marks', parseInt(e.target.value) || 0)}
                          className="text-center text-lg font-bold"
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description / Criteria
                        </label>
                        <textarea
                          value={level.description}
                          onChange={(e) => handleUpdateLevel(index, 'description', e.target.value)}
                          placeholder="Describe what this mark value represents (e.g., '20+ citations from peer-reviewed journals', 'Comprehensive documentation with examples')"
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                          required
                        />
                      </div>
                      <div className="flex-shrink-0">
                        <label className="block text-sm font-medium text-transparent mb-2">
                          Action
                        </label>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDeleteLevel(index)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Example Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
            <h5 className="font-semibold text-blue-900 mb-3">💡 Example Mark Levels:</h5>
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>10 marks:</strong> Excellent - 20+ citations from peer-reviewed journals, comprehensive literature coverage</p>
              <p><strong>8 marks:</strong> Very Good - 15-20 citations, good coverage of recent literature</p>
              <p><strong>6 marks:</strong> Good - 10-15 citations, adequate literature review</p>
              <p><strong>4 marks:</strong> Satisfactory - 5-10 citations, basic coverage</p>
              <p><strong>2 marks:</strong> Needs Improvement - Less than 5 citations, limited coverage</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={onCancel} size="lg">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="lg">
              {component?.index !== undefined ? 'Update' : 'Add'} Component
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};

export default MarkLevelEditor;
