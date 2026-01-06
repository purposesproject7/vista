// src/features/admin/pages/AdminSettings.jsx
import React, { useState, useEffect } from "react";
import Navbar from "../../../shared/components/Navbar";
import AdminTabs from "../components/shared/AdminTabs";
import OrganizationSettings from "../components/settings/OrganizationSettings";
import TeamSettings from "../components/settings/TeamSettings";
import RubricSettings from "../components/settings/RubricSettings";
import ModificationSettings from "../components/settings/ModificationSettings";
import RoleManagement from "../components/RoleManagement";
import SchedulerManagement from "../components/SchedulerManagement";
import { INITIAL_FACULTY } from "../components/faculty-management/facultyData";
import { fetchMasterData } from "../services/adminApi";
import { useToast } from "../../../shared/hooks/useToast";
import {
  initialTeamSettings,
  initialRubrics,
} from "../components/settings/settingsData";

import {
  BuildingOffice2Icon,
  AcademicCapIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  KeyIcon,
  ClockIcon,
  DocumentTextIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState("academic-data");
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState([]);
  const [programs, setPrograms] = useState({});
  const [years, setYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [teamSettings, setTeamSettings] = useState(initialTeamSettings);
  const [rubrics, setRubrics] = useState(initialRubrics);
  const { showToast } = useToast();

  // Load master data on mount
  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      setLoading(true);
      const response = await fetchMasterData();

      if (response.success) {
        const data = response.data;

        // Transform schools
        const transformedSchools =
          data.schools
            ?.filter((s) => s.isActive !== false)
            ?.map((s) => ({ id: s._id, name: s.name, code: s.code })) || [];

        // Transform programs grouped by school (using programs from backend)
        const programsBySchool = {};
        data.programs
          ?.filter((d) => d.isActive !== false)
          .forEach((d) => {
            const schoolCode = d.school;
            if (!programsBySchool[schoolCode]) {
              programsBySchool[schoolCode] = [];
            }
            programsBySchool[schoolCode].push({
              id: d._id,
              name: d.name,
              code: d.code,
            });
          });

        // Transform academic years
        const transformedYears =
          data.academicYears
            ?.filter((y) => y.isActive !== false)
            ?.map((y) => ({ id: y._id, name: y.year })) || [];

        setSchools(transformedSchools);
        setPrograms(programsBySchool);
        setYears(transformedYears);

        // Keep mock semesters for now
        setSemesters([
          { id: "1", name: "Winter Semester" },
          { id: "2", name: "Summer Semester" },
        ]);
      }
    } catch (error) {
      console.error("Error loading master data:", error);
      showToast("Failed to load settings data", "error");
    } finally {
      setLoading(false);
    }
  };

  const settingsTabs = [
    {
      id: "academic-data",
      label: "Academic Data",
      icon: BuildingOffice2Icon,
      description: "Manage schools, programs, and academic years",
    },
    {
      id: "teams",
      label: "Team Settings",
      icon: UserGroupIcon,
      description: "Configure team sizes",
    },
    {
      id: "roles",
      label: "Roles / AD",
      icon: KeyIcon,
      description: "Assign coordinators by context",
    },
    {
      id: "scheduler",
      label: "Scheduler",
      icon: ClockIcon,
      description: "Set feature deadlines for coordinators",
    },
    {
      id: "rubrics",
      label: "Rubrics",
      icon: DocumentTextIcon,
      description: "Manage rubric templates",
    },
    {
      id: "modification",
      label: "Modification",
      icon: PencilSquareIcon,
      description: "Modify project assignments",
    },
  ];

  const handleUpdateSchools = async (updated) => {
    setSchools(updated);
    // Reload to get fresh data
    await loadMasterData();
  };

  const handleUpdatePrograms = async (updated) => {
    setPrograms(updated);
    // Programs are updated via individual API calls in ProgramSettings
    showToast("Programs list updated", "success");
  };

  const handleUpdateYears = async (updated) => {
    setYears(updated);
    // Reload to get fresh data
    await loadMasterData();
  };

  const handleUpdateSemesters = (updated) => {
    setSemesters(updated);
    // TODO: Save to backend
    console.log("Semesters updated:", updated);
  };

  const handleUpdateTeamSettings = (updated) => {
    setTeamSettings(updated);
    // TODO: Save to backend
    console.log("Team settings updated:", updated);
  };

  const handleUpdateRubrics = (updated) => {
    setRubrics(updated);
    // TODO: Save to backend
    console.log("Rubrics updated:", updated);
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
          <div className="flex flex-wrap gap-2">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all
                    ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
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
          {activeTab === "academic-data" && (
            <OrganizationSettings
              schools={schools}
              programs={programs}
              years={years}
              onUpdateSchools={handleUpdateSchools}
              onUpdatePrograms={handleUpdatePrograms}
              onUpdateYears={handleUpdateYears}
            />
          )}

          {activeTab === "teams" && (
            <TeamSettings
              schools={schools}
              programs={programs}
              years={years}
              semesters={semesters}
              initialSettings={teamSettings}
              onUpdate={handleUpdateTeamSettings}
            />
          )}

          {activeTab === "rubrics" && (
            <RubricSettings
              rubrics={rubrics}
              onUpdate={handleUpdateRubrics}
              schools={schools}
              programs={programs}
              years={years}
            />
          )}

          {activeTab === "roles" && (
            <RoleManagement
              schools={schools}
              programsBySchool={programs}
              years={years}
            />
          )}

          {activeTab === "scheduler" && (
            <SchedulerManagement
              schools={schools}
              programsBySchool={programs}
              years={years}
            />
          )}

          {activeTab === "modification" && <ModificationSettings />}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
