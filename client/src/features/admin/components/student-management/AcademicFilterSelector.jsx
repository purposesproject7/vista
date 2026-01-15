// src/features/admin/components/student-management/AcademicFilterSelector.jsx
import React, { useState, useEffect } from "react";
import Select from "../../../../shared/components/Select";
import Card from "../../../../shared/components/Card";
import { AcademicCapIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { fetchMasterData } from "../../services/adminApi";
import { useToast } from "../../../../shared/hooks/useToast";

const AcademicFilterSelector = ({
  onFilterComplete,
  className = "",
  showYear = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [masterData, setMasterData] = useState(null);
  const { showToast } = useToast();

  const [options, setOptions] = useState({
    schools: [],
    programs: [],
    years: [],
  });

  const [filters, setFilters] = useState({
    school: "",
    program: "",
    year: "",
  });

  // Fetch master data on mount
  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    try {
      setLoading(true);
      const response = await fetchMasterData();

      if (response.success) {
        const data = response.data;
        setMasterData(data);

        // Set schools options - store both name and code for matching
        const schoolOptions =
          data.schools
            ?.filter((s) => s.isActive !== false)
            ?.map((s) => ({
              value: s.code, // Use code as value for department matching
              label: s.name,
              name: s.name,
              code: s.code,
            })) || [];

        // Set years options
        const yearOptions =
          data.academicYears
            ?.filter((y) => y.isActive !== false)
            ?.map((y) => ({
              value: y.year,
              label: y.year,
            })) || [];

        setOptions((prev) => ({
          ...prev,
          schools: schoolOptions,
          years: yearOptions,
        }));
      }
    } catch (error) {
      console.error("Error loading master data:", error);
      showToast("Failed to load master data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Update programs when school changes
  useEffect(() => {
    if (filters.school && masterData) {
      // Filter programs from both 'departments' and 'programs' arrays to handle data inconsistencies
      // Backend mapping says 'department' stores program data, but some data exists in 'programs'
      const deptPrograms =
        masterData.departments
          ?.filter((d) => d.isActive !== false && d.school === filters.school)
          ?.map((d) => ({
            value: d.code || d.name, // Use code if available
            label: d.name,
            name: d.name,
            code: d.code,
          })) || [];

      const progPrograms =
        masterData.programs
          ?.filter((p) => p.isActive !== false && p.school === filters.school)
          ?.map((p) => ({
            value: p.code || p.name, // Use code if available
            label: p.name,
            name: p.name,
            code: p.code,
          })) || [];

      // Merge and deduplicate by value (code)
      const allPrograms = [...deptPrograms, ...progPrograms];
      const uniquePrograms = Array.from(
        new Map(allPrograms.map((item) => [item.value, item])).values()
      );

      setOptions((prev) => ({
        ...prev,
        programs: uniquePrograms,
      }));

      // Reset dependent filter
      setFilters((prev) => ({
        ...prev,
        program: "",
      }));
    } else if (!filters.school) {
      // Clear programs when no school selected
      setOptions((prev) => ({
        ...prev,
        programs: [],
      }));
    }
  }, [filters.school, masterData]);

  // Notify parent when all filters are selected
  useEffect(() => {
    const isComplete =
      filters.school && filters.program && (!showYear || filters.year);

    if (isComplete) {
      onFilterComplete({
        school: filters.school, // Pass school code (value of the select)
        program: filters.program, // Backend uses 'program' field
        department: filters.program, // Keep for backward compatibility
        academicYear: showYear ? filters.year : null,
        programme: filters.program, // Also include as programme for clarity
      });
    }
  }, [filters, onFilterComplete, showYear]);

  const handleChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };

    // Reset dependent filters
    if (key === "school") {
      newFilters.program = "";
      setOptions((prev) => ({ ...prev, programs: [] }));
    }

    setFilters(newFilters);
  };

  const steps = [
    { key: "school", label: "School", options: options.schools, enabled: true },
    {
      key: "program",
      label: "Program",
      options: options.programs,
      enabled: !!filters.school,
    },
  ];

  if (showYear) {
    steps.push({
      key: "year",
      label: "Academic Year",
      options: options.years,
      enabled: !!filters.school,
    });
  }

  const allSelected = steps.every((step) => filters[step.key]);
  const totalSteps = steps.length;
  const completedSteps = steps.filter((step) => filters[step.key]).length;

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
                style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-semibold text-gray-600">
            {completedSteps}/{totalSteps}
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

      <div
        className={`grid grid-cols-1 md:grid-cols-${showYear ? "3" : "2"
          } gap-3`}
      >
        {steps.map((step) => (
          <Select
            key={step.key}
            label={step.label}
            value={filters[step.key]}
            onChange={(value) => handleChange(step.key, value)}
            options={step.options}
            placeholder={
              step.enabled ? `Select ${step.label}` : "Select previous first"
            }
            className={!step.enabled ? "opacity-50 pointer-events-none" : ""}
          />
        ))}
      </div>

      {filters.school && options.programs.length === 0 && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ No programs found for the selected school. Please select a
            different school or add programs in the database.
          </p>
        </div>
      )}

      {loading && (
        <div className="mt-3 text-center">
          <span className="text-xs text-gray-500">Loading options...</span>
        </div>
      )}
    </Card>
  );
};

export default AcademicFilterSelector;
