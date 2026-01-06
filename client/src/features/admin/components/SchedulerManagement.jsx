import { useMemo, useState, useEffect } from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import LoadingSpinner from "../../../shared/components/LoadingSpinner";
import DateTimePicker from "../../../shared/components/DateTimePicker";
import { useToast } from "../../../shared/hooks/useToast";
import {
  fetchDepartmentConfig,
  createDepartmentConfig,
  updateDepartmentConfig,
  updateFeatureLock,
} from "../services/adminApi";

const FEATURES = [
  { id: "faculty-addition", label: "Faculty Addition" },
  { id: "student-addition", label: "Student Addition" },
  { id: "panel-creation", label: "Panel Creation" },
  { id: "project-assignment", label: "Project Assignment" },
  { id: "marks-entry", label: "Marks Entry" },
];

const toDatetimeLocalValue = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString();
};

const SchedulerManagement = ({ schools, programsBySchool, years }) => {
  const { showToast } = useToast();

  // Academic Context Selection
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedProgramme, setSelectedProgramme] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  // Department config data
  const [departmentConfig, setDepartmentConfig] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [selectedFeature, setSelectedFeature] = useState("");
  const [activeUntil, setActiveUntil] = useState("");

  const availableProgrammes = useMemo(() => {
    if (!selectedSchool) return [];
    const schoolObj = schools.find((s) => s.code === selectedSchool);
    if (!schoolObj) return [];
    return programsBySchool?.[schoolObj.code] || [];
  }, [selectedSchool, programsBySchool, schools]);

  const filtersComplete = useMemo(() => {
    const completed = [selectedSchool, selectedProgramme, selectedYear].filter(
      Boolean
    ).length;
    return { completed, total: 3, percentage: (completed / 3) * 100 };
  }, [selectedSchool, selectedProgramme, selectedYear]);

  // Load department config when context changes
  useEffect(() => {
    if (filtersComplete.completed === 3) {
      loadDepartmentConfig();
    } else {
      setDepartmentConfig(null);
    }
  }, [selectedSchool, selectedProgramme, selectedYear]);

  const loadDepartmentConfig = async () => {
    setLoading(true);
    try {
      const yearObj = years.find((y) => y.id === parseInt(selectedYear));
      const schoolObj = schools.find((s) => s.code === selectedSchool);
      const programObj = programsBySchool[selectedSchool]?.find(
        (p) => p.code === selectedProgramme
      );

      if (!yearObj || !schoolObj || !programObj) {
        return;
      }

      const response = await fetchDepartmentConfig(
        yearObj.name,
        schoolObj.code,
        programObj.code
      );

      if (response.success) {
        setDepartmentConfig(response.data);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        // Config doesn't exist yet
        setDepartmentConfig(null);
      } else {
        console.error("Error loading department config:", error);
        showToast("Failed to load configuration", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const contextSchedules = useMemo(() => {
    if (!departmentConfig || !departmentConfig.featureLocks) return [];
    return departmentConfig.featureLocks;
  }, [departmentConfig]);

  const handleSchoolChange = (value) => {
    setSelectedSchool(value);
    setSelectedProgramme("");
    setSelectedYear("");
    setSelectedFeature("");
    setActiveUntil("");
  };

  const handleProgrammeChange = (value) => {
    setSelectedProgramme(value);
    setSelectedYear("");
    setSelectedFeature("");
    setActiveUntil("");
  };

  const handleYearChange = (value) => {
    setSelectedYear(value);
    setSelectedFeature("");
    setActiveUntil("");
  };

  const handleSaveSchedule = async () => {
    if (!selectedFeature) {
      showToast("Please select a feature", "error");
      return;
    }

    if (!activeUntil) {
      showToast("Please set an active until date/time", "error");
      return;
    }

    const activeUntilIso = new Date(activeUntil).toISOString();
    if (Number.isNaN(new Date(activeUntilIso).getTime())) {
      showToast("Invalid date/time selected", "error");
      return;
    }

    const yearObj = years.find((y) => y.id === parseInt(selectedYear));
    const schoolObj = schools.find((s) => s.code === selectedSchool);
    const programObj = programsBySchool[selectedSchool]?.find(
      (p) => p.code === selectedProgramme
    );

    if (!yearObj || !schoolObj || !programObj) {
      showToast("Invalid context", "error");
      return;
    }

    setLoading(true);
    try {
      let updatedLocks = [...(contextSchedules || [])];
      const existingIndex = updatedLocks.findIndex(
        (l) => l.feature === selectedFeature
      );

      if (existingIndex >= 0) {
        updatedLocks[existingIndex] = {
          ...updatedLocks[existingIndex],
          activeUntil: activeUntilIso,
        };
      } else {
        updatedLocks.push({
          feature: selectedFeature,
          activeUntil: activeUntilIso,
          isLocked: false,
        });
      }

      if (departmentConfig) {
        // Update existing config
        await updateFeatureLock(departmentConfig._id, updatedLocks);
      } else {
        // Create new config
        await createDepartmentConfig(
          yearObj.name,
          schoolObj.code,
          programObj.code,
          {
            maxTeamSize: 4,
            minTeamSize: 1,
            maxPanelSize: 5,
            minPanelSize: 3,
            featureLocks: updatedLocks,
          }
        );
      }

      showToast("Schedule saved successfully", "success");
      await loadDepartmentConfig();
      setSelectedFeature("");
      setActiveUntil("");
    } catch (error) {
      console.error("Error saving schedule:", error);
      showToast(
        error.response?.data?.message || "Failed to save schedule",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSchedule = async (featureId) => {
    if (!departmentConfig) return;

    setLoading(true);
    try {
      const updatedLocks = contextSchedules.filter(
        (l) => l.feature !== featureId
      );
      await updateFeatureLock(departmentConfig._id, updatedLocks);

      showToast("Schedule removed", "success");
      await loadDepartmentConfig();

      if (selectedFeature === featureId) {
        setSelectedFeature("");
        setActiveUntil("");
      }
    } catch (error) {
      console.error("Error removing schedule:", error);
      showToast("Failed to remove schedule", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExisting = (featureId) => {
    const existingSchedule = contextSchedules.find(
      (s) => s.feature === featureId
    );
    if (existingSchedule) {
      setSelectedFeature(featureId);
      setActiveUntil(toDatetimeLocalValue(existingSchedule.activeUntil));
    }
  };

  const isFeatureScheduled = (featureId) => {
    return contextSchedules.some((s) => s.feature === featureId);
  };

  const getFeatureSchedule = (featureId) => {
    return contextSchedules.find((s) => s.feature === featureId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Feature Scheduler</h2>
        <p className="text-sm text-gray-600 mt-1">
          Set feature availability deadlines for specific academic contexts
        </p>
      </div>

      {/* Context Selection */}
      <Card>
        <div className="p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Academic Context
          </h3>

          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Selection Progress: {filtersComplete.completed}/3
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(filtersComplete.percentage)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${filtersComplete.percentage}%` }}
                />
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School
                </label>
                <select
                  value={selectedSchool}
                  onChange={(e) => handleSchoolChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select School</option>
                  {schools.map((school) => (
                    <option key={school.code} value={school.code}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Programme
                </label>
                <select
                  value={selectedProgramme}
                  onChange={(e) => handleProgrammeChange(e.target.value)}
                  disabled={!selectedSchool}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select Programme</option>
                  {availableProgrammes.map((prog) => (
                    <option key={prog.code} value={prog.code}>
                      {prog.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year & Semester
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  disabled={!selectedProgramme}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select Year</option>
                  {years.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Schedule Form */}
      {filtersComplete.completed === 3 && (
        <Card>
          <div className="p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-blue-600" />
              Set Feature Deadline
            </h3>

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Feature
                    </label>
                    <select
                      value={selectedFeature}
                      onChange={(e) => setSelectedFeature(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Feature</option>
                      {FEATURES.map((feature) => (
                        <option key={feature.id} value={feature.id}>
                          {feature.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <DateTimePicker
                      label="Active Until"
                      value={activeUntil}
                      onChange={(value) => setActiveUntil(value)}
                      placeholder="Select deadline date and time"
                      timeFormat="12"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveSchedule}
                    disabled={!selectedFeature || !activeUntil || loading}
                  >
                    Save Schedule
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Scheduled Features */}
      {filtersComplete.completed === 3 && contextSchedules.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Scheduled Features ({contextSchedules.length})
            </h3>

            <div className="space-y-3">
              {contextSchedules.map((schedule) => {
                const feature = FEATURES.find((f) => f.id === schedule.feature);
                const deadline = new Date(schedule.activeUntil);
                const isExpired = deadline < new Date();

                return (
                  <div
                    key={schedule.feature}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {isExpired ? (
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                        ) : (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {feature?.label || schedule.feature}
                          </p>
                          <p className="text-sm text-gray-500">
                            Active until: {deadline.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSelectExisting(schedule.feature)}
                        disabled={loading}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRemoveSchedule(schedule.feature)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={loading}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SchedulerManagement;
