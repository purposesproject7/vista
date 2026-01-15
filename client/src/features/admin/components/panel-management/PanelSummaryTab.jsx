// src/features/admin/components/panel-management/PanelSummaryTab.jsx
import React, { useState, useEffect, useCallback } from "react";
import { UsersIcon } from "@heroicons/react/24/outline";
import AcademicFilterSelector from "../student-management/AcademicFilterSelector";
import Card from "../../../../shared/components/Card";
import LoadingSpinner from "../../../../shared/components/LoadingSpinner";
import EmptyState from "../../../../shared/components/EmptyState";
import { useToast } from "../../../../shared/hooks/useToast";
import { fetchPanelSummary } from "../../../../services/adminApi";

const PanelSummaryTab = () => {
  const [filters, setFilters] = useState(null);
  const [stats, setStats] = useState({
    totalPanels: 0,
    totalFaculty: 0,
    totalProjects: 0,
    avgProjectsPerPanel: 0,
    avgFacultyPerPanel: 0,
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (filters) {
      loadSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchPanelSummary(filters);
      setStats(data);
    } catch (error) {
      console.error("Error fetching summary:", error);
      showToast("Failed to load statistics", "error");
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters(selectedFilters);
  }, []);

  return (
    <div className="space-y-6">
      {/* Academic Context Selector */}
      <AcademicFilterSelector onFilterComplete={handleFilterComplete} />

      {/* Statistics Section */}
      {filters && (
        <>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : stats.totalPanels === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title="No data available"
              description="No panels have been created for this academic context yet"
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Card className="bg-white">
                <div className="text-center py-2">
                  <p className="text-xs font-medium text-gray-600">
                    Total Panels
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.totalPanels}
                  </p>
                </div>
              </Card>
              <Card className="bg-white">
                <div className="text-center py-2">
                  <p className="text-xs font-medium text-gray-600">
                    Total Faculty
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.totalFaculty}
                  </p>
                </div>
              </Card>
              <Card className="bg-white">
                <div className="text-center py-2">
                  <p className="text-xs font-medium text-gray-600">
                    Total Projects
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.totalProjects}
                  </p>
                </div>
              </Card>
              <Card className="bg-white">
                <div className="text-center py-2">
                  <p className="text-xs font-medium text-gray-600">
                    Avg Projects/Panel
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.avgProjectsPerPanel}
                  </p>
                </div>
              </Card>
              <Card className="bg-white">
                <div className="text-center py-2">
                  <p className="text-xs font-medium text-gray-600">
                    Avg Faculty/Panel
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.avgFacultyPerPanel}
                  </p>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PanelSummaryTab;
