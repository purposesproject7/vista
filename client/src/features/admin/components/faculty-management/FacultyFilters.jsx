// src/features/admin/components/faculty-management/FacultyFilters.jsx
import React, { useState, useEffect } from 'react';
import Card from '../../../../shared/components/Card';
import { CheckCircleIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { SCHOOLS, PROGRAMMES_BY_SCHOOL, YEARS, SEMESTERS } from '../../../../shared/constants/config';

const FacultyFilters = ({ onFilterComplete, className = '' }) => {
  const [filters, setFilters] = useState({
    school: '',
    programme: '',
    year: '',
    semester: ''
  });

  const [options, setOptions] = useState({
    programmes: [],
    years: YEARS,
    semesters: SEMESTERS
  });

  // Update programmes when school changes
  useEffect(() => {
    if (filters.school) {
      const programmes = PROGRAMMES_BY_SCHOOL[filters.school] || [];
      setOptions(prev => ({
        ...prev,
        programmes
      }));
      // Reset programme if it's not valid for the new school
      setFilters(prev => ({
        ...prev,
        programme: '',
        year: '',
        semester: ''
      }));
    } else {
      setOptions(prev => ({
        ...prev,
        programmes: []
      }));
    }
  }, [filters.school]);

  // Reset dependent filters when programme changes
  useEffect(() => {
    if (filters.programme && filters.year && filters.semester) {
      // Do nothing, keep the values
    } else if (filters.programme) {
      setFilters(prev => ({
        ...prev,
        year: '',
        semester: ''
      }));
    }
  }, [filters.programme]);

  // Reset semester when year changes
  useEffect(() => {
    if (filters.year && filters.semester) {
      // Do nothing, keep the value
    } else if (filters.year) {
      setFilters(prev => ({
        ...prev,
        semester: ''
      }));
    }
  }, [filters.year]);

  // Notify parent when all required filters are selected
  useEffect(() => {
    if (filters.school && filters.programme && filters.year && filters.semester) {
      onFilterComplete(filters);
    }
  }, [filters, onFilterComplete]);

  const handleChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isComplete = filters.school && filters.programme && filters.year && filters.semester;
  const completedCount = [filters.school, filters.programme, filters.year, filters.semester].filter(Boolean).length;
  const progressPercentage = (completedCount / 4) * 100;

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AcademicCapIcon className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Select Academic Context</h3>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">{completedCount}/4</span>
          </div>
          {/* Complete Badge */}
          {isComplete && (
            <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full">
              <CheckCircleIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Complete</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* School - Required */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            School
          </label>
          <select
            value={filters.school}
            onChange={(e) => handleChange('school', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select School</option>
            {SCHOOLS.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>

        {/* Programme - Required */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Programme
          </label>
          <select
            value={filters.programme}
            onChange={(e) => handleChange('programme', e.target.value)}
            disabled={!filters.school}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          >
            <option value="">Select previous first</option>
            {options.programmes.map((programme) => (
              <option key={programme.id} value={programme.id}>
                {programme.name}
              </option>
            ))}
          </select>
        </div>

        {/* Year - Required */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year
          </label>
          <select
            value={filters.year}
            onChange={(e) => handleChange('year', e.target.value)}
            disabled={!filters.programme}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          >
            <option value="">Select previous first</option>
            {options.years.map((year) => (
              <option key={year.id} value={year.id}>
                {year.label}
              </option>
            ))}
          </select>
        </div>

        {/* Semester - Required */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Semester
          </label>
          <select
            value={filters.semester}
            onChange={(e) => handleChange('semester', e.target.value)}
            disabled={!filters.year}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          >
            <option value="">Select previous first</option>
            {options.semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  );
};

export default FacultyFilters;
