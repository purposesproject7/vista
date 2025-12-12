// src/features/admin/components/settings/RubricSettings.jsx
import React, { useState } from 'react';
import Card from '../../../../shared/components/Card';
import Button from '../../../../shared/components/Button';
import { PlusIcon, PencilIcon, TrashIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import RubricEditor from './RubricEditor';
import { useToast } from '../../../../shared/hooks/useToast';

const RubricSettings = ({ rubrics, onUpdate }) => {
  const [rubricList, setRubricList] = useState(rubrics);
  const [showEditor, setShowEditor] = useState(false);
  const [editingRubric, setEditingRubric] = useState(null);
  const { showToast } = useToast();

  const handleAdd = () => {
    setEditingRubric(null);
    setShowEditor(true);
  };

  const handleEdit = (rubric) => {
    setEditingRubric(rubric);
    setShowEditor(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this rubric? This action cannot be undone.')) {
      const updated = rubricList.filter(r => r.id !== id);
      setRubricList(updated);
      onUpdate(updated);
      showToast('Rubric deleted successfully', 'success');
    }
  };

  const handleSaveRubric = (rubric) => {
    let updated;
    if (editingRubric) {
      updated = rubricList.map(r => r.id === editingRubric.id ? rubric : r);
      showToast('Rubric updated successfully', 'success');
    } else {
      const newRubric = {
        ...rubric,
        id: String(Date.now())
      };
      updated = [...rubricList, newRubric];
      showToast('Rubric added successfully', 'success');
    }
    setRubricList(updated);
    onUpdate(updated);
    setShowEditor(false);
  };

  if (showEditor) {
    return (
      <RubricEditor
        rubric={editingRubric}
        onSave={handleSaveRubric}
        onCancel={() => setShowEditor(false)}
      />
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Rubric Templates</h3>
            <p className="text-sm text-gray-600 mt-1">
              Create and manage predefined rubric templates for project evaluation
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAdd}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Rubric
          </Button>
        </div>

        {rubricList.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium">No rubrics created yet</p>
            <p className="text-sm mt-2">Click the button above to create your first rubric template</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rubricList.map((rubric) => (
              <div
                key={rubric.id}
                className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {rubric.name}
                    </h4>
                    {rubric.description && (
                      <p className="text-sm text-gray-600 mb-3">{rubric.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                        {rubric.components.length} Component{rubric.components.length !== 1 ? 's' : ''}
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                        Total: {rubric.components.reduce((sum, c) => sum + (c.maxMarks || 0), 0)} marks
                      </span>
                      {rubric.reviewType && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium capitalize">
                          {rubric.reviewType} Review
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEdit(rubric)}
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDelete(rubric.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
                
                {/* Component Preview */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Components:</p>
                  <div className="space-y-1">
                    {rubric.components.map((component, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{component.name}</span>
                        <span className="text-gray-500 font-medium">{component.maxMarks} marks</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default RubricSettings;
