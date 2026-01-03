// src/features/project-coordinator/components/faculty-management/FacultyList.jsx
import React, { useState, useCallback, useEffect } from 'react';
import AcademicFilterSelector from '../shared/AcademicFilterSelector';
import Card from '../../../../shared/components/Card';
import Button from '../../../../shared/components/Button';
import Badge from '../../../../shared/components/Badge';
import { PencilIcon, TrashIcon, UserIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const FacultyList = ({ faculty }) => {
  const [filters, setFilters] = useState(null);
  const [filteredFaculty, setFilteredFaculty] = useState([]);

  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters(selectedFilters);
  }, []);

  // Filter faculty when filters change
  useEffect(() => {
    if (filters) {
      const filtered = faculty.filter(f => {
        if (filters.school && f.school !== filters.school) return false;
        if (filters.programme && f.program !== filters.programme) return false;
        if (filters.year && f.year !== filters.year) return false;
        if (filters.semester && f.semester !== filters.semester) return false;
        return true;
      });
      setFilteredFaculty(filtered);
    }
  }, [filters, faculty]);

  const getProjectCountBadge = (count) => {
    if (count === 0) return 'secondary';
    if (count <= 3) return 'success';
    if (count <= 6) return 'warning';
    return 'danger';
  };

  return (
    <div className="space-y-6">
      {/* Academic Filter Selector */}
      <AcademicFilterSelector onFilterComplete={handleFilterComplete} />

      {!filters ? (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="text-center py-8">
            <p className="text-yellow-800">Please complete the academic filters to view faculty members.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFaculty.length === 0 ? (
            <Card>
              <div className="p-12 text-center text-gray-500">
                <UserIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No faculty members found</p>
                <p className="text-sm mt-2">Try adjusting your filters or add a new faculty member</p>
              </div>
            </Card>
          ) : (
            filteredFaculty.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{member.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-gray-600">{member.email}</p>
                        <span className="text-gray-400">•</span>
                        <p className="text-sm font-medium text-blue-600">ID: {member.id}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Phone</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{member.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Department</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{member.department}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Specialization</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{member.specialization}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Designation</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{member.designation}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        <strong className="text-gray-900">{member.projects?.length || 0}</strong> Active Project{member.projects?.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <Badge variant={getProjectCountBadge(member.projects?.length || 0)}>
                      {member.projects?.length === 0 && 'Available'}
                      {member.projects?.length > 0 && member.projects.length <= 3 && 'Light Load'}
                      {member.projects?.length > 3 && member.projects.length <= 6 && 'Moderate Load'}
                      {member.projects?.length > 6 && 'Heavy Load'}
                    </Badge>
                  </div>

                  {/* Projects List */}
                  {member.projects && member.projects.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Assigned Projects:</p>
                      <div className="space-y-2">
                        {member.projects.map((project, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h5 className="text-sm font-semibold text-gray-900">{project.title}</h5>
                                <p className="text-xs text-gray-600 mt-1">
                                  Student: {project.studentName} ({project.studentRegNo})
                                </p>
                              </div>
                              <Badge variant={project.role === 'guide' ? 'primary' : 'secondary'}>
                                {project.role === 'guide' ? 'Guide' : 'Panel'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {isPrimary && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onEdit(member)}
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onDelete(member.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FacultyList;
