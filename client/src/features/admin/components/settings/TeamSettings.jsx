// src/features/admin/components/settings/TeamSettings.jsx
import React, { useState, useMemo } from 'react';
import Card from '../../../../shared/components/Card';
import Button from '../../../../shared/components/Button';
import Select from '../../../../shared/components/Select';
import SliderInput from '../../../../shared/components/SliderInput';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../../../shared/hooks/useToast';

const TeamSettings = ({ schools, programs, years, semesters, initialSettings, onUpdate }) => {
  // State for selected filters
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // State for all team configurations (keyed by school-program-year)
  const [allConfigurations, setAllConfigurations] = useState(initialSettings || {});

  const { showToast } = useToast();

  // Generate configuration key
  const getCurrentKey = () => {
    return `${selectedSchool}-${selectedProgram}-${selectedYear}`;
  };

  // Get current configuration for selected filters
  const currentConfig = useMemo(() => {
    const key = getCurrentKey();
    return allConfigurations[key] || {
      minStudentsPerTeam: 1,
      maxStudentsPerTeam: 4,
      defaultStudentsPerTeam: 3
    };
  }, [selectedSchool, selectedProgram, selectedYear, allConfigurations]);

  const [settings, setSettings] = useState(currentConfig);

  // Update settings when selection changes
  React.useEffect(() => {
    setSettings(currentConfig);
  }, [currentConfig]);

  // Get programs for selected school
  const availablePrograms = useMemo(() => {
    if (!selectedSchool) return [];
    // Find the school object by code
    const schoolObj = schools.find(s => s.code === selectedSchool);
    if (!schoolObj) return [];
    // Get programs for this school code
    return programs[schoolObj.code] || [];
  }, [selectedSchool, programs, schools]);

  // Update program selection when school changes
  React.useEffect(() => {
    if (schools.length > 0 && !selectedSchool) {
      setSelectedSchool(schools[0].code);
    }
  }, [schools, selectedSchool]);

  React.useEffect(() => {
    if (availablePrograms.length > 0 && !selectedProgram) {
      setSelectedProgram(availablePrograms[0].code);
    } else if (availablePrograms.length === 0) {
      setSelectedProgram('');
    }
  }, [availablePrograms, selectedProgram]);

  React.useEffect(() => {
    if (years.length > 0 && !selectedYear) {
      setSelectedYear(years[0].id);
    }
  }, [years, selectedYear]);

  const handleSave = () => {
    // Validation
    if (settings.minStudentsPerTeam > settings.maxStudentsPerTeam) {
      showToast('Minimum cannot be greater than maximum', 'error');
      return;
    }
    
    if (settings.defaultStudentsPerTeam < settings.minStudentsPerTeam || 
        settings.defaultStudentsPerTeam > settings.maxStudentsPerTeam) {
      showToast('Default must be between minimum and maximum', 'error');
      return;
    }

    if (!selectedSchool || !selectedProgram || !selectedYear) {
      showToast('Please select all filters before saving', 'error');
      return;
    }

    // Save configuration
    const key = getCurrentKey();
    const updatedConfigurations = {
      ...allConfigurations,
      [key]: settings
    };
    
    setAllConfigurations(updatedConfigurations);
    onUpdate?.(updatedConfigurations);

    // Build descriptive names for toast
    const schoolName = schools.find(s => s.code === selectedSchool)?.name || selectedSchool;
    const programName = availablePrograms.find(p => p.code === selectedProgram)?.name || selectedProgram;
    const yearName = years.find(y => y.id === selectedYear)?.name || selectedYear;
    
    showToast(`Team settings saved for ${schoolName} - ${programName} - ${yearName}`, 'success');
  };

  const schoolOptions = schools.map(s => ({ value: s.code, label: s.name }));
  const programOptions = availablePrograms.map(p => ({ value: p.code, label: p.name }));
  const yearOptions = years.map(y => ({ value: y.id, label: y.name }));

  const isConfigured = allConfigurations[getCurrentKey()] !== undefined;

  return (
    <Card>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Team Size Configuration</h3>
          </div>
        </div>

        <div className="space-y-8">
          {/* Selection Filters */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-4 text-lg flex items-center gap-2">
              {isConfigured && <CheckCircleIcon className="h-5 w-5 text-green-600" />}
              Select Configuration Context
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School <span className="text-red-500">*</span>
                </label>
                <Select
                  value={selectedSchool}
                  onChange={(value) => setSelectedSchool(value)}
                  options={schoolOptions}
                  disabled={schools.length === 0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program <span className="text-red-500">*</span>
                </label>
                <Select
                  value={selectedProgram}
                  onChange={(value) => setSelectedProgram(value)}
                  options={programOptions}
                  disabled={availablePrograms.length === 0}
                />
                {availablePrograms.length === 0 && selectedSchool && (
                  <p className="text-xs text-red-600 mt-1">No programs for this school</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year & Semester <span className="text-red-500">*</span>
                </label>
                <Select
                  value={selectedYear}
                  onChange={(value) => setSelectedYear(value)}
                  options={yearOptions}
                  disabled={years.length === 0}
                />
              </div>
            </div>
            {isConfigured && (
              <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                <CheckCircleIcon className="h-5 w-5" />
                <span>Configuration saved for this combination</span>
              </div>
            )}
          </div>

          {/* Team Size Configuration */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-4 text-lg">Team Size Settings</h4>
            
            {/* Minimum Students */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-700">
                  Minimum Students Per Team
                </label>
                <span className="text-3xl font-bold text-blue-600">
                  {settings.minStudentsPerTeam}
                </span>
              </div>
              <SliderInput
                min={1}
                max={10}
                value={settings.minStudentsPerTeam}
                onChange={(value) => setSettings({ ...settings, minStudentsPerTeam: value })}
              />
              <p className="text-sm text-gray-600 mt-3">
                The minimum number of students allowed in a team. Set to 1 to allow individual projects.
              </p>
            </div>

            {/* Maximum Students */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-700">
                  Maximum Students Per Team
                </label>
                <span className="text-3xl font-bold text-blue-600">
                  {settings.maxStudentsPerTeam}
                </span>
              </div>
              <SliderInput
                min={1}
                max={10}
                value={settings.maxStudentsPerTeam}
                onChange={(value) => setSettings({ ...settings, maxStudentsPerTeam: value })}
              />
              <p className="text-sm text-gray-600 mt-3">
                The maximum number of students allowed in a team. Typical values are 3-5 students.
              </p>
            </div>

            {/* Default Students */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-blue-900">
                  Default Students Per Team (Recommended)
                </label>
                <span className="text-3xl font-bold text-blue-600">
                  {settings.defaultStudentsPerTeam}
                </span>
              </div>
              <SliderInput
                min={1}
                max={10}
                value={settings.defaultStudentsPerTeam}
                onChange={(value) => setSettings({ ...settings, defaultStudentsPerTeam: value })}
              />
              <p className="text-sm text-blue-900 mt-3">
                The recommended team size. This will be suggested when creating new teams.
              </p>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 mt-6">
              <h4 className="font-semibold text-gray-900 mb-3 text-lg">Summary</h4>
              <div className="space-y-2 text-gray-700">
                <p className="flex items-center justify-between text-lg">
                  <span>Team size range:</span>
                  <strong className="text-blue-700">
                    {settings.minStudentsPerTeam} - {settings.maxStudentsPerTeam} students
                  </strong>
                </p>
                <p className="flex items-center justify-between text-lg">
                  <span>Recommended size:</span>
                  <strong className="text-blue-700">
                    {settings.defaultStudentsPerTeam} students
                  </strong>
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {Object.keys(allConfigurations).length > 0 && (
                <span className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  {Object.keys(allConfigurations).length} configuration{Object.keys(allConfigurations).length !== 1 ? 's' : ''} saved
                </span>
              )}
            </div>
            <Button 
              variant="primary" 
              onClick={handleSave} 
              size="lg"
              disabled={!selectedSchool || !selectedProgram || !selectedYear}
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TeamSettings;
