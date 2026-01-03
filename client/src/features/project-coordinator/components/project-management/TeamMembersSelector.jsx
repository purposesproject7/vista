// src/features/project-coordinator/components/project-management/TeamMembersSelector.jsx
import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Card from '../../../../shared/components/Card';
import Button from '../../../../shared/components/Button';
import Input from '../../../../shared/components/Input';
import Select from '../../../../shared/components/Select';
import { useToast } from '../../../../shared/hooks/useToast';

const TeamMembersSelector = ({ 
  onTeamMembersChange, 
  academicYear, 
  school, 
  department,
  existingStudents = []
}) => {
  const [mode, setMode] = useState('create'); // 'create' or 'existing'
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [newStudents, setNewStudents] = useState([]);
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    registrationNumber: ''
  });
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  // Fetch max team size from department config
  useEffect(() => {
    const fetchTeamConfig = async () => {
      try {
        // In a real scenario, this would call the backend
        // For now, using default value
        setMaxTeamSize(4);
      } catch (err) {
        console.error('Error fetching team config:', err);
      }
    };

    if (school && department && academicYear) {
      fetchTeamConfig();
    }
  }, [school, department, academicYear]);

  // Notify parent of team members change
  useEffect(() => {
    const teamMembers = [...newStudents, ...selectedStudents];
    onTeamMembersChange(teamMembers);
  }, [newStudents, selectedStudents, onTeamMembersChange]);

  const handleAddNewStudent = () => {
    setError(null);

    if (!newStudentForm.name.trim()) {
      setError('Student name is required');
      return;
    }

    if (!newStudentForm.registrationNumber.trim()) {
      setError('Registration number is required');
      return;
    }

    const totalMembers = newStudents.length + selectedStudents.length;
    if (totalMembers >= maxTeamSize) {
      setError(`Maximum team size (${maxTeamSize}) reached`);
      return;
    }

    const newStudent = {
      id: Date.now(),
      name: newStudentForm.name,
      registrationNumber: newStudentForm.registrationNumber,
      source: 'new'
    };

    setNewStudents([...newStudents, newStudent]);
    setNewStudentForm({ name: '', registrationNumber: '' });
    showToast('Student added successfully', 'success');
  };

  const handleAddExistingStudent = (studentId) => {
    setError(null);

    const student = existingStudents.find(s => s.id === studentId);
    if (!student) {
      setError('Student not found');
      return;
    }

    if (selectedStudents.some(s => s.id === studentId)) {
      setError('Student already added');
      return;
    }

    const totalMembers = newStudents.length + selectedStudents.length;
    if (totalMembers >= maxTeamSize) {
      setError(`Maximum team size (${maxTeamSize}) reached`);
      return;
    }

    setSelectedStudents([
      ...selectedStudents,
      { ...student, source: 'existing' }
    ]);
    showToast('Student added successfully', 'success');
  };

  const handleRemoveStudent = (id, source) => {
    if (source === 'new') {
      setNewStudents(newStudents.filter(s => s.id !== id));
    } else {
      setSelectedStudents(selectedStudents.filter(s => s.id !== id));
    }
    showToast('Student removed', 'info');
  };

  const availableExistingStudents = existingStudents.filter(
    s => !selectedStudents.some(sel => sel.id === s.id)
  );

  const totalMembers = newStudents.length + selectedStudents.length;
  const canAddMore = totalMembers < maxTeamSize;

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setMode('create')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            mode === 'create'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Create New Student
        </button>
        <button
          onClick={() => setMode('existing')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            mode === 'existing'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Use Existing Student
        </button>
      </div>

      {/* Team Size Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Team Size:</span> {totalMembers}/{maxTeamSize} students
        </p>
        {!canAddMore && (
          <p className="text-sm text-orange-700 mt-1">Maximum team size reached</p>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Create New Student Mode */}
      {mode === 'create' && (
        <Card>
          <h4 className="font-medium text-gray-900 mb-4">Add New Student</h4>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Student Name *"
                placeholder="Enter student name"
                value={newStudentForm.name}
                onChange={(e) =>
                  setNewStudentForm({ ...newStudentForm, name: e.target.value })
                }
                disabled={!canAddMore}
              />

              <Input
                label="Registration Number *"
                placeholder="Enter registration number"
                value={newStudentForm.registrationNumber}
                onChange={(e) =>
                  setNewStudentForm({
                    ...newStudentForm,
                    registrationNumber: e.target.value
                  })
                }
                disabled={!canAddMore}
              />
            </div>

            <Button
              onClick={handleAddNewStudent}
              disabled={!canAddMore}
              className="w-full"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Student
            </Button>
          </div>
        </Card>
      )}

      {/* Use Existing Student Mode */}
      {mode === 'existing' && (
        <Card>
          <h4 className="font-medium text-gray-900 mb-4">Select Existing Student</h4>

          {availableExistingStudents.length > 0 ? (
            <div className="space-y-2">
              {availableExistingStudents.map(student => (
                <button
                  key={student.id}
                  onClick={() => handleAddExistingStudent(student.id)}
                  disabled={!canAddMore}
                  className={`w-full p-3 border-2 rounded-lg transition ${
                    canAddMore
                      ? 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                      : 'border-gray-200 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-600">{student.registrationNumber}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              {existingStudents.length === 0
                ? 'No students available. Please upload students first.'
                : 'All available students have been added.'}
            </p>
          )}
        </Card>
      )}

      {/* Added Students List */}
      {(newStudents.length > 0 || selectedStudents.length > 0) && (
        <Card>
          <h4 className="font-medium text-gray-900 mb-4">Added Students ({totalMembers})</h4>

          <div className="space-y-2">
            {newStudents.map(student => (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-sm text-gray-600">{student.registrationNumber}</p>
                  <span className="inline-block mt-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    New
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveStudent(student.id, 'new')}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}

            {selectedStudents.map(student => (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-sm text-gray-600">{student.registrationNumber}</p>
                  <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Existing
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveStudent(student.id, 'existing')}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default TeamMembersSelector;
