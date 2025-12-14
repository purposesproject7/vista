// src/features/admin/components/request-management/requests/RequestFilters.jsx
import React, { useMemo } from 'react';
import Card from '../../../../../shared/components/Card';
import Select from '../../../../../shared/components/Select';
import { SCHOOLS, PROGRAMMES_BY_SCHOOL, REQUEST_CATEGORIES, REQUEST_STATUSES } from '../../../../../shared/constants/config';

const RequestFilters = ({ filters, onFilterChange, onReset }) => {
  const schoolOptions = useMemo(() => [
    { value: '', label: 'All Schools' },
    ...SCHOOLS.map(school => ({ value: school.name, label: school.name }))
  ], []);

  const programOptions = useMemo(() => {
    const allPrograms = Object.values(PROGRAMMES_BY_SCHOOL).flat();
    return [
      { value: '', label: 'All Programs' },
      ...allPrograms.map(program => ({ value: program.name, label: program.name }))
    ];
  }, []);

  const categoryOptions = useMemo(() => [
    { value: '', label: 'All Categories' },
    ...REQUEST_CATEGORIES.map(cat => ({ value: cat.id, label: `${cat.name} Requests` }))
  ], []);

  const statusOptions = useMemo(() => [
    { value: '', label: 'All Status' },
    ...REQUEST_STATUSES.map(status => ({ value: status.id, label: status.name }))
  ], []);

  return (
    <Card className="mb-6">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <button
            onClick={onReset}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            Reset All
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School
            </label>
            <Select
              value={filters.school}
              onChange={(e) => onFilterChange('school', e.target.value)}
              options={schoolOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Program
            </label>
            <Select
              value={filters.program}
              onChange={(e) => onFilterChange('program', e.target.value)}
              options={programOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <Select
              value={filters.category}
              onChange={(e) => onFilterChange('category', e.target.value)}
              options={categoryOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <Select
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              options={statusOptions}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RequestFilters;
