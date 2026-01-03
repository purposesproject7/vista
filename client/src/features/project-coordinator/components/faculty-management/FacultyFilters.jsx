// src/features/project-coordinator/components/faculty-management/FacultyFilters.jsx
import { useState, useEffect } from 'react';
import Select from '../../../../shared/components/Select';
import { SCHOOLS, PROGRAMMES_BY_SCHOOL, YEARS, SEMESTERS } from '../../../../shared/constants/config';

const FacultyFilters = ({ onFilterChange, onFilterComplete, school = '', programme = '', hideSchoolProgramme = false }) => {
  const [filters, setFilters] = useState({
    school: school || '',
    programme: programme || '',
    year: '',
    semester: '',
  });

  const [programmes, setProgrammes] = useState([]);

  // Initialize programmes when component mounts or school changes
  useEffect(() => {
    if (filters.school) {
      setProgrammes(PROGRAMMES_BY_SCHOOL[filters.school] || []);
    }
  }, [filters.school]);

  const handleSchoolChange = (school) => {
    setFilters({
      school,
      programme: '',
      year: '',
      semester: '',
    });
    onFilterChange({ school, programme: '', year: '', semester: '' });
  };

  const handleProgrammeChange = (programme) => {
    setFilters(prev => ({
      ...prev,
      programme,
      year: '',
      semester: '',
    }));
    onFilterChange({ ...filters, programme, year: '', semester: '' });
  };

  const handleYearChange = (year) => {
    setFilters(prev => ({
      ...prev,
      year,
      semester: '',
    }));
    onFilterChange({ ...filters, year, semester: '' });
  };

  const handleSemesterChange = (semester) => {
    setFilters(prev => ({
      ...prev,
      semester,
    }));
    onFilterChange({ ...filters, semester });
  };

  // Check if all filters are complete
  useEffect(() => {
    const isComplete = filters.school && filters.programme && filters.year && filters.semester;
    if (isComplete && onFilterComplete) {
      onFilterComplete(filters);
    }
  }, [filters, onFilterComplete]);

  // Count filters: hide school/programme if hideSchoolProgramme is true
  const visibleFilters = hideSchoolProgramme 
    ? [filters.year, filters.semester] 
    : [filters.school, filters.programme, filters.year, filters.semester];
  const completionCount = visibleFilters.filter(Boolean).length;
  const totalCount = visibleFilters.length;
  const completionPercentage = (completionCount / totalCount) * 100;

  if (hideSchoolProgramme) {
    // Simplified view for Faculty Create - only Year and Semester
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Academic Filters</h3>
            <span className="text-sm font-medium text-gray-600">{completionCount}/2</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Display School and Programme as info (read-only) */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">School:</span> {filters.school}
          </p>
          <p className="text-sm text-gray-700 mt-1">
            <span className="font-semibold">Programme:</span> {filters.programme}
          </p>
        </div>

        {/* Only Year and Semester dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Year"
            value={filters.year}
            onChange={handleYearChange}
            options={YEARS.map(y => ({ value: y.id, label: y.label }))}
            placeholder="Select Year"
          />

          <Select
            label="Semester"
            value={filters.semester}
            onChange={handleSemesterChange}
            options={SEMESTERS.map(s => ({ value: s.id, label: s.name }))}
            placeholder="Select Semester"
            disabled={!filters.year}
          />
        </div>
      </div>
    );
  }

  // Full view for Faculty View - all 4 filters
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Academic Filters</h3>
          <span className="text-sm font-medium text-gray-600">{completionCount}/4</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          label="School"
          value={filters.school}
          onChange={handleSchoolChange}
          options={SCHOOLS.map(s => ({ value: s.id, label: s.name }))}
          placeholder="Select School"
        />

        <Select
          label="Programme"
          value={filters.programme}
          onChange={handleProgrammeChange}
          options={programmes.map(p => ({ value: p.id, label: p.name }))}
          placeholder="Select Programme"
          disabled={!filters.school}
        />

        <Select
          label="Year"
          value={filters.year}
          onChange={handleYearChange}
          options={YEARS.map(y => ({ value: y.id, label: y.label }))}
          placeholder="Select Year"
          disabled={!filters.programme}
        />

        <Select
          label="Semester"
          value={filters.semester}
          onChange={handleSemesterChange}
          options={SEMESTERS.map(s => ({ value: s.id, label: s.name }))}
          placeholder="Select Semester"
          disabled={!filters.year}
        />
      </div>
    </div>
  );
};

export default FacultyFilters;
