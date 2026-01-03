// src/features/admin/components/settings/RubricSettings.jsx
import React, { useState, useEffect } from 'react';
import Card from '../../../../shared/components/Card';
import Button from '../../../../shared/components/Button';
import Select from '../../../../shared/components/Select';
import { PlusIcon, PencilIcon, TrashIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import RubricEditor from './RubricEditor';
import { useToast } from '../../../../shared/hooks/useToast';
import { getComponentLibrary, createComponentLibrary, updateComponentLibrary } from '../../../../services/componentLibraryApi';

const RubricSettings = ({ rubrics, onUpdate }) => {
  const [componentLibrary, setComponentLibrary] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  
  // Academic context selection
  const [selectedContext, setSelectedContext] = useState({
    academicYear: '2024-25',
    school: 'SCOPE',
    department: 'CSE'
  });

  // Fetch component library when context changes
  useEffect(() => {
    fetchComponentLibrary();
  }, [selectedContext.academicYear, selectedContext.school, selectedContext.department]);

  const fetchComponentLibrary = async () => {
    try {
      setLoading(true);
      const response = await getComponentLibrary(
        selectedContext.academicYear,
        selectedContext.school,
        selectedContext.department
      );
      setComponentLibrary(response.data);
      showToast('Component library loaded successfully', 'success');
    } catch (error) {
      if (error.response?.status === 404) {
        // No library exists yet for this context
        setComponentLibrary(null);
        console.log('No component library found for this context');
      } else {
        showToast(error.response?.data?.message || 'Failed to load component library', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingComponent(null);
    setShowEditor(true);
  };

  const handleEdit = (component) => {
    setEditingComponent(component);
    setShowEditor(true);
  };

  const handleDelete = async (componentId) => {
    if (!window.confirm('Are you sure you want to delete this component? This action cannot be undone.')) {
      return;
    }

    try {
      const updatedComponents = componentLibrary.components.filter(c => c._id !== componentId);
      
      await updateComponentLibrary(componentLibrary._id, {
        components: updatedComponents
      });
      
      await fetchComponentLibrary();
      showToast('Component deleted successfully', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete component', 'error');
    }
  };

  const handleSaveComponent = async (component) => {
    try {
      setLoading(true);

      if (!componentLibrary) {
        // Create new component library
        const newLibrary = {
          academicYear: selectedContext.academicYear,
          school: selectedContext.school,
          department: selectedContext.department,
          components: [component]
        };
        
        await createComponentLibrary(newLibrary);
        showToast('Component library created successfully', 'success');
      } else {
        // Update existing library
        let updatedComponents;
        
        if (editingComponent) {
          // Edit existing component
          updatedComponents = componentLibrary.components.map(c =>
            c._id === editingComponent._id ? { ...component, _id: c._id } : c
          );
        } else {
          // Add new component
          updatedComponents = [...componentLibrary.components, component];
        }

        await updateComponentLibrary(componentLibrary._id, {
          components: updatedComponents
        });
        
        showToast(editingComponent ? 'Component updated successfully' : 'Component added successfully', 'success');
      }

      await fetchComponentLibrary();
      setShowEditor(false);
      setEditingComponent(null);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save component', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (showEditor) {
    return (
      <RubricEditor
        component={editingComponent}
        onSave={handleSaveComponent}
        onCancel={() => {
          setShowEditor(false);
          setEditingComponent(null);
        }}
      />
    );
  }

  const components = componentLibrary?.components || [];

  return (
    <Card>
      <div className="p-6">
        {/* Academic Context Selector */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Academic Context</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Academic Year</label>
              <Select
                value={selectedContext.academicYear}
                onChange={(e) => setSelectedContext({ ...selectedContext, academicYear: e.target.value })}
                options={[
                  { value: '2024-25', label: '2024-25' },
                  { value: '2025-26', label: '2025-26' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">School</label>
              <Select
                value={selectedContext.school}
                onChange={(e) => setSelectedContext({ ...selectedContext, school: e.target.value })}
                options={[
                  { value: 'SCOPE', label: 'SCOPE' },
                  { value: 'SMEC', label: 'SMEC' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
              <Select
                value={selectedContext.department}
                onChange={(e) => setSelectedContext({ ...selectedContext, department: e.target.value })}
                options={[
                  { value: 'CSE', label: 'CSE' },
                  { value: 'ECE', label: 'ECE' },
                  { value: 'ME', label: 'ME' }
                ]}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Component Library</h3>
            <p className="text-sm text-gray-600 mt-1">
              Manage assessment components for {selectedContext.school} - {selectedContext.department} ({selectedContext.academicYear})
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAdd}
            disabled={loading}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Component
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Loading...</p>
          </div>
        ) : components.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium">No components created yet</p>
            <p className="text-sm mt-2">Click the button above to create your first assessment component</p>
          </div>
        ) : (
          <div className="space-y-4">
            {components.map((component) => (
              <div
                key={component._id}
                className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {component.name}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        component.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {component.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    {component.description && (
                      <p className="text-sm text-gray-600 mb-3">{component.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium capitalize">
                        {component.category}
                      </span>
                      {component.suggestedWeight && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                          Weight: {component.suggestedWeight}
                        </span>
                      )}
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                        {component.applicableFor?.join(', ') || 'both'}
                      </span>
                      {component.predefinedSubComponents?.length > 0 && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                          {component.predefinedSubComponents.length} Sub-components
                        </span>
                      )}
                    </div>

                    {/* Sub-components Preview */}
                    {component.predefinedSubComponents && component.predefinedSubComponents.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Sub-components:</p>
                        <div className="space-y-1">
                          {component.predefinedSubComponents.map((sub, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">{sub.name}</span>
                              {sub.weight && (
                                <span className="text-gray-500 font-medium">Weight: {sub.weight}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEdit(component)}
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDelete(component._id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
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
