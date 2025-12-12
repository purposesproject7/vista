// src/features/admin/components/student-management/AcademicFilterSelector.jsx
import React, { useState, useEffect } from 'react';
import Select from '../../../../shared/components/Select';
import Card from '../../../../shared/components/Card';
import { AcademicCapIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import api from '../../../../services/api';

const AcademicFilterSelector = ({ onFilterComplete, className = '' }) => {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({
    schools: [],
    programmes: [],
    years: [],
    semesters: []
  });
  
  const [filters, setFilters] = useState({
    school: '',
    programme: '',
    year: '',
    semester: ''
  });

  // Fetch schools on mount
  useEffect(() => {
    // fetchSchools(); // Commented for dummy data
    // Use dummy data instead
    setOptions(prev => ({
      ...prev,
      schools: [
        { value: '1', label: 'SCOPE' },
        { value: '2', label: 'SENSE' },
        { value: '3', label: 'SELECT' },
        { value: '4', label: 'VITBS' }
      ]
    }));
  }, []);

  // Fetch programmes when school changes
  useEffect(() => {
    if (filters.school) {
      // fetchProgrammes(filters.school); // Commented for dummy data
      // Use dummy data instead
      setOptions(prev => ({
        ...prev,
        programmes: [
          { value: '1', label: 'B.Tech CSE' },
          { value: '2', label: 'B.Tech IT' },
          { value: '3', label: 'M.Tech CSE' }
        ]
      }));
    }
  }, [filters.school]);

  // Fetch years when programme changes
  useEffect(() => {
    if (filters.programme) {
      // fetchYears(filters.school, filters.programme); // Commented for dummy data
      // Use dummy data instead
      setOptions(prev => ({
        ...prev,
        years: [
          { value: '2025', label: '2025-26' },
          { value: '2024', label: '2024-25' },
          { value: '2023', label: '2023-24' }
        ]
      }));
    }
  }, [filters.programme]);

  // Fetch semesters when year changes
  useEffect(() => {
    if (filters.year) {
      // fetchSemesters(filters.school, filters.programme, filters.year); // Commented for dummy data
      // Use dummy data instead
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
    if (filters.school && filters.programme && filters.year && filters.semester) {
      onFilterComplete(filters);
    }
  }, [filters]);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/schools');
      setOptions(prev => ({
        ...prev,
        schools: response.data.map(s => ({ value: s.id, label: s.name }))
      }));
    } catch (error) {
      console.error('Error fetching schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgrammes = async (schoolId) => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/schools/${schoolId}/programmes`);
      setOptions(prev => ({
        ...prev,
        programmes: response.data.map(p => ({ value: p.id, label: p.name }))
      }));
    } catch (error) {
      console.error('Error fetching programmes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchYears = async (schoolId, programmeId) => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/schools/${schoolId}/programmes/${programmeId}/years`);
      setOptions(prev => ({
        ...prev,
        years: response.data.map(y => ({ value: y.id, label: y.label }))
      }));
    } catch (error) {
      console.error('Error fetching years:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSemesters = async (schoolId, programmeId, yearId) => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/schools/${schoolId}/programmes/${programmeId}/years/${yearId}/semesters`);
      setOptions(prev => ({
        ...prev,
        semesters: response.data.map(s => ({ value: s.id, label: s.name }))
      }));
    } catch (error) {
      console.error('Error fetching semesters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    
    // Reset dependent filters
    const resetKeys = {
      school: ['programme', 'year', 'semester'],
      programme: ['year', 'semester'],
      year: ['semester']
    };
    
    if (resetKeys[key]) {
      resetKeys[key].forEach(k => {
        newFilters[k] = '';
      });
      
      // Clear dependent options
      setOptions(prev => {
        const newOptions = { ...prev };
        if (key === 'school') {
          newOptions.programmes = [];
          newOptions.years = [];
          newOptions.semesters = [];
        } else if (key === 'programme') {
          newOptions.years = [];
          newOptions.semesters = [];
        } else if (key === 'year') {
          newOptions.semesters = [];
        }
        return newOptions;
      });
    }
    
    setFilters(newFilters);
  };

  const steps = [
    { key: 'school', label: 'School', options: options.schools, enabled: true },
    { key: 'programme', label: 'Programme', options: options.programmes, enabled: !!filters.school },
    { key: 'year', label: 'Year', options: options.years, enabled: !!filters.programme },
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
                style={{ width: `${(completedSteps / 4) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-semibold text-gray-600">{completedSteps}/4</span>
        </div>
        
        {allSelected && (
          <div className="flex items-center gap-1.5 bg-green-100 px-3 py-1.5 rounded-lg border border-green-300">
            <CheckCircleIcon className="w-4 h-4 text-green-700" />
            <span className="text-xs font-semibold text-green-700">Complete</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
