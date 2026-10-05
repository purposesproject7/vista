// src/features/project-coordinator/components/shared/AcademicFilterSelector.jsx
import React, { useState, useEffect } from "react";
import Select from "../../../../shared/components/Select";
import Card from "../../../../shared/components/Card";
import { AcademicCapIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { fetchFacultyMasterData, fetchProfile } from "../../services/coordinatorApi";
import { useCoordinatorContext } from "../../context/CoordinatorContext";

const AcademicFilterSelector = ({ onFilterComplete, className = "" }) => {
  const [loading, setLoading] = useState(false);
  // Programs come from the coordinator's own assignments, as stored: the
  // server matches the requested program against exactly these values.
  const [assignments, setAssignments] = useState([]);
  const [academicYearOptions, setAcademicYearOptions] = useState([]);
  const [programOptions, setProgramOptions] = useState([]);
  const [localFilters, setLocalFilters] = useState({
    program: "",
    academicYear: ""
  });

  const { academicContext, updateAcademicContext } = useCoordinatorContext();

  // Load Master Data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [response, profile] = await Promise.all([
          fetchFacultyMasterData(),
          fetchProfile(),
        ]);
        const myAssignments = profile?.data?.assignments || [];
        setAssignments(myAssignments);

        if (response.success && response.data) {
          const { academicYears = [] } = response.data;

          // Format Academic Year Options
          const yearOptions = academicYears
            .filter(y => y.isActive)
            .map(y => ({
              value: y.year,
              label: y.year
            }))
            .sort((a, b) => b.value.localeCompare(a.value)); // Newest first

          setAcademicYearOptions(yearOptions);

          // One option per assigned program (primary first).
          const seen = new Set();
          const progOptions = [...myAssignments]
            .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
            .filter(a => !seen.has(a.program) && seen.add(a.program))
            .map(a => ({ value: a.program, label: a.program }));

          setProgramOptions(progOptions);

          // Restore the last selection if it is still one of the coordinator's programs.
          // A coordinator with a single program gets it pre-selected.
          if (progOptions.some(o => o.value === academicContext.program)) {
            setLocalFilters(prev => ({ ...prev, program: academicContext.program }));
          } else if (progOptions.length === 1) {
            setLocalFilters(prev => ({ ...prev, program: progOptions[0].value }));
          }

          // Auto-select defaults derived from context or first available
          if (academicContext.academicYearSemester) {
            setLocalFilters(prev => ({ ...prev, academicYear: academicContext.academicYearSemester }));
          } else if (yearOptions.length > 0) {
            // Optional: Auto-select latest year
            // setLocalFilters(prev => ({ ...prev, academicYear: yearOptions[0].value }));
          }
        }
      } catch (error) {
        console.error("Failed to load master data", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // Load once on mount; later context changes are synced by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle local filter changes
  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      return newFilters;
    });

    // Update global context immediately for year (legacy support) or when both are ready?
    // Maintaining consistency with previous behavior:
    if (key === 'academicYear') {
      updateAcademicContext({ academicYearSemester: value });
    }
  };

  // Notify parent when both Program and Year are selected
  useEffect(() => {
    const { program, academicYear } = localFilters;

    if (program && academicYear) {
      const assignment = assignments.find(a => a.program === program && a.academicYear === academicYear);

      if (assignment) {
        // Shared with every coordinator screen (useCoordinatorScope).
        updateAcademicContext({ school: assignment.school, program: assignment.program });
        onFilterComplete({
          school: assignment.school,
          program: assignment.program,
          year: academicYear,
          academicYearSemester: academicYear // Legacy field alias
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localFilters, assignments, onFilterComplete]);

  // Sync with context updates if they happen externally
  useEffect(() => {
    if (academicContext.academicYearSemester && academicContext.academicYearSemester !== localFilters.academicYear) {
      setLocalFilters(prev => ({ ...prev, academicYear: academicContext.academicYearSemester }));
    }
  }, [academicContext.academicYearSemester]);

  const allSelected = !!(localFilters.program && localFilters.academicYear);

  return (
    <Card className={`sticky top-4 z-30 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1">
          <AcademicCapIcon className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-gray-900">
            Select Academic Context
          </h2>
          <div className="flex-1 mx-3">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${allSelected ? 100 : 0}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-semibold text-gray-600">
            {allSelected ? "2" : (localFilters.program || localFilters.academicYear ? "1" : "0")}/2
          </span>
        </div>

        {allSelected && (
          <div className="flex items-center gap-1.5 bg-green-100 px-3 py-1.5 rounded-lg border border-green-300">
            <CheckCircleIcon className="w-4 h-4 text-green-700" />
            <span className="text-xs font-semibold text-green-700">
              Complete
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        {/* Program Selection */}
        <Select
          label="Program"
          value={localFilters.program}
          onChange={(val) => handleFilterChange('program', val)}
          options={programOptions}
          placeholder="Select Program"
          disabled={loading}
        />

        {/* Academic Year Selection */}
        <Select
          label="Academic Year"
          value={localFilters.academicYear}
          onChange={(val) => handleFilterChange('academicYear', val)}
          options={academicYearOptions.filter(option => assignments.some(a => a.academicYear === option.value && (!localFilters.program || a.program === localFilters.program)))}
          placeholder="Select Academic Year"
          disabled={loading}
        />
      </div>
    </Card>
  );
};

export default AcademicFilterSelector;
