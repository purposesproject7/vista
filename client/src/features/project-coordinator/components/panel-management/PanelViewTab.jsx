// src/features/project-coordinator/components/panel-management/PanelViewTab.jsx
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
import AcademicFilterSelector from "../shared/AcademicFilterSelector";
import Card from "../../../../shared/components/Card";
import Badge from "../../../../shared/components/Badge";
import EmptyState from "../../../../shared/components/EmptyState";
import LoadingSpinner from "../../../../shared/components/LoadingSpinner";
import { useToast } from "../../../../shared/hooks/useToast";
import { useAuth } from "../../../../shared/hooks/useAuth";
import { fetchPanels as apiFetchPanels, fetchProjects } from "../../services/coordinatorApi";
import {
  formatPanelName,
  getMarkingStatusColor,
  getMarkingStatusLabel,
} from "../../utils/panelUtils";

const PanelViewTab = ({ isPrimary = false }) => {
  const [filters, setFilters] = useState(null);
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [markingFilter, setMarkingFilter] = useState("all");
  const [panelProjects, setPanelProjects] = useState({});
  const [loadingProjects, setLoadingProjects] = useState({});
  const { showToast } = useToast();
  const { user } = useAuth();

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

      const response = await apiFetchPanels({
        school: user?.school,
        program: user?.program,
        academicYear: filters?.year,
      });

      if (response.success) {
        setPanels(response.panels || []);
        showToast(`Loaded ${response.panels?.length || 0} panels`, "success");
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
  }, [filters, user, showToast]);

  const fetchPanelProjects = useCallback(async (panelId) => {
    try {
      setLoadingProjects(prev => ({ ...prev, [panelId]: true }));

      // Find the panel object to get its name
      const currentPanel = panels.find(p => p.id === panelId);
      if (!currentPanel) return;

      const response = await fetchProjects({
        school: user?.school,
        program: user?.program,
        academicYear: filters?.year,
      });

      if (response.success) {
        const allProjects = response.projects || [];
        const panelName = formatPanelName(currentPanel);

        // Filter projects for this panel using panel name
        const mainPanelProjects = allProjects.filter(
          project => {
            const projectPanelName = project.panel ? formatPanelName(project.panel) : null;
            return projectPanelName === panelName;
          }
        );

        const reviewPanelProjects = allProjects.filter(
          project => project.reviewPanels?.some(
            rp => {
              const reviewPanelName = rp.panel ? formatPanelName(rp.panel) : null;
              return reviewPanelName === panelName;
            }
          )
        );

        setPanelProjects(prev => ({
          ...prev,
          [panelId]: {
            mainPanel: mainPanelProjects,
            reviewPanel: reviewPanelProjects
          }
        }));
      }
    } catch (error) {
      console.error("Error fetching panel projects:", error);
      showToast("Failed to load panel projects", "error");
    } finally {
      setLoadingProjects(prev => ({ ...prev, [panelId]: false }));
    }
  }, [filters, panels, user, showToast]);

  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters(selectedFilters);
    setSearchQuery("");
    setMarkingFilter("all");
    setExpandedPanel(null);
    setPanelProjects({});
  }, []);

  const togglePanelExpansion = useCallback((panelId) => {
    setExpandedPanel((prev) => {
      const newExpandedPanel = prev === panelId ? null : panelId;

      // Fetch projects when expanding a panel
      if (newExpandedPanel === panelId && !panelProjects[panelId]) {
        fetchPanelProjects(panelId);
      }

      return newExpandedPanel;
    });
  }, [panelProjects, fetchPanelProjects]);

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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none"
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none appearance-none"
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
              {filteredPanels.map((panel) => {
                const projects = panelProjects[panel.id];
                const isLoadingProjects = loadingProjects[panel.id];
                const mainPanelCount = projects?.mainPanel?.length || 0;
                const reviewPanelCount = projects?.reviewPanel?.length || 0;

                return (
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
                                  {member.faculty?.name || member.name}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {member.faculty?.employeeId || member.employeeId}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Projects Section */}
                        {isLoadingProjects ? (
                          <div className="flex justify-center py-8">
                            <LoadingSpinner />
                          </div>
                        ) : (
                          <>
                            {/* Main Panel Projects */}
                            {projects?.mainPanel && projects.mainPanel.length > 0 && (
                              <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                  <DocumentTextIcon className="w-4 h-4 mr-2" />
                                  Main Panel Projects ({projects.mainPanel.length})
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                  {projects.mainPanel.map((project) => (
                                    <div
                                      key={project._id}
                                      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
                                    >
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <p className="text-sm font-medium text-gray-900">
                                            {project.name}
                                          </p>
                                          <p className="text-xs text-gray-500 mt-1">
                                            {project.type}
                                          </p>
                                          {project.teamMembers?.length > 0 && (
                                            <div className="mt-2 text-xs text-gray-500">
                                              {project.teamMembers
                                                .map((s) => `${s.name} (${s.regNo})`)
                                                .join(", ")}
                                            </div>
                                          )}
                                        </div>
                                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded whitespace-nowrap ml-2">
                                          {project.teamSize || project.teamMembers?.length || "?"} Members
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Review Panel Projects */}
                            {projects?.reviewPanel && projects.reviewPanel.length > 0 && (
                              <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                  <DocumentTextIcon className="w-4 h-4 mr-2" />
                                  Review Panel Projects ({projects.reviewPanel.length})
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                  {projects.reviewPanel.map((project) => {
                                    const panelName = formatPanelName(panel);
                                    const reviewPanelInfo = project.reviewPanels?.find(
                                      rp => {
                                        const reviewPanelName = rp.panel ? formatPanelName(rp.panel) : null;
                                        return reviewPanelName === panelName;
                                      }
                                    );

                                    return (
                                      <div
                                        key={project._id}
                                        className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-sm"
                                      >
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <p className="text-sm font-medium text-gray-900">
                                                {project.name}
                                              </p>
                                              {reviewPanelInfo && (
                                                <Badge variant="secondary" className="text-xs">
                                                  {reviewPanelInfo.reviewType}
                                                </Badge>
                                              )}
                                            </div>
                                            <p className="text-xs text-gray-500">
                                              {project.type}
                                            </p>
                                            {project.teamMembers?.length > 0 && (
                                              <div className="mt-2 text-xs text-gray-500">
                                                {project.teamMembers
                                                  .map((s) => `${s.name} (${s.regNo})`)
                                                  .join(", ")}
                                              </div>
                                            )}
                                          </div>
                                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded whitespace-nowrap ml-2">
                                            {project.teamSize || project.teamMembers?.length || "?"} Members
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* No Projects */}
                            {(!projects?.mainPanel || projects.mainPanel.length === 0) &&
                              (!projects?.reviewPanel || projects.reviewPanel.length === 0) && (
                                <div className="mt-6">
                                  <p className="text-sm text-gray-500 italic">
                                    No projects assigned to this panel yet.
                                  </p>
                                </div>
                              )}
                          </>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PanelViewTab;
