// src/features/admin/components/request-management/requests/RequestFilters.jsx
import React, { useMemo, useState, useEffect } from "react";
import Card from "../../../../../shared/components/Card";
import Select from "../../../../../shared/components/Select";
import {
  REQUEST_CATEGORIES,
  REQUEST_STATUSES,
} from "../../../../../shared/constants/config";
import { fetchMasterData } from "../../../../../services/adminApi";
import { useToast } from "../../../../../shared/hooks/useToast";

const RequestFilters = ({ filters, onFilterChange, onReset }) => {
  const { showToast } = useToast();
  const [schools, setSchools] = useState([]);
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const response = await fetchMasterData();
        if (response.success && response.data) {
          setSchools(response.data.schools || []);
          setPrograms(response.data.programs || []);
        }
      } catch (error) {
        console.error("Error loading master data:", error);
        showToast("Failed to load filter options", "error");
      }
    };

    loadMasterData();
  }, [showToast]);

  const schoolOptions = useMemo(
    () => [
      { value: "", label: "All Schools" },
      ...schools.map((school) => ({ value: school.code, label: school.name })),
    ],
    [schools]
  );

  const programOptions = useMemo(() => {
    // Filter programs based on selected school if any
    let availablePrograms = programs;
    if (filters.school) {
      availablePrograms = programs.filter((p) => p.school === filters.school);
    }

    return [
      { value: "", label: "All Programs" },
      ...availablePrograms.map((program) => ({
        value: program.code,
        label: program.name,
      })),
    ];
  }, [programs, filters.school]);

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "All Categories" },
      ...REQUEST_CATEGORIES.map((cat) => ({
        value: cat.id,
        label: `${cat.name} Requests`,
      })),
    ],
    []
  );

  const statusOptions = useMemo(
    () => [
      { value: "", label: "All Status" },
      ...REQUEST_STATUSES.map((status) => ({
        value: status.id,
        label: status.name,
      })),
    ],
    []
  );

  return (
    <Card className="mb-6">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <button
            onClick={onReset}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            Reset All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School
            </label>
            <Select
              value={filters.school}
              onChange={(value) => onFilterChange("school", value)}
              options={schoolOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Program
            </label>
            <Select
              value={filters.program}
              onChange={(value) => onFilterChange("program", value)}
              options={programOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <Select
              value={filters.category}
              onChange={(value) => onFilterChange("category", value)}
              options={categoryOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <Select
              value={filters.status}
              onChange={(value) => onFilterChange("status", value)}
              options={statusOptions}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RequestFilters;
