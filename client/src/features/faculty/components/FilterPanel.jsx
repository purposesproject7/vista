// src/features/faculty/components/FilterPanel.jsx - VIT Theme
import React from "react";
import Select from "../../../shared/components/Select";
import { FunnelIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

const FilterPanel = ({ filters, onFilterChange }) => {
  const yearOptions = [
    { value: "2025", label: "2025-26" },
    { value: "2024", label: "2024-25" },
  ];

  const schoolOptions = [
    { value: "SCOPE", label: "SCOPE" },
    { value: "SENSE", label: "SENSE" },
    { value: "SELECT", label: "SELECT" },
  ];

  const programmeOptions = [
    { value: "BTECH", label: "B.Tech" },
    { value: "MTECH", label: "M.Tech" },
  ];

  const typeOptions = [
    { value: "guide", label: "👨‍🏫 Guide" },
    { value: "panel", label: "👥 Panel" },
  ];

  const steps = [
    { key: "year", label: "Year", options: yearOptions, enabled: true },
    {
      key: "school",
      label: "School",
      options: schoolOptions,
      enabled: !!filters.year,
    },
    {
      key: "programme",
      label: "Programme",
      options: programmeOptions,
      enabled: !!filters.school,
    },
    {
      key: "type",
      label: "Role",
      options: typeOptions,
      enabled: !!filters.programme,
    },
  ];

  const handleChange = (key, value) => {
    const stepIndex = steps.findIndex((s) => s.key === key);
    const newFilters = { ...filters, [key]: value };

    steps.slice(stepIndex + 1).forEach((step) => {
      newFilters[step.key] = "";
    });

    Object.keys(newFilters).forEach((k) => {
      onFilterChange(k, newFilters[k]);
    });
  };

  const allSelected = steps.every((step) => filters[step.key]);
  const completedSteps = steps.filter((step) => filters[step.key]).length;

  return (
    <div
      className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 shadow-lg border-2 border-blue-500 mb-4 sticky top-0 z-40"
      data-tutorial="filter-panel"
    >
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-2 flex-1">
          <FunnelIcon className="w-5 h-5 text-blue-100" />
          <h2 className="text-base font-bold text-white">Filters</h2>
          <div className="flex-1 mx-3">
            <div className="h-2 bg-blue-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-400 transition-all duration-500"
                style={{ width: `${(completedSteps / 4) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-semibold text-blue-100">
            {completedSteps}/4
          </span>
        </div>

        {allSelected && (
          <div className="flex items-center gap-1.5 bg-green-500 px-3 py-1 rounded-full border-2 border-green-400">
            <CheckCircleIcon className="w-4 h-4 text-white" />
            <span className="text-xs font-semibold text-white">Ready</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {steps.map((step) => {
          const isLocked = !step.enabled;

          return (
            <div
              key={step.key}
              className={isLocked ? "opacity-50" : ""}
              data-tutorial={`${step.key}-filter`}
            >
              <Select
                label={step.label}
                value={filters[step.key]}
                onChange={(value) => handleChange(step.key, value)}
                options={step.options}
                placeholder={isLocked ? "🔒" : "Select"}
                className={isLocked ? "pointer-events-none" : ""}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FilterPanel;
