// src/features/project-coordinator/pages/RubricsManagement.jsx
import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../../../shared/components/Navbar";
import CoordinatorTabs from "../components/shared/CoordinatorTabs";
import AcademicFilterSelector from "../components/shared/AcademicFilterSelector";
import PCRubricSettings from "../components/rubrics/PCRubricSettings";
import { fetchProfile } from "../services/coordinatorApi";

const RubricsManagement = () => {
  const [filters, setFilters] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch coordinator profile to check if primary
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await fetchProfile();
        if (profile.success && profile.data) {
          // Set initial filters from profile
          if (profile.data.school && profile.data.program) {
            setFilters({
              school: profile.data.school,
              program: profile.data.program,
              year: profile.data.academicYear || "2024-25",
            });
          }
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <CoordinatorTabs />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Academic Context Filter */}
        <div className="mb-6">
          <AcademicFilterSelector
            onFilterComplete={handleFilterChange}
            initialFilters={filters}
          />
        </div>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Rubrics Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage review schedules and select assessment components for
            evaluations.
          </p>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <PCRubricSettings filters={filters} />
        )}
      </div>
    </div>
  );
};

export default RubricsManagement;
