// src/features/faculty/components/FilterPanel.jsx - VIT Theme
import React from 'react';
import Select from '../../../shared/components/Select';
import { FunnelIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const FilterPanel = ({ filters, onFilterChange }) => {
  const yearOptions = [
    { value: '2025', label: '2025-26' },
    { value: '2024', label: '2024-25' },
  ];

  const schoolOptions = [
    { value: 'SCOPE', label: 'SCOPE' },
    { value: 'SENSE', label: 'SENSE' },
    { value: 'SELECT', label: 'SELECT' },
  ];

  const programmeOptions = [
    { value: 'BTECH', label: 'B.Tech' },
    { value: 'MTECH', label: 'M.Tech' },
  ];

  const typeOptions = [
    { value: 'guide', label: '👨‍🏫 Guide' },
    { value: 'panel', label: '👥 Panel' }
  ];

  const steps = [
    { key: 'year', label: 'Year', options: yearOptions, enabled: true },
    { key: 'school', label: 'School', options: schoolOptions, enabled: false }, // Locked
    { key: 'programme', label: 'Programme', options: programmeOptions, enabled: !!filters.year }, // Enable after Year
    { key: 'type', label: 'Role', options: typeOptions, enabled: !!filters.programme }
  ];

  const handleChange = (key, value) => {
    const stepIndex = steps.findIndex(s => s.key === key);
    const newFilters = { ...filters, [key]: value };

    // Logic: Only clear subsequent filters if they depend on this one, 
    // BUT preserve School if we are changing Year, since School is locked/independent context for visual filtering
    // Actually, originally it cleared everything after. 
    // Now provided School is "locked", we shouldn't clear it if Year changes.

    steps.slice(stepIndex + 1).forEach(step => {
      if (step.key === 'school') return; // Don't clear locked school
      newFilters[step.key] = '';
    });

    Object.keys(newFilters).forEach(k => {
      onFilterChange(k, newFilters[k]);
    });
  };

  const allSelected = steps.every(step => {
    // If locked (school), strict check might fail if it's not pre-filled.
    // Assuming parent component fills 'school' in filters. 
    // If not, we might need to pretend it's selected or handle it.
    // For now, check if value exists.
    return filters[step.key];
  });

  const completedSteps = steps.filter(step => filters[step.key]).length;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 shadow-lg border-2 border-blue-500 mb-4 sticky top-0 z-40">
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-2 flex-1">
          <FunnelIcon className="w-5 h-5 text-blue-100" />
          <h2 className="text-base font-bold text-white">Filters</h2>
          <div className="flex-1 mx-3">
            <div className="h-2 bg-blue-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-400 transition-all duration-500"
                style={{ width: `${(completedSteps / 4) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-semibold text-blue-100">{completedSteps}/4</span>
        </div>

        {allSelected && (
          <div className="flex items-center gap-1.5 bg-green-500 px-3 py-1 rounded-full border-2 border-green-400">
            <CheckCircleIcon className="w-4 h-4 text-white" />
            <span className="text-xs font-semibold text-white">Ready</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {steps.map((step) => {
          const isLocked = !step.enabled;
          // Put a lock icon if locked

          return (
            <div key={step.key} className={isLocked ? 'opacity-70' : ''}>
              <Select
                label={step.label}
                value={filters[step.key]}
                onChange={(value) => handleChange(step.key, value)}
                options={step.options}
                placeholder={isLocked ? (filters[step.key] || 'Locked') : 'Select'}
                disabled={isLocked}
                className={isLocked ? 'cursor-not-allowed bg-blue-800 text-white border-blue-600' : ''}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FilterPanel;
