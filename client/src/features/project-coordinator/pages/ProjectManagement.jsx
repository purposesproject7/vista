// src/features/project-coordinator/pages/ProjectManagement.jsx
import React, { useState, useEffect, useCallback } from "react";
import { PlusCircleIcon, EyeIcon } from "@heroicons/react/24/outline";
import Navbar from "../../../shared/components/Navbar";
import CoordinatorTabs from "../components/shared/CoordinatorTabs";
import AcademicFilterSelector from "../components/shared/AcademicFilterSelector";
import ProjectViewTab from "../components/project-management/ProjectViewTab";
import ProjectUploadTab from "../components/project-management/ProjectUploadTab";
import Card from "../../../shared/components/Card";
import { useToast } from "../../../shared/hooks/useToast";
import { useAuth } from "../../../shared/hooks/useAuth";
import {
  fetchProjects as apiFetchProjects,
  fetchPermissions as apiFetchPermissions,
} from "../services/coordinatorApi";

const ProjectManagement = () => {
  const [activeTab, setActiveTab] = useState("view");
  const [isPrimary, setIsPrimary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(null);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    withGuides: 0,
    panelAssigned: 0,
    bestProjects: 0,
  });
  const { showToast } = useToast();
  const { user } = useAuth();

  // 1. Fetch coordinator permissions on mount
  useEffect(() => {
    const fetchCoordinatorPermissions = async () => {
      try {
        setLoading(true);
        // Mock API call delay
        const permResponse = await apiFetchPermissions();
        if (permResponse.success) {
          setIsPrimary(permResponse.data.isPrimary);
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
        showToast("Error loading permissions", "error");
      } finally {
        setLoading(false); // CRITICAL: This allows the main UI to render
      }
    };

    fetchCoordinatorPermissions();
  }, [showToast]);

  // 2. Memoize handleFilterComplete to prevent infinite loops in AcademicFilterSelector
  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(selectedFilters)) return prev;
      return selectedFilters;
    });
  }, []);

  // 3. Memoize fetchProjects for use in the useEffect dependency array
  const fetchProjects = useCallback(async () => {
    if (!filters) return;
    try {
      setLoading(true);
      const response = await apiFetchProjects({
        school: user?.school,
        program: user?.program,
        academicYear: filters?.year, // Assuming filter.year maps to academicYear
      });

      if (response.success) {
        setProjects(response.projects || []);
        showToast(
          `Loaded ${response.projects?.length || 0} projects`,
          "success"
        );
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
  }, [filters, showToast]);

  // 4. Trigger data fetch when filters or tab changes
  useEffect(() => {
    if (filters && activeTab === "view") {
      fetchProjects();
    }
  }, [filters, activeTab, fetchProjects]);

  useEffect(() => {
    if (projects) {
      setStats({
        total: projects.length,
        withGuides: projects.filter((p) => p.guide).length,
        panelAssigned: projects.filter((p) => p.panel || p.panelId).length,
        bestProjects: projects.filter((p) => p.bestProject).length,
      });
    }
  }, [projects]);

  const projectTabs = [
    {
      id: "view",
      label: "Project View",
      icon: EyeIcon,
      description: "View existing projects",
      enabled: true,
    },
    {
      id: "create",
      label: "Project Create",
      icon: PlusCircleIcon,
      description: "Create new projects",
      enabled: isPrimary,
    },
  ];

  // Global Loading State (Permissions check)
  if (loading && !filters && projects.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <CoordinatorTabs />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Project Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {isPrimary
              ? "You have full access to project management"
              : "You have view-only access"}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-2">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-2 w-full sm:w-auto flex-wrap">
              {projectTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isDisabled = !tab.enabled;

                return (
                  <button
                    key={tab.id}
                    onClick={() => !isDisabled && setActiveTab(tab.id)}
                    disabled={isDisabled}
                    className={`
                    flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all
                    ${
                      isDisabled
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                        : isActive
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }
                  `}
                    title={
                      isDisabled
                        ? `Only primary coordinators can ${tab.label.toLowerCase()}`
                        : tab.description
                    }
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="px-4 flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="font-medium">Total:</span>
                <span className="bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full font-bold">
                  {stats.total}
                </span>
              </div>
              <div className="flex items-center gap-2 hidden md:flex">
                <span className="font-medium">With Guides:</span>
                <span className="bg-orange-100 text-orange-800 py-0.5 px-2 rounded-full font-bold">
                  {stats.withGuides}
                </span>
              </div>
              <div className="flex items-center gap-2 hidden md:flex">
                <span className="font-medium">Panel Assigned:</span>
                <span className="bg-purple-100 text-purple-800 py-0.5 px-2 rounded-full font-bold">
                  {stats.panelAssigned}
                </span>
              </div>
              <div className="flex items-center gap-2 hidden lg:flex">
                <span className="font-medium">Best:</span>
                <span className="bg-yellow-100 text-yellow-800 py-0.5 px-2 rounded-full font-bold">
                  {stats.bestProjects}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "view" && (
          <div className="space-y-6">
            <AcademicFilterSelector onFilterComplete={handleFilterComplete} />

            {filters && (
              <>
                {loading ? (
                  <Card>
                    <div className="py-12 flex justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  </Card>
                ) : (
                  <ProjectViewTab projects={projects} isPrimary={isPrimary} />
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "create" && isPrimary && <ProjectUploadTab />}
      </div>
    </div>
  );
};

export default ProjectManagement;
