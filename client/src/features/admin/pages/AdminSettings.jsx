// src/features/admin/pages/AdminSettings.jsx
import React, { useState } from 'react';
import Navbar from '../../../shared/components/Navbar';
import AdminTabs from '../components/shared/AdminTabs';
import AcademicDataSettings from '../components/settings/AcademicDataSettings';
import ProgramSettings from '../components/settings/ProgramSettings';
import TeamSettings from '../components/settings/TeamSettings';
import RubricSettings from '../components/settings/RubricSettings';
import ModificationSettings from '../components/settings/ModificationSettings';
import RoleManagement from '../components/RoleManagement';
import SchedulerManagement from '../components/SchedulerManagement';
import { INITIAL_FACULTY } from '../components/faculty-management/facultyData';
import {
  initialSchools,
  initialPrograms,
  initialYears,
  initialSemesters,
  initialTeamSettings,
  initialRubrics
} from '../components/settings/settingsData';

import {
  BuildingOffice2Icon,
  AcademicCapIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  KeyIcon,
  ClockIcon,
  DocumentTextIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('schools');
  const [schools, setSchools] = useState(initialSchools);
  const [programs, setPrograms] = useState(initialPrograms);
  const [years, setYears] = useState(initialYears);
  const [semesters, setSemesters] = useState(initialSemesters);
  const [teamSettings, setTeamSettings] = useState(initialTeamSettings);
  const [rubrics, setRubrics] = useState(initialRubrics);

  // Role assignments for Project Coordinators (used by Roles + Scheduler tabs)
  const [coordinatorAssignments, setCoordinatorAssignments] = useState([
    {
      schoolId: 1,
      programId: 1,
      yearId: 2024,
      semesterId: 1,
      coordinators: ['F001', 'F002'],
      mainCoordinator: 'F001'
    }
  ]);

  // Feature schedules applied to Project Coordinators per academic context
  const [schedules, setSchedules] = useState([
    {
      schoolId: 1,
      programId: 1,
      yearId: 2024,
      semesterId: 1,
      featureId: 'faculty-addition',
      activeUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]);

  const settingsTabs = [
    { 
      id: 'schools', 
      label: 'Schools', 
      icon: BuildingOffice2Icon,
      description: 'Manage schools'
    },
    { 
      id: 'programs', 
      label: 'Programs', 
      icon: AcademicCapIcon,
      description: 'Manage programs'
    },
    { 
      id: 'years', 
      label: 'Academic Years', 
      icon: CalendarDaysIcon,
      description: 'Manage years'
    },
    { 
      id: 'semesters', 
      label: 'Semesters', 
      icon: ClipboardDocumentListIcon,
      description: 'Manage semesters'
    },
    { 
      id: 'teams', 
      label: 'Team Settings', 
      icon: UserGroupIcon,
      description: 'Configure team sizes'
    },
    { 
      id: 'roles', 
      label: 'Roles / AD', 
      icon: KeyIcon,
      description: 'Assign coordinators by context'
    },
    { 
      id: 'scheduler', 
      label: 'Scheduler', 
      icon: ClockIcon,
      description: 'Set feature deadlines for coordinators'
    },
    { 
      id: 'rubrics', 
      label: 'Rubrics', 
      icon: DocumentTextIcon,
      description: 'Manage rubric templates'
    },
    { 
      id: 'modification', 
      label: 'Modification', 
      icon: PencilSquareIcon,
      description: 'Modify project assignments'
    }
  ];

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
        </div>

        {/* Settings Tabs */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-2">
          <div className="flex gap-2">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  title={tab.description}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings Content */}
        <div>
          {activeTab === 'schools' && (
            <AcademicDataSettings
              data={schools}
              onUpdate={handleUpdateSchools}
              title="School"
              type="school"
            />
          )}

          {activeTab === 'programs' && (
            <ProgramSettings
              schools={schools}
              programs={programs}
              onUpdate={handleUpdatePrograms}
            />
          )}

          {activeTab === 'years' && (
            <AcademicDataSettings
              data={years}
              onUpdate={handleUpdateYears}
              title="Academic Year"
              type="year"
            />
          )}

          {activeTab === 'semesters' && (
            <AcademicDataSettings
              data={semesters}
              onUpdate={handleUpdateSemesters}
              title="Semester"
              type="semester"
            />
          )}

          {activeTab === 'teams' && (
            <TeamSettings
              schools={schools}
              programs={programs}
              years={years}
              semesters={semesters}
              initialSettings={teamSettings}
              onUpdate={handleUpdateTeamSettings}
            />
          )}

          {activeTab === 'rubrics' && (
            <RubricSettings
              rubrics={rubrics}
              onUpdate={handleUpdateRubrics}
            />
          )}

          {activeTab === 'roles' && (
            <RoleManagement
              schools={schools}
              programsBySchool={programs}
              years={years}
              semesters={semesters}
              facultyData={INITIAL_FACULTY}
              coordinatorAssignments={coordinatorAssignments}
              setCoordinatorAssignments={setCoordinatorAssignments}
            />
          )}

          {activeTab === 'scheduler' && (
            <SchedulerManagement
              schools={schools}
              programsBySchool={programs}
              years={years}
              semesters={semesters}
              facultyData={INITIAL_FACULTY}
              coordinatorAssignments={coordinatorAssignments}
              schedules={schedules}
              setSchedules={setSchedules}
            />
          )}

          {activeTab === 'modification' && (
            <ModificationSettings />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

