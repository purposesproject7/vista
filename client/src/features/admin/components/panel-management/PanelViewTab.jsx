// src/features/admin/components/panel-management/PanelViewTab.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import AcademicFilterSelector from "../student-management/AcademicFilterSelector";
import Card from "../../../../shared/components/Card";
import Badge from "../../../../shared/components/Badge";
import EmptyState from "../../../../shared/components/EmptyState";
import LoadingSpinner from "../../../../shared/components/LoadingSpinner";
import { useToast } from "../../../../shared/hooks/useToast";
import { fetchPanels } from "../../../../services/adminApi";
import {
  formatPanelName,
  getMarkingStatusColor,
  getMarkingStatusLabel,
} from "../../utils/panelUtils";

const PanelViewTab = () => {
  const [filters, setFilters] = useState(null);
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [markingFilter, setMarkingFilter] = useState("all");
  const { showToast } = useToast();

  // Fetch panels when filters change
  useEffect(() => {
    if (filters) {
      fetchPanelsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchPanelsData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetchPanels({
        school: filters.school,
        department: filters.department,
        academicYear: filters.academicYear,
      });

      if (response.success) {
        setPanels(response.panels || []);
        showToast("Panels loaded successfully", "success");
      } else {
        showToast(response.message || "Failed to load panels", "error");
      }
    } catch (error) {
      console.error("Error fetching panels:", error);
      showToast(
        error.response?.data?.message || "Failed to load panels",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters(selectedFilters);
    setSearchQuery("");
    setMarkingFilter("all");
    setExpandedPanel(null);
  }, []);

  const togglePanelExpansion = useCallback((panelId) => {
    setExpandedPanel((prev) => (prev === panelId ? null : panelId));
  }, []);

  // Filter panels
  const filteredPanels = panels.filter((panel) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      formatPanelName(panel).toLowerCase().includes(searchLower) ||
      panel.members?.some(
        (m) =>
          m.name?.toLowerCase().includes(searchLower) ||
          m.employeeId?.toLowerCase().includes(searchLower)
      );

    const matchesMarking =
      markingFilter === "all" || panel.markingStatus === markingFilter;

    return matchesSearch && matchesMarking;
  });

  return (
    <div className="space-y-6">
      {/* Academic Context Selector */}
      <AcademicFilterSelector onFilterComplete={handleFilterComplete} />

      {/* Panel Management Section */}
      {filters && (
        <>
          {/* Search and Filter Controls */}
          <Card>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search panels, faculty, or projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Marking Status Filter */}
              <div className="sm:w-64">
                <div className="relative">
                  <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={markingFilter}
                    onChange={(e) => setMarkingFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    <option value="all">All Panels</option>
                    <option value="full">Fully Marked</option>
                    <option value="partial">Partially Marked</option>
                    <option value="none">Not Marked</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Panels List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : filteredPanels.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title="No panels found"
              description={
                searchQuery || markingFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "No panels have been created for this academic context yet"
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredPanels.map((panel) => (
                <Card key={panel.id} className="overflow-hidden">
                  {/* Panel Header */}
                  <div
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-4 -m-4"
                    onClick={() => togglePanelExpansion(panel.id)}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <UsersIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {formatPanelName(panel)}
                        </h3>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-600">
                            {panel.members?.length || 0} Faculty
                          </span>
                          <span className="text-sm text-gray-400">•</span>
                          <span className="text-sm text-gray-600">
                            {panel.assignedProjects || 0} Projects
                          </span>
                        </div>
                      </div>
                      <Badge
                        className={getMarkingStatusColor(panel.markingStatus)}
                      >
                        {getMarkingStatusLabel(panel.markingStatus)}
                      </Badge>
                      {expandedPanel === panel.id ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Panel Details (Expanded) */}
                  {expandedPanel === panel.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {/* Faculty List */}
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                          <UserIcon className="w-4 h-4 mr-2" />
                          Panel Members
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {panel.members?.map((member) => (
                            <div
                              key={member.employeeId}
                              className="bg-gray-50 rounded-lg p-3"
                            >
                              <p className="text-sm font-medium text-gray-900">
                                {member.name}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {member.employeeId}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Note about projects */}
                      {panel.assignedProjects > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm text-blue-800">
                            This panel has {panel.assignedProjects} project(s)
                            assigned. View project details in the Project
                            Management section.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PanelViewTab;
