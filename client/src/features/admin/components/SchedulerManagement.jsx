import { useMemo, useState } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import { useToast } from '../../../shared/hooks/useToast';

const FEATURES = [
  { id: 'faculty-addition', label: 'Faculty Addition' },
  { id: 'student-addition', label: 'Student Addition' },
  { id: 'panel-creation', label: 'Panel Creation' },
  { id: 'project-assignment', label: 'Project Assignment' },
  { id: 'marks-entry', label: 'Marks Entry' }
];

const toDatetimeLocalValue = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
};

const SchedulerManagement = ({
  schools,
  programsBySchool,
  years,
  semesters,
  facultyData,
  coordinatorAssignments,
  schedules,
  setSchedules
}) => {
  const { showToast } = useToast();

  // Academic Context Selection
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedProgramme, setSelectedProgramme] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  // Form state
  const [selectedFeature, setSelectedFeature] = useState('');
  const [activeUntil, setActiveUntil] = useState('');

  const availableProgrammes = useMemo(() => {
    if (!selectedSchool) return [];
    return programsBySchool?.[selectedSchool] || [];
  }, [selectedSchool, programsBySchool]);

  const filtersComplete = useMemo(() => {
    const completed = [
      selectedSchool,
      selectedProgramme,
      selectedYear,
      selectedSemester
    ].filter(Boolean).length;
    return { completed, total: 4, percentage: (completed / 4) * 100 };
  }, [selectedSchool, selectedProgramme, selectedYear, selectedSemester]);

  const contextKey = useMemo(() => {
    if (filtersComplete.completed !== 4) return null;
    return {
      schoolId: parseInt(selectedSchool),
      programId: parseInt(selectedProgramme),
      yearId: parseInt(selectedYear),
      semesterId: parseInt(selectedSemester)
    };
  }, [filtersComplete, selectedSchool, selectedProgramme, selectedYear, selectedSemester]);

  const contextFaculty = useMemo(() => {
    if (!contextKey) return [];
    return (facultyData || []).filter(
      (f) =>
        f.schoolId === contextKey.schoolId &&
        f.programId === contextKey.programId &&
        f.yearId === contextKey.yearId &&
        f.semesterId === contextKey.semesterId
    );
  }, [contextKey, facultyData]);

  const currentAssignment = useMemo(() => {
    if (!contextKey) return null;
    return (coordinatorAssignments || []).find(
      (a) =>
        a.schoolId === contextKey.schoolId &&
        a.programId === contextKey.programId &&
        a.yearId === contextKey.yearId &&
        a.semesterId === contextKey.semesterId
    );
  }, [contextKey, coordinatorAssignments]);

  const assignedCoordinators = useMemo(() => {
    if (!currentAssignment) return [];
    return (currentAssignment.coordinators || [])
      .map((id) => contextFaculty.find((f) => f.id === id))
      .filter(Boolean);
  }, [currentAssignment, contextFaculty]);

  const contextSchedules = useMemo(() => {
    if (!contextKey) return [];
    return (schedules || []).filter(
      (s) =>
        s.schoolId === contextKey.schoolId &&
        s.programId === contextKey.programId &&
        s.yearId === contextKey.yearId &&
        s.semesterId === contextKey.semesterId
    );
  }, [contextKey, schedules]);

  const handleSchoolChange = (value) => {
    setSelectedSchool(value);
    setSelectedProgramme('');
    setSelectedYear('');
    setSelectedSemester('');
    setSelectedFeature('');
    setActiveUntil('');
  };

  const handleProgrammeChange = (value) => {
    setSelectedProgramme(value);
    setSelectedYear('');
    setSelectedSemester('');
    setSelectedFeature('');
    setActiveUntil('');
  };

  const handleYearChange = (value) => {
    setSelectedYear(value);
    setSelectedSemester('');
    setSelectedFeature('');
    setActiveUntil('');
  };

  const handleSemesterChange = (value) => {
    setSelectedSemester(value);
    setSelectedFeature('');
    setActiveUntil('');
  };

  const handleSaveSchedule = () => {
    if (!contextKey) return;

    if (!selectedFeature) {
      showToast('Please select a feature', 'error');
      return;
    }

    if (!activeUntil) {
      showToast('Please set an active until date/time', 'error');
      return;
    }

    const activeUntilIso = new Date(activeUntil).toISOString();
    if (Number.isNaN(new Date(activeUntilIso).getTime())) {
      showToast('Invalid date/time selected', 'error');
      return;
    }

    const existingIndex = (schedules || []).findIndex(
      (s) =>
        s.schoolId === contextKey.schoolId &&
        s.programId === contextKey.programId &&
        s.yearId === contextKey.yearId &&
        s.semesterId === contextKey.semesterId &&
        s.featureId === selectedFeature
    );

    const next = [...(schedules || [])];
    if (existingIndex >= 0) {
      next[existingIndex] = {
        ...next[existingIndex],
        activeUntil: activeUntilIso
      };
    } else {
      next.push({
        ...contextKey,
        featureId: selectedFeature,
        activeUntil: activeUntilIso
      });
    }

    setSchedules(next);
    showToast('Schedule saved successfully', 'success');
  };

  const handleRemoveSchedule = (featureId) => {
    if (!contextKey) return;
    const next = (schedules || []).filter(
      (s) =>
        !(
          s.schoolId === contextKey.schoolId &&
          s.programId === contextKey.programId &&
          s.yearId === contextKey.yearId &&
          s.semesterId === contextKey.semesterId &&
          s.featureId === featureId
        )
    );
    setSchedules(next);
    showToast('Schedule removed', 'success');

    if (selectedFeature === featureId) {
      setSelectedFeature('');
      setActiveUntil('');
    }
  };

  const handleSelectExisting = (featureId) => {
    if (!contextKey) return;
    const existing = contextSchedules.find((s) => s.featureId === featureId);
    setSelectedFeature(featureId);
    setActiveUntil(existing?.activeUntil ? toDatetimeLocalValue(existing.activeUntil) : '');
  };

  const appliesToText = useMemo(() => {
    if (!contextKey) return '';
    if (assignedCoordinators.length === 0) return 'No project coordinators assigned for this context.';
    if (assignedCoordinators.length === 1) return `Applies to 1 project coordinator: ${assignedCoordinators[0].name} (${assignedCoordinators[0].id}).`;
    return `Applies to ${assignedCoordinators.length} project coordinators in this context.`;
  }, [contextKey, assignedCoordinators]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Scheduler</h2>
        <p className="text-sm text-gray-600">Set feature availability deadlines for Project Coordinators</p>
      </div>

      {/* Academic Context Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Academic Context</h3>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Selection Progress: {filtersComplete.completed}/4
            </span>
            {filtersComplete.completed === 4 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                <CheckCircleIcon className="h-4 w-4" />
                Complete
              </span>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${filtersComplete.percentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSchool}
              onChange={(e) => handleSchoolChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">Select School</option>
              {(schools || []).map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Programme <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedProgramme}
              onChange={(e) => handleProgrammeChange(e.target.value)}
              disabled={!selectedSchool}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Programme</option>
              {availableProgrammes.map((programme) => (
                <option key={programme.id} value={programme.id}>
                  {programme.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Year <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              disabled={!selectedProgramme}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Year</option>
              {(years || []).map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semester <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => handleSemesterChange(e.target.value)}
              disabled={!selectedYear}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Semester</option>
              {(semesters || []).map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {filtersComplete.completed === 4 && (
        <>
          {/* Applies To */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Applies To</h3>
            {assignedCoordinators.length === 0 ? (
              <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">No Project Coordinators Found</p>
                  <p className="mt-1">
                    Schedules only apply to faculties who have the Project Coordinator role.
                    Assign coordinators in the Roles / AD tab for this academic context.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-700">
                <p className="font-medium">{appliesToText}</p>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {assignedCoordinators.map((c) => (
                    <div key={c.id} className="p-3 border border-gray-200 rounded-lg bg-white">
                      <div className="font-semibold text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-600">{c.id} • {c.email}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Scheduler Form */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Set Schedule</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feature <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedFeature}
                  onChange={(e) => {
                    setSelectedFeature(e.target.value);
                    const existing = contextSchedules.find((s) => s.featureId === e.target.value);
                    setActiveUntil(existing?.activeUntil ? toDatetimeLocalValue(existing.activeUntil) : '');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">Select Feature</option>
                  {FEATURES.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Active Until <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={activeUntil}
                  onChange={(e) => setActiveUntil(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div className="flex items-end">
                <Button
                  variant="primary"
                  onClick={handleSaveSchedule}
                  disabled={!selectedFeature || !activeUntil}
                  className="w-full"
                >
                  Save Schedule
                </Button>
              </div>
            </div>

            {contextSchedules.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Current Schedules</h4>
                <div className="space-y-2">
                  {contextSchedules
                    .slice()
                    .sort((a, b) => a.featureId.localeCompare(b.featureId))
                    .map((s) => {
                      const feature = FEATURES.find((f) => f.id === s.featureId);
                      const expiresAt = new Date(s.activeUntil);
                      const isExpired = Number.isNaN(expiresAt.getTime()) ? false : expiresAt.getTime() < Date.now();

                      return (
                        <div
                          key={s.featureId}
                          className={`p-4 border rounded-lg flex items-center justify-between ${
                            isExpired ? 'border-gray-200 bg-gray-50' : 'border-amber-200 bg-amber-50'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-gray-900">{feature?.label || s.featureId}</div>
                            <div className="text-sm text-gray-600">
                              Active until: {Number.isNaN(expiresAt.getTime()) ? s.activeUntil : expiresAt.toLocaleString()}
                              {isExpired ? ' (Expired)' : ''}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSelectExisting(s.featureId)}
                              className="px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 rounded-lg"
                              title="Edit schedule"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleRemoveSchedule(s.featureId)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Remove schedule"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default SchedulerManagement;
