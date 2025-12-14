import { useState, useMemo } from 'react';
import { 
  UserGroupIcon, 
  StarIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import { useToast } from '../../../shared/hooks/useToast';

const RoleManagement = ({
  schools,
  programsBySchool,
  years,
  semesters,
  facultyData,
  coordinatorAssignments: coordinatorAssignmentsProp,
  setCoordinatorAssignments: setCoordinatorAssignmentsProp
}) => {
  const { showToast } = useToast();
  
  // Academic Context Selection
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedProgramme, setSelectedProgramme] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  
  // Role assignments (stored globally in real app)
  const [localCoordinatorAssignments, setLocalCoordinatorAssignments] = useState([
    {
      schoolId: 1,
      programId: 1,
      yearId: 2024,
      semesterId: 1,
      coordinators: ['F001', 'F002'],
      mainCoordinator: 'F001'
    }
  ]);

  const coordinatorAssignments = coordinatorAssignmentsProp ?? localCoordinatorAssignments;
  const setCoordinatorAssignments = setCoordinatorAssignmentsProp ?? setLocalCoordinatorAssignments;

  // Search and selection
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState([]);

  // Get available programmes based on selected school
  const availableProgrammes = useMemo(() => {
    if (!selectedSchool) return [];
    return programsBySchool?.[selectedSchool] || [];
  }, [selectedSchool, programsBySchool]);

  // Filter progress calculation
  const filtersComplete = useMemo(() => {
    const completed = [
      selectedSchool,
      selectedProgramme,
      selectedYear,
      selectedSemester
    ].filter(Boolean).length;
    return { completed, total: 4, percentage: (completed / 4) * 100 };
  }, [selectedSchool, selectedProgramme, selectedYear, selectedSemester]);

  // Get faculty for selected context
  const contextFaculty = useMemo(() => {
    if (filtersComplete.completed !== 4) return [];
    
    return (facultyData || []).filter(
      (faculty) =>
        faculty.schoolId === parseInt(selectedSchool) &&
        faculty.programId === parseInt(selectedProgramme) &&
        faculty.yearId === parseInt(selectedYear) &&
        faculty.semesterId === parseInt(selectedSemester)
    );
  }, [selectedSchool, selectedProgramme, selectedYear, selectedSemester, filtersComplete, facultyData]);

  // Search filtered faculty
  const filteredFaculty = useMemo(() => {
    if (!searchTerm) return contextFaculty;
    
    const term = searchTerm.toLowerCase();
    return contextFaculty.filter(
      (faculty) =>
        faculty.name.toLowerCase().includes(term) ||
        faculty.id.toLowerCase().includes(term) ||
        faculty.email.toLowerCase().includes(term)
    );
  }, [contextFaculty, searchTerm]);

  // Get current context assignment
  const currentAssignment = useMemo(() => {
    if (filtersComplete.completed !== 4) return null;
    
    return coordinatorAssignments.find(
      (assignment) =>
        assignment.schoolId === parseInt(selectedSchool) &&
        assignment.programId === parseInt(selectedProgramme) &&
        assignment.yearId === parseInt(selectedYear) &&
        assignment.semesterId === parseInt(selectedSemester)
    );
  }, [coordinatorAssignments, selectedSchool, selectedProgramme, selectedYear, selectedSemester, filtersComplete]);

  // Get assigned coordinators with details
  const assignedCoordinators = useMemo(() => {
    if (!currentAssignment) return [];
    
    return currentAssignment.coordinators
      .map(id => contextFaculty.find(f => f.id === id))
      .filter(Boolean);
  }, [currentAssignment, contextFaculty]);

  // Handlers
  const handleSchoolChange = (value) => {
    setSelectedSchool(value);
    setSelectedProgramme('');
    setSelectedYear('');
    setSelectedSemester('');
    setSelectedFaculty([]);
  };

  const handleProgrammeChange = (value) => {
    setSelectedProgramme(value);
    setSelectedYear('');
    setSelectedSemester('');
    setSelectedFaculty([]);
  };

  const handleYearChange = (value) => {
    setSelectedYear(value);
    setSelectedSemester('');
    setSelectedFaculty([]);
  };

  const handleSemesterChange = (value) => {
    setSelectedSemester(value);
    setSelectedFaculty([]);
  };

  const toggleFacultySelection = (facultyId) => {
    setSelectedFaculty(prev => 
      prev.includes(facultyId) 
        ? prev.filter(id => id !== facultyId)
        : [...prev, facultyId]
    );
  };

  const handleAssignCoordinators = () => {
    if (selectedFaculty.length === 0) {
      showToast('Please select at least one faculty member', 'error');
      return;
    }

    const contextKey = {
      schoolId: parseInt(selectedSchool),
      programId: parseInt(selectedProgramme),
      yearId: parseInt(selectedYear),
      semesterId: parseInt(selectedSemester)
    };

    const existingIndex = coordinatorAssignments.findIndex(
      a => a.schoolId === contextKey.schoolId &&
           a.programId === contextKey.programId &&
           a.yearId === contextKey.yearId &&
           a.semesterId === contextKey.semesterId
    );

    if (existingIndex >= 0) {
      // Update existing assignment
      const updated = [...coordinatorAssignments];
      const currentMain = updated[existingIndex].mainCoordinator;

      const mergedCoordinators = Array.from(
        new Set([...(updated[existingIndex].coordinators || []), ...selectedFaculty])
      );

      updated[existingIndex] = {
        ...contextKey,
        coordinators: mergedCoordinators,
        mainCoordinator: mergedCoordinators.includes(currentMain) ? currentMain : mergedCoordinators[0]
      };
      setCoordinatorAssignments(updated);
    } else {
      // Create new assignment
      setCoordinatorAssignments([
        ...coordinatorAssignments,
        {
          ...contextKey,
          coordinators: selectedFaculty,
          mainCoordinator: selectedFaculty[0]
        }
      ]);
    }

    showToast(`${selectedFaculty.length} coordinator(s) assigned successfully`, 'success');
    setSelectedFaculty([]);
  };

  const handleSetMainCoordinator = (facultyId) => {
    const contextKey = {
      schoolId: parseInt(selectedSchool),
      programId: parseInt(selectedProgramme),
      yearId: parseInt(selectedYear),
      semesterId: parseInt(selectedSemester)
    };

    const index = coordinatorAssignments.findIndex(
      a => a.schoolId === contextKey.schoolId &&
           a.programId === contextKey.programId &&
           a.yearId === contextKey.yearId &&
           a.semesterId === contextKey.semesterId
    );

    if (index >= 0) {
      const updated = [...coordinatorAssignments];
      updated[index].mainCoordinator = facultyId;
      setCoordinatorAssignments(updated);
      showToast('Main coordinator updated successfully', 'success');
    }
  };

  const handleRemoveCoordinator = (facultyId) => {
    const contextKey = {
      schoolId: parseInt(selectedSchool),
      programId: parseInt(selectedProgramme),
      yearId: parseInt(selectedYear),
      semesterId: parseInt(selectedSemester)
    };

    const index = coordinatorAssignments.findIndex(
      a => a.schoolId === contextKey.schoolId &&
           a.programId === contextKey.programId &&
           a.yearId === contextKey.yearId &&
           a.semesterId === contextKey.semesterId
    );

    if (index >= 0) {
      const updated = [...coordinatorAssignments];
      const newCoordinators = updated[index].coordinators.filter(id => id !== facultyId);
      
      if (newCoordinators.length === 0) {
        // Remove entire assignment if no coordinators left
        updated.splice(index, 1);
      } else {
        updated[index].coordinators = newCoordinators;
        // Update main coordinator if removed
        if (updated[index].mainCoordinator === facultyId) {
          updated[index].mainCoordinator = newCoordinators[0];
        }
      }
      
      setCoordinatorAssignments(updated);
      showToast('Coordinator removed successfully', 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
        <p className="text-sm text-gray-600">Assign Project Coordinators for each academic context</p>
      </div>

      {/* Academic Context Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Academic Context</h3>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Selection Progress: {filtersComplete.completed}/4
            </span>
            {filtersComplete.completed === 4 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                <CheckCircleIcon className="h-4 w-4" />
                Complete
              </span>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${filtersComplete.percentage}%` }}
            />
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSchool}
              onChange={(e) => handleSchoolChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Select School</option>
              {(schools || []).map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Programme <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedProgramme}
              onChange={(e) => handleProgrammeChange(e.target.value)}
              disabled={!selectedSchool}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Programme</option>
              {availableProgrammes.map((programme) => (
                <option key={programme.id} value={programme.id}>
                  {programme.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Year <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              disabled={!selectedProgramme}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Year</option>
              {(years || []).map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semester <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => handleSemesterChange(e.target.value)}
              disabled={!selectedYear}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Semester</option>
              {(semesters || []).map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Faculty Selection - Only shown when context is complete */}
      {filtersComplete.completed === 4 && (
        <>
          {/* Current Coordinators */}
          {assignedCoordinators.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Current Project Coordinators ({assignedCoordinators.length})
                </h3>
                {assignedCoordinators.length > 1 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <StarIconSolid className="h-4 w-4 text-yellow-500" />
                    <span>Main Coordinator</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignedCoordinators.map((faculty) => {
                  const isMain = currentAssignment?.mainCoordinator === faculty.id;
                  return (
                    <div
                      key={faculty.id}
                      className={`relative p-4 border-2 rounded-lg ${
                        isMain 
                          ? 'border-yellow-400 bg-yellow-50' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      {isMain && (
                        <div className="absolute -top-2 -right-2">
                          <StarIconSolid className="h-6 w-6 text-yellow-500" />
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{faculty.name}</h4>
                          <p className="text-sm text-gray-600">{faculty.designation}</p>
                          <p className="text-sm text-gray-500 mt-1">ID: {faculty.id}</p>
                          <p className="text-sm text-gray-500">{faculty.email}</p>
                        </div>

                        <div className="flex flex-col gap-2">
                          {!isMain && assignedCoordinators.length > 1 && (
                            <button
                              onClick={() => handleSetMainCoordinator(faculty.id)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Set as Main Coordinator"
                            >
                              <StarIcon className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveCoordinator(faculty.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove Coordinator"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      {isMain && (
                        <div className="mt-2 pt-2 border-t border-yellow-200">
                          <span className="text-xs font-medium text-yellow-700">
                            Main Project Coordinator
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Faculty Selection */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Assign New Coordinators
              </h3>
              {selectedFaculty.length > 0 && (
                <Button onClick={handleAssignCoordinators} variant="primary">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Assign {selectedFaculty.length} Coordinator{selectedFaculty.length > 1 ? 's' : ''}
                </Button>
              )}
            </div>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by name, employee ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Faculty List */}
            {filteredFaculty.length === 0 ? (
              <div className="text-center py-12">
                <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">
                  {contextFaculty.length === 0 
                    ? 'No faculty found for this academic context' 
                    : 'No faculty match your search criteria'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredFaculty.map((faculty) => {
                  const isSelected = selectedFaculty.includes(faculty.id);
                  const isAlreadyAssigned = currentAssignment?.coordinators.includes(faculty.id);
                  
                  return (
                    <div
                      key={faculty.id}
                      onClick={() => !isAlreadyAssigned && toggleFacultySelection(faculty.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isAlreadyAssigned
                          ? 'border-green-300 bg-green-50 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={isSelected || isAlreadyAssigned}
                            disabled={isAlreadyAssigned}
                            onChange={() => {}}
                            className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <div>
                            <h4 className="font-semibold text-gray-900">{faculty.name}</h4>
                            <div className="flex items-center gap-4 mt-1">
                              <p className="text-sm text-gray-600">{faculty.designation}</p>
                              <p className="text-sm text-gray-500">ID: {faculty.id}</p>
                            </div>
                            <p className="text-sm text-gray-500">{faculty.email}</p>
                          </div>
                        </div>
                        
                        {isAlreadyAssigned && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            <CheckCircleIcon className="h-4 w-4" />
                            Already Assigned
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedFaculty.length > 1 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Multiple Coordinators Selected</p>
                    <p>
                      The first selected faculty will be set as the Main Coordinator by default. 
                      You can change this after assignment.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default RoleManagement;
