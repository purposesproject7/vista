// src/features/admin/components/project-management/ProjectViewTab.jsx
import React, { useState, useEffect, useCallback } from "react";
import AcademicFilterSelector from "../student-management/AcademicFilterSelector";
import Card from "../../../../shared/components/Card";
import EmptyState from "../../../../shared/components/EmptyState";
import LoadingSpinner from "../../../../shared/components/LoadingSpinner";
import ProjectDetailsModal from "./ProjectDetailsModal";
import { UserGroupIcon, AcademicCapIcon, MagnifyingGlassIcon, Squares2X2Icon, ListBulletIcon } from "@heroicons/react/24/outline";
import { fetchProjects } from "../../services/adminApi";
import { useToast } from "../../../../shared/hooks/useToast";

const ProjectViewTab = () => {
  const [filters, setFilters] = useState(null);
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const { showToast } = useToast();

  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters(selectedFilters);
    setProjects([]);
  }, []);

  // Fetch projects when filters change
  useEffect(() => {
    const loadProjects = async () => {
      if (!filters) {
        setProjects([]);
        return;
      }

      try {
        setLoading(true);
        const response = await fetchProjects({
          school: filters.school,
          department: filters.department,
          academicYear: filters.academicYear,
        });

        if (response.success) {
          setProjects(response.projects || []);
          showToast("Projects loaded successfully", "success");
        } else {
          showToast(response.message || "Failed to load projects", "error");
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        showToast(
          error.response?.data?.message || "Failed to load projects",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [filters, showToast]);

  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

  const filteredProjects = projects.filter((project) => {
    const query = searchQuery.toLowerCase();
    const matchName = (project.name || "").toLowerCase().includes(query);
    const matchGuide = (project.guide?.name || "").toLowerCase().includes(query);
    // Admin project panel object might differ, but assuming name property exists if populated.
    // Based on previous code, panel mapping might be needed if not fully populated.
    // Checking previous file content, it seems panel might be missing or different.
    // The card doesn't show panel info in Admin view currently, but plan said "Panel Name".
    // I'll include it if it exists.
    const matchPanel = (project.panel?.panelName || project.panel?.name || "").toLowerCase().includes(query);
    const matchMembers = (project.teamMembers || []).some(m =>
      (m.name || "").toLowerCase().includes(query) ||
      (m.rollNumber || "").toLowerCase().includes(query)
    );

    return matchName || matchGuide || matchPanel || matchMembers;
  });

  return (
    <div className="space-y-6">
      {/* Academic Filter Selector */}
      <AcademicFilterSelector onFilterComplete={handleFilterComplete} />

      {/* Search Bar & View Toggle */}
      {filters && (
        <div className="flex gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by project name, student, guide..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-all ${viewMode === "grid"
                ? "bg-white shadow-sm text-blue-600"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                }`}
              title="Grid View"
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-all ${viewMode === "list"
                ? "bg-white shadow-sm text-blue-600"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                }`}
              title="List View"
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Project Content - only show when filters are complete */}
      {filters && (
        <>
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No projects match your search</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => {
                const teamSize = project.teamMembers?.length || 0;
                const guideName = project.guide?.name || "Not Assigned";

                return (
                  <Card
                    key={project._id}
                    className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-blue-500"
                    onClick={() => setSelectedProject(project)}
                  >
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                          {project.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {project.type || "Capstone Project"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <UserGroupIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {teamSize} {teamSize === 1 ? "member" : "members"}
                        </span>
                      </div>

                      {guideName !== "Not Assigned" && (
                        <div className="flex items-center gap-2 text-sm">
                          <AcademicCapIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 truncate">
                            {guideName}
                          </span>
                        </div>
                      )}

                      {project.specialization && (
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {project.specialization}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Guide
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProjects.map((project) => {
                    const teamSize = project.teamMembers?.length || 0;
                    const guideName = project.guide?.name || "Not Assigned";

                    return (
                      <tr
                        key={project._id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedProject(project)}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 line-clamp-2">
                            {project.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {project.type || "Capstone Project"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {teamSize} {teamSize === 1 ? "member" : "members"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {guideName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-900 font-medium">
                          View
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {selectedProject && (
            <ProjectDetailsModal
              isOpen={!!selectedProject}
              onClose={() => setSelectedProject(null)}
              project={selectedProject}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ProjectViewTab;
