// src/features/admin/components/settings/ContentCheckSettings.jsx
import React, { useState, useMemo, useEffect } from "react";
import Card from "../../../../shared/components/Card";
import Button from "../../../../shared/components/Button";
import Select from "../../../../shared/components/Select";
import Input from "../../../../shared/components/Input";
import { useToast } from "../../../../shared/hooks/useToast";
import { fetchProgramConfig, saveProgramConfig } from "../../services/adminApi";

const DEFAULT_SETTINGS = {
  plagiarismCheckEnabled: false,
  similarityCheckEnabled: true,
  requireTitleAbstractApproval: false,
  flagThreshold: 60,
  autoRejectThreshold: 85,
};

const ContentCheckSettings = ({ schools, programs, years }) => {
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const { showToast } = useToast();

  const availablePrograms = useMemo(() => {
    if (!selectedSchool) return [];
    const schoolObj = schools.find((s) => s.code === selectedSchool);
    if (!schoolObj) return [];
    return programs[schoolObj.code] || [];
  }, [selectedSchool, programs, schools]);

  useEffect(() => {
    if (selectedProgram && availablePrograms.length > 0) {
      const exists = availablePrograms.find((p) => p.name === selectedProgram);
      if (!exists) setSelectedProgram("");
    } else if (availablePrograms.length === 0) {
      setSelectedProgram("");
    }
  }, [availablePrograms, selectedProgram]);

  useEffect(() => {
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
            plagiarismCheckEnabled: response.data.plagiarismCheckEnabled === true,
            similarityCheckEnabled: response.data.similarityCheckEnabled !== false,
            requireTitleAbstractApproval: response.data.requireTitleAbstractApproval === true,
            flagThreshold: response.data.flagThreshold ?? 60,
            autoRejectThreshold: response.data.autoRejectThreshold ?? 85,
          });
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
      } catch (error) {
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [selectedSchool, selectedProgram, selectedYear]);

  const handleSave = async () => {
    if (!selectedSchool || !selectedProgram || !selectedYear) {
      showToast("Please select all filters before saving", "error");
      return;
    }

    if (
      settings.flagThreshold < 0 ||
      settings.flagThreshold > 100 ||
      settings.autoRejectThreshold < 0 ||
      settings.autoRejectThreshold > 100
    ) {
      showToast("Thresholds must be between 0 and 100", "error");
      return;
    }

    if (settings.autoRejectThreshold < settings.flagThreshold) {
      showToast(
        "Auto-reject threshold cannot be lower than the flag threshold",
        "error"
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await saveProgramConfig({
        academicYear: selectedYear,
        school: selectedSchool,
        program: selectedProgram,
        plagiarismCheckEnabled: settings.plagiarismCheckEnabled,
        similarityCheckEnabled: settings.similarityCheckEnabled,
        requireTitleAbstractApproval: settings.requireTitleAbstractApproval,
        flagThreshold: settings.flagThreshold,
        autoRejectThreshold: settings.autoRejectThreshold,
      });

      if (response.success) {
        const schoolName =
          schools.find((s) => s.code === selectedSchool)?.name || selectedSchool;
        const programName =
          availablePrograms.find((p) => p.name === selectedProgram)?.name ||
          selectedProgram;
        showToast(
          `Content check settings saved for ${schoolName} - ${programName}`,
          "success"
        );
      } else {
        showToast(response.message || "Failed to save settings", "error");
      }
    } catch (error) {
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
    value: p.name, // programs are stored by name
    label: p.name,
  }));
  const yearOptions = years.map((y) => ({
    value: y.name || y.year || y.id,
    label: y.name || y.year,
  }));

  const isContextSelected = selectedSchool && selectedProgram && selectedYear;

  return (
    <Card>
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Plagiarism & AI Content Check Thresholds
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Student-submitted project titles and abstracts are automatically
            checked for plagiarism and AI-generated content. The higher of the
            two scores is compared against both thresholds below.
          </p>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-4 text-lg">
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

          {!isContextSelected && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800 font-medium">
                Please select School, Program, and Academic Year to configure
                content-check thresholds
              </p>
            </div>
          )}

          {isContextSelected && (
            <div
              className={`bg-gray-50 p-6 rounded-lg transition-opacity ${
                isLoading ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <label className="flex items-start gap-3 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={settings.similarityCheckEnabled}
                  disabled={isLoading}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      similarityCheckEnabled: e.target.checked,
                    })
                  }
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">
                    Enable duplicate-project (similarity) check
                  </span>
                  <span className="block text-xs text-gray-500 mt-1">
                    Compares each submission with approved projects using the
                    on-server model, flagging close matches for the guide and
                    auto-rejecting near-copies. When off, submissions get no
                    similarity score; approved projects are still recorded, so
                    turning it back on compares against all of them.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={settings.requireTitleAbstractApproval}
                  disabled={isLoading}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      requireTitleAbstractApproval: e.target.checked,
                    })
                  }
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">
                    Hold teams out of reviews until the guide accepts the title &amp; abstract
                  </span>
                  <span className="block text-xs text-gray-500 mt-1">
                    When on, a team does not appear in any guide or panel review
                    until its guide accepts the title &amp; abstract. Guides still
                    see it under Title &amp; Abstract Reviews. Marks already
                    entered are kept and become visible again once accepted.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={settings.plagiarismCheckEnabled}
                  disabled={isLoading}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      plagiarismCheckEnabled: e.target.checked,
                    })
                  }
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">
                    Enable plagiarism & AI-content checks
                  </span>
                  <span className="block text-xs text-gray-500 mt-1">
                    Leave off until a plagiarism/AI detection service is
                    connected. When off, these two scores are not computed and
                    never flag or reject a submission; the duplicate-project
                    similarity check still runs.
                  </span>
                </span>
              </label>

              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
                  settings.plagiarismCheckEnabled ? "" : "opacity-50"
                }`}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Flag Threshold (%)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.flagThreshold}
                    disabled={isLoading}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        flagThreshold: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Above this score, the submission is flagged for the guide's
                    attention — the guide can still choose to accept it.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto-Reject Threshold (%)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.autoRejectThreshold}
                    disabled={isLoading}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        autoRejectThreshold: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Above this score, the submission is blocked outright — the
                    student cannot submit it and must revise the content.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isContextSelected && (
            <div className="flex justify-end items-center pt-4 border-t border-gray-200">
              <Button
                variant="primary"
                onClick={handleSave}
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ContentCheckSettings;
