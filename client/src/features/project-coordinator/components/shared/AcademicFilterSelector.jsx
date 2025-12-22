// src/features/project-coordinator/components/shared/AcademicFilterSelector.jsx
import React, { useState, useEffect } from 'react';
import Select from '../../../../shared/components/Select';
import Card from '../../../../shared/components/Card';
import { AcademicCapIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const AcademicFilterSelector = ({ onFilterComplete, className = '' }) => {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({
    years: [],
    semesters: []
  });
  
  const [filters, setFilters] = useState({
    year: '',
    semester: ''
  });
  
  // Get coordinator's school and department from context (would come from auth in real implementation)
  const [coordinatorContext] = useState({
    school: 'SCOPE', // This would come from coordinator's profile
    programme: 'B.Tech CSE' // This would come from coordinator's profile
  });

  // Fetch years on mount
  useEffect(() => {
    // Use dummy data for years
    setOptions(prev => ({
      ...prev,
      years: [
        { value: '2025', label: '2025-26' },
        { value: '2024', label: '2024-25' },
        { value: '2023', label: '2023-24' }
      ]
    }));
  }, []);

  // Fetch semesters when year changes
  useEffect(() => {
    if (filters.year) {
      // Use dummy data for semesters
      setOptions(prev => ({
        ...prev,
        semesters: [
          { value: '1', label: 'Winter Semester' },
          { value: '2', label: 'Summer Semester' }
        ]
      }));
    }
  }, [filters.year]);

  // Notify parent when all filters are selected
  useEffect(() => {
    if (filters.year && filters.semester) {
      onFilterComplete({
        ...filters,
        school: coordinatorContext.school,
        programme: coordinatorContext.programme
      });
    }
  }, [filters]);

  const handleChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    
    // Reset dependent filters
    if (key === 'year') {
      newFilters.semester = '';
      // Clear semesters options
      setOptions(prev => ({
        ...prev,
        semesters: []
      }));
    }
    
    setFilters(newFilters);
  };

  const steps = [
    { key: 'year', label: 'Year', options: options.years, enabled: true },
    { key: 'semester', label: 'Semester', options: options.semesters, enabled: !!filters.year }
  ];

  const allSelected = steps.every(step => filters[step.key]);
  const completedSteps = steps.filter(step => filters[step.key]).length;

  return (
    <Card className={`sticky top-4 z-30 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1">
          <AcademicCapIcon className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-gray-900">Select Academic Context</h2>
          <div className="flex-1 mx-3">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${(completedSteps / 2) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-semibold text-gray-600">{completedSteps}/2</span>
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

      {/* Year and Semester Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {steps.map((step) => (
          <Select
            key={step.key}
            label={step.label}
            value={filters[step.key]}
            onChange={(value) => handleChange(step.key, value)}
            options={step.options}
            placeholder={step.enabled ? `Select ${step.label}` : 'Select previous first'}
            className={!step.enabled ? 'opacity-50 pointer-events-none' : ''}
          />
        ))}
      </div>

      {loading && (
        <div className="mt-3 text-center">
          <span className="text-xs text-gray-500">Loading options...</span>
        </div>
      )}
    </Card>
  );
};

export default AcademicFilterSelector;
