// src/features/project-coordinator/components/shared/AcademicFilterSelector.jsx
import React, { useState, useEffect } from 'react';
import Select from '../../../../shared/components/Select';
import Card from '../../../../shared/components/Card';
import { AcademicCapIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const AcademicFilterSelector = ({ onFilterComplete, className = '' }) => {
  const [loading, setLoading] = useState(false);
  const [academicYearSemesterOptions, setAcademicYearSemesterOptions] = useState([]);
  
  const [filters, setFilters] = useState({
    academicYearSemester: ''
  });
  
  // Get coordinator's school and department from context (would come from auth in real implementation)
  const [coordinatorContext] = useState({
    school: 'SCOPE', // This would come from coordinator's profile
    programme: 'B.Tech CSE' // This would come from coordinator's profile
  });

  // Fetch combined academic year and semester options on mount
  useEffect(() => {
    // Combined options: year-semester format
    setAcademicYearSemesterOptions([
      { value: '25-26-fall', label: '25-26 Fall' },
      { value: '25-26-winter', label: '25-26 Winter' },
      { value: '24-25-fall', label: '24-25 Fall' },
      { value: '24-25-winter', label: '24-25 Winter' },
      { value: '23-24-fall', label: '23-24 Fall' },
      { value: '23-24-winter', label: '23-24 Winter' }
    ]);
  }, []);

  // Notify parent when filter is selected
  useEffect(() => {
    if (filters.academicYearSemester) {
      // Parse the combined value to extract year and semester
      const [year, semester] = filters.academicYearSemester.split('-').slice(0, 2);
      const semesterFull = filters.academicYearSemester.includes('fall') ? 'Fall' : 'Winter';
      
      onFilterComplete({
        year: `${year.slice(0, 2)}-${year.slice(2)}`,
        semester: semesterFull,
        academicYearSemester: filters.academicYearSemester,
        school: coordinatorContext.school,
        programme: coordinatorContext.programme
      });
    }
  }, [filters, coordinatorContext.school, coordinatorContext.programme, onFilterComplete]);

  const handleChange = (value) => {
    setFilters({ academicYearSemester: value });
  };

  const allSelected = !!filters.academicYearSemester;

  return (
    <Card className={`sticky top-4 z-30 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1">
          <AcademicCapIcon className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-gray-900">Select Academic Year & Semester</h2>
          <div className="flex-1 mx-3">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${allSelected ? 100 : 0}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-semibold text-gray-600">{allSelected ? '1' : '0'}/1</span>
        </div>
        
        {allSelected && (
          <div className="flex items-center gap-1.5 bg-green-100 px-3 py-1.5 rounded-lg border border-green-300">
            <CheckCircleIcon className="w-4 h-4 text-green-700" />
            <span className="text-xs font-semibold text-green-700">Complete</span>
          </div>
        )}
      </div>

      {/* Display coordinator's fixed school and programme */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">School</p>
            <p className="text-sm text-gray-900 font-medium">{coordinatorContext.school}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Programme</p>
            <p className="text-sm text-gray-900 font-medium">{coordinatorContext.programme}</p>
          </div>
        </div>
      </div>

      {/* Academic Year & Semester Selection */}
      <Select
        label="Academic Year & Semester"
        value={filters.academicYearSemester}
        onChange={handleChange}
        options={academicYearSemesterOptions}
        placeholder="Select Academic Year & Semester"
      />

      {loading && (
        <div className="mt-3 text-center">
          <span className="text-xs text-gray-500">Loading options...</span>
        </div>
      )}
    </Card>
  );
};

export default AcademicFilterSelector;
