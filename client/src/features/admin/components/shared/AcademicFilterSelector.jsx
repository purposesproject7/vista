// src/features/admin/components/student-management/AcademicFilterSelector.jsx
import React, { useState, useEffect } from "react";
import Select from "../../../../shared/components/Select";
import Card from "../../../../shared/components/Card";
import { AcademicCapIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { fetchMasterData } from "../../services/adminApi";
import { useToast } from "../../../../shared/hooks/useToast";
import { useAdminContext } from "../../context/AdminContext";

const AcademicFilterSelector = ({ onFilterComplete, className = "" }) => {
  const [loading, setLoading] = useState(false);
  const [masterData, setMasterData] = useState(null);
  const { showToast } = useToast();
  const { academicContext, updateAcademicContext } = useAdminContext();

  const [options, setOptions] = useState({
    schools: [],
    programs: [],
    years: [],
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

        // Set schools options
        const schoolOptions =
          data.schools
            ?.filter((s) => s.isActive !== false)
            ?.map((s) => ({
              value: s.code,
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

  // Update programs when school changes (either from context or user selection)
  useEffect(() => {
    if (academicContext.school && masterData) {
      const programsList = masterData.programs || masterData.departments;
      // robustness: check both code and name
      const schoolObj = masterData.schools?.find(s => s.code === academicContext.school);
      const schoolName = schoolObj?.name;
      const schoolCode = schoolObj?.code;

      const programs =
        programsList
          ?.filter((d) => {
            return (
              d.isActive !== false &&
              (d.school === schoolCode || d.school === schoolName)
            );
          })
          ?.map((d) => ({
            value: d.name,
            label: d.name,
            code: d.code,
          })) || [];

      setOptions((prev) => ({
        ...prev,
        programs,
      }));

      // If program in context is not valid for this school, clear it
      if (
        academicContext.program &&
        !programs.some((p) => p.value === academicContext.program)
      ) {
        updateAcademicContext({ program: "" });
      }
    } else if (!academicContext.school) {
      setOptions((prev) => ({
        ...prev,
        programs: [],
      }));
    }
  }, [academicContext.school, masterData]);

  // Notify parent when all filters are selected
  useEffect(() => {
    if (
      academicContext.school &&
      academicContext.program &&
      academicContext.year &&
      masterData
    ) {
      const selectedSchool = masterData?.schools?.find(
        (s) => s.code === academicContext.school
      );

      onFilterComplete({
        school: selectedSchool?.name || academicContext.school,
        schoolCode: academicContext.school,
        program: academicContext.program,
        programCode: (masterData.programs || masterData.departments)?.find(
          (p) =>
            p.name === academicContext.program &&
            p.school === academicContext.school
        )?.code,
        department: academicContext.program,
        academicYear: academicContext.year,
        programme: academicContext.program,
      });
    }
  }, [academicContext, onFilterComplete, masterData]);

  const handleChange = (key, value) => {
    // Reset dependent filters if school changes
    if (key === "school") {
      updateAcademicContext({ [key]: value, program: "" });
      setOptions((prev) => ({ ...prev, programs: [] }));
    } else {
      updateAcademicContext({ [key]: value });
    }
  };

  const steps = [
    { key: "school", label: "School", options: options.schools, enabled: true },
    {
      key: "program",
      label: "Program",
      options: options.programs,
      enabled: !!academicContext.school,
    },
    {
      key: "year",
      label: "Academic Year",
      options: options.years,
      enabled: !!academicContext.school,
    },
  ];

  const allSelected = steps.every((step) => academicContext[step.key]);
  const completedSteps = steps.filter((step) => academicContext[step.key]).length;

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
                style={{ width: `${(completedSteps / 3) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-semibold text-gray-600">
            {completedSteps}/3
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {steps.map((step) => (
          <Select
            key={step.key}
            label={step.label}
            value={academicContext[step.key]}
            onChange={(value) => handleChange(step.key, value)}
            options={step.options}
            placeholder={
              step.enabled ? `Select ${step.label}` : "Select previous first"
            }
            className={!step.enabled ? "opacity-50 pointer-events-none" : ""}
          />
        ))}
      </div>

      {academicContext.school && options.programs.length === 0 && (
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
