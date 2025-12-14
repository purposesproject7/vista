// src/features/admin/pages/ProjectManagement.jsx
import React, { useState, useMemo } from 'react';
import Navbar from '../../../shared/components/Navbar';
import AdminTabs from '../components/shared/AdminTabs';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import EmptyState from '../../../shared/components/EmptyState';
import { SCHOOLS, PROGRAMMES_BY_SCHOOL, YEARS, SEMESTERS } from '../../../shared/constants/config';
import { MOCK_PROJECTS } from '../utils/mockProjectData';
import { UserGroupIcon, AcademicCapIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import ProjectDetailsModal from '../components/project-management/ProjectDetailsModal';

const ProjectManagement = () => {
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);

  const availablePrograms = useMemo(() => {
    return selectedSchool ? PROGRAMMES_BY_SCHOOL[selectedSchool] || [] : [];
  }, [selectedSchool]);

  const filteredProjects = useMemo(() => {
    if (!selectedSchool || !selectedProgram || !selectedYear || !selectedSemester) {
      return [];
    }
    return MOCK_PROJECTS.filter(
      project =>
        project.schoolId === selectedSchool &&
        project.programId === selectedProgram &&
        project.yearId === selectedYear &&
        project.semesterId === selectedSemester
    );
  }, [selectedSchool, selectedProgram, selectedYear, selectedSemester]);

  const isFilterComplete = selectedSchool && selectedProgram && selectedYear && selectedSemester;
  const filterProgress = [selectedSchool, selectedProgram, selectedYear, selectedSemester].filter(Boolean).length;

  const handleReset = () => {
    setSelectedSchool('');
    setSelectedProgram('');
    setSelectedYear('');
    setSelectedSemester('');
  };

  const handleSchoolChange = (e) => {
    setSelectedSchool(e.target.value);
    setSelectedProgram('');
    setSelectedYear('');
    setSelectedSemester('');
  };

  const handleProgramChange = (e) => {
    setSelectedProgram(e.target.value);
    setSelectedYear('');
    setSelectedSemester('');
  };

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
    setSelectedSemester('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <AdminTabs />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
        </div>

        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Academic Context</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-gray-600">Progress:</div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-blue-600">{filterProgress}/4</div>
                  {isFilterComplete && (
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  )}
                </div>
              </div>
              {filterProgress > 0 && (
                <Button variant="secondary" size="sm" onClick={handleReset}>
                  Reset
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedSchool}
                onChange={handleSchoolChange}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select School</option>
                {SCHOOLS.map(school => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedProgram}
                onChange={handleProgramChange}
                disabled={!selectedSchool}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select Program</option>
                {availablePrograms.map(program => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedYear}
                onChange={handleYearChange}
                disabled={!selectedProgram}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select Year</option>
                {YEARS.map(year => (
                  <option key={year.id} value={year.id}>
                    {year.label}
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
                onChange={(e) => setSelectedSemester(e.target.value)}
                disabled={!selectedYear}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select Semester</option>
                {SEMESTERS.map(semester => (
                  <option key={semester.id} value={semester.id}>
                    {semester.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {!isFilterComplete ? (
          <Card className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Academic Context</h3>
            <p className="text-sm text-gray-600">Please select all filters to view projects</p>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            title="No Projects Found"
            message="No projects match the selected criteria"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <Card
                key={project.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedProject(project)}
              >
                <div className="mb-4">
                  <div className="text-xs font-semibold text-blue-600 mb-1">{project.id}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{project.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-gray-200">
                  <div className="flex items-start gap-3">
                    <AcademicCapIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-gray-500">Guide</div>
                      <div className="text-sm font-semibold text-gray-900">{project.guide.name}</div>
                      <div className="text-xs text-gray-500">{project.guide.employeeID}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <UserGroupIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-gray-500">Team ({project.team.length} members)</div>
                      <div className="text-sm text-gray-900">
                        {project.team.map(member => member.name).join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedProject && (
        <ProjectDetailsModal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          project={selectedProject}
        />
      )}
    </div>
  );
};

export default ProjectManagement;
