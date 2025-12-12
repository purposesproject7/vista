// src/features/admin/pages/AdminSettings.jsx
import React, { useState } from 'react';
import Navbar from '../../../shared/components/Navbar';
import AdminTabs from '../components/shared/AdminTabs';
import AcademicDataSettings from '../components/settings/AcademicDataSettings';
import ProgramSettings from '../components/settings/ProgramSettings';
import TeamSettings from '../components/settings/TeamSettings';
import RubricSettings from '../components/settings/RubricSettings';
import {
  initialSchools,
  initialPrograms,
  initialYears,
  initialSemesters,
  initialTeamSettings,
  initialRubrics
} from '../components/settings/settingsData';

const AdminSettings = () => {
  const [schools, setSchools] = useState(initialSchools);
  const [programs, setPrograms] = useState(initialPrograms);
  const [years, setYears] = useState(initialYears);
  const [semesters, setSemesters] = useState(initialSemesters);
  const [teamSettings, setTeamSettings] = useState(initialTeamSettings);
  const [rubrics, setRubrics] = useState(initialRubrics);

  const handleUpdateSchools = (updated) => {
    setSchools(updated);
    // TODO: Save to backend
    console.log('Schools updated:', updated);
  };

  const handleUpdatePrograms = (updated) => {
    setPrograms(updated);
    // TODO: Save to backend
    console.log('Programs updated:', updated);
  };

  const handleUpdateYears = (updated) => {
    setYears(updated);
    // TODO: Save to backend
    console.log('Years updated:', updated);
  };

  const handleUpdateSemesters = (updated) => {
    setSemesters(updated);
    // TODO: Save to backend
    console.log('Semesters updated:', updated);
  };

  const handleUpdateTeamSettings = (updated) => {
    setTeamSettings(updated);
    // TODO: Save to backend
    console.log('Team settings updated:', updated);
  };

  const handleUpdateRubrics = (updated) => {
    setRubrics(updated);
    // TODO: Save to backend
    console.log('Rubrics updated:', updated);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <AdminTabs />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-sm text-gray-600 mt-1">
            Configure academic data, team settings, and evaluation rubrics
          </p>
        </div>

        <div className="space-y-8">
          {/* Schools */}
          <AcademicDataSettings
            data={schools}
            onUpdate={handleUpdateSchools}
            title="School"
            type="school"
          />

          {/* Programs */}
          <ProgramSettings
            schools={schools}
            programs={programs}
            onUpdate={handleUpdatePrograms}
          />

          {/* Academic Years */}
          <AcademicDataSettings
            data={years}
            onUpdate={handleUpdateYears}
            title="Academic Year"
            type="year"
          />

          {/* Semesters */}
          <AcademicDataSettings
            data={semesters}
            onUpdate={handleUpdateSemesters}
            title="Semester"
            type="semester"
          />

          {/* Team Settings */}
          <TeamSettings
            schools={schools}
            programs={programs}
            years={years}
            semesters={semesters}
            initialSettings={teamSettings}
            onUpdate={handleUpdateTeamSettings}
          />

          {/* Rubrics */}
          <RubricSettings
            rubrics={rubrics}
            onUpdate={handleUpdateRubrics}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

