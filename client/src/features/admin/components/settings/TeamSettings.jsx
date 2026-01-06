// src/features/admin/components/settings/TeamSettings.jsx
import React, { useState, useMemo } from "react";
import Card from "../../../../shared/components/Card";
import Button from "../../../../shared/components/Button";
import Select from "../../../../shared/components/Select";
import Input from "../../../../shared/components/Input";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { useToast } from "../../../../shared/hooks/useToast";
import { fetchProgramConfig, saveProgramConfig } from "../../services/adminApi";

const TeamSettings = ({
  schools,
  programs,
  years,
  semesters,
  initialSettings,
  onUpdate,
}) => {
  // State for selected filters
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Default settings
  const defaultSettings = {
    minStudentsPerTeam: 1,
    maxStudentsPerTeam: 4,
    defaultStudentsPerTeam: 3,
  };

  const [settings, setSettings] = useState(defaultSettings);
  const { showToast } = useToast();

  // Get programs for selected school
  const availablePrograms = useMemo(() => {
    if (!selectedSchool) return [];
    // Find the school object by code
    const schoolObj = schools.find((s) => s.code === selectedSchool);
    if (!schoolObj) return [];
    // Get programs for this school code
    return programs[schoolObj.code] || [];
  }, [selectedSchool, programs, schools]);

  // Reset program selection when available programs change or school changes
  React.useEffect(() => {
    // If we have a selected program but it's not in the new available list, clear it
    if (selectedProgram && availablePrograms.length > 0) {
      const exists = availablePrograms.find((p) => p.code === selectedProgram);
      if (!exists) {
        setSelectedProgram("");
      }
    } else if (availablePrograms.length === 0) {
      // If no programs available (e.g. school changed to one with no programs), clear selection
      setSelectedProgram("");
    }
  }, [availablePrograms, selectedProgram]);

  // Fetch configuration when filters change
  React.useEffect(() => {
    const loadConfig = async () => {
      if (!selectedSchool || !selectedProgram || !selectedYear) return;

      setIsLoading(true);
      try {
        const response = await fetchProgramConfig(
          selectedYear,
          selectedSchool,
          selectedProgram
        );
        if (response.success && response.data) {
          setSettings({
            minStudentsPerTeam: response.data.minTeamSize || 1,
            maxStudentsPerTeam: response.data.maxTeamSize || 4,
            defaultStudentsPerTeam:
              response.data.defaultTeamSize ||
              Math.floor(
                (response.data.minTeamSize + response.data.maxTeamSize) / 2
              ) ||
              3,
          });
        } else {
          setSettings(defaultSettings);
        }
      } catch (error) {
        // 404 is expected for new configs, just reset to defaults
        setSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [selectedSchool, selectedProgram, selectedYear]);

  const handleSave = async () => {
    // Validation
    if (settings.minStudentsPerTeam > settings.maxStudentsPerTeam) {
      showToast("Minimum cannot be greater than maximum", "error");
      return;
    }

    // Default isn't in DB yet, but simplified validation
    if (
      settings.defaultStudentsPerTeam < settings.minStudentsPerTeam ||
      settings.defaultStudentsPerTeam > settings.maxStudentsPerTeam
    ) {
      showToast(
        "Recommended size must be between minimum and maximum",
        "error"
      );
      return;
    }

    if (!selectedSchool || !selectedProgram || !selectedYear) {
      showToast("Please select all filters before saving", "error");
      return;
    }

    setIsLoading(true);
    try {
      const configData = {
        academicYear: selectedYear,
        school: selectedSchool,
        program: selectedProgram,
        minTeamSize: settings.minStudentsPerTeam,
        maxTeamSize: settings.maxStudentsPerTeam,
        defaultTeamSize: settings.defaultStudentsPerTeam,
      };

      const response = await saveProgramConfig(configData);

      if (response.success) {
        // Build descriptive names for toast
        const schoolName =
          schools.find((s) => s.code === selectedSchool)?.name ||
          selectedSchool;
        const programName =
          availablePrograms.find((p) => p.code === selectedProgram)?.name ||
          selectedProgram;

        showToast(
          `Team settings saved for ${schoolName} - ${programName}`,
          "success"
        );
        onUpdate?.(); // Notify parent
      } else {
        showToast(response.message || "Failed to save settings", "error");
      }
    } catch (error) {
      console.error("Save settings error:", error);
      showToast(
        error.response?.data?.message || "Failed to connect to server",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const schoolOptions = schools.map((s) => ({ value: s.code, label: s.name }));
  const programOptions = availablePrograms.map((p) => ({
    value: p.code,
    label: p.name,
  }));
  // Adjust year options to use 'year' string as value if that's what backend expects (schema: academicYear: String)
  const yearOptions = years.map((y) => ({
    value: y.name || y.year || y.id,
    label: y.name || y.year,
  }));

  // Check if all context filters are selected
  const isContextSelected = selectedSchool && selectedProgram && selectedYear;

  return (
    <Card>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Team Size Configuration
            </h3>
          </div>
        </div>

        <div className="space-y-8">
          {/* Selection Filters */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-4 text-lg flex items-center gap-2">
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
                  disabled={schools.length === 0 || isLoading}
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
                  disabled={availablePrograms.length === 0 || isLoading}
                />
                {availablePrograms.length === 0 && selectedSchool && (
                  <p className="text-xs text-red-600 mt-1">
                    No programs for this school
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <Select
                  value={selectedYear}
                  onChange={(value) => setSelectedYear(value)}
                  options={yearOptions}
                  disabled={years.length === 0 || isLoading}
                />
              </div>
            </div>
          </div>

          {/* Team Size Configuration */}
          <div
            className={`bg-gray-50 p-6 rounded-lg transition-opacity ${
              isLoading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            <h4 className="font-semibold text-gray-900 mb-4 text-lg">
              Team Size Settings
            </h4>

            {/* Minimum Students */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-700">
                  Minimum Students Per Team
                </label>
              </div>
              <Input
                type="number"
                min={1}
                max={10}
                value={settings.minStudentsPerTeam}
                disabled={!isContextSelected || isLoading}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    minStudentsPerTeam: parseInt(e.target.value) || 0,
                  })
                }
              />
              <p className="text-sm text-gray-600 mt-3">
                The minimum number of students allowed in a team. Set to 1 to
                allow individual projects.
              </p>
            </div>

            {/* Maximum Students */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-700">
                  Maximum Students Per Team
                </label>
              </div>
              <Input
                type="number"
                min={1}
                max={10}
                value={settings.maxStudentsPerTeam}
                disabled={!isContextSelected || isLoading}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxStudentsPerTeam: parseInt(e.target.value) || 0,
                  })
                }
              />
              <p className="text-sm text-gray-600 mt-3">
                The maximum number of students allowed in a team. Typical values
                are 3-5 students.
              </p>
            </div>

            {/* Default Students (UI Helper only now) */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-blue-900">
                  Default Students Per Team (Recommended)
                </label>
              </div>
              <Input
                type="number"
                min={1}
                max={10}
                value={settings.defaultStudentsPerTeam}
                disabled={!isContextSelected || isLoading}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultStudentsPerTeam: parseInt(e.target.value) || 0,
                  })
                }
              />
              <p className="text-sm text-blue-900 mt-3">
                This value is for reference and will be used as a suggestion.
              </p>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 mt-6">
              <h4 className="font-semibold text-gray-900 mb-3 text-lg">
                Summary
              </h4>
              <div className="space-y-2 text-gray-700">
                <p className="flex items-center justify-between text-lg">
                  <span>Team size range:</span>
                  <strong className="text-blue-700">
                    {settings.minStudentsPerTeam} -{" "}
                    {settings.maxStudentsPerTeam} students
                  </strong>
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end items-center pt-4 border-t border-gray-200">
            <Button
              variant="primary"
              onClick={handleSave}
              size="lg"
              disabled={
                !selectedSchool ||
                !selectedProgram ||
                !selectedYear ||
                isLoading
              }
            >
              {isLoading ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TeamSettings;
