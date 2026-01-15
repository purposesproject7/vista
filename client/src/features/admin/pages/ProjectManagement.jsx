// src/features/admin/pages/ProjectManagement.jsx
import React, { useState, useEffect } from "react";
import { EyeIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import Navbar from "../../../shared/components/Navbar";
import AdminTabs from "../components/shared/AdminTabs";
import ProjectViewTab from "../components/project-management/ProjectViewTab";
import ProjectUploadTab from "../components/project-management/ProjectUploadTab";
import { fetchProjects } from "../services/adminApi";

const ProjectManagement = () => {
  const [activeTab, setActiveTab] = useState("view");
  const [stats, setStats] = useState({
    total: 0,
    withGuides: 0,
    panelAssigned: 0,
    bestProjects: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetchProjects({});
        if (response.success) {
          const projects = response.projects || [];
          setStats({
            total: projects.length,
            withGuides: projects.filter((p) => p.guide).length,
            panelAssigned: projects.filter((p) => p.panel || p.panelId).length,
            bestProjects: projects.filter((p) => p.bestProject).length,
          });
        }
      } catch (error) {
        console.error("Failed to load stats", error);
      }
    };
    loadStats();
  }, []);

  const projectTabs = [
    {
      id: "view",
      label: "Project View",
      icon: EyeIcon,
      description: "View and manage existing projects",
    },
    {
      id: "upload",
      label: "Project Upload",
      icon: ArrowUpTrayIcon,
      description: "Add projects via Excel or single entry",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <AdminTabs />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Project Management
          </h1>
        </div>

        {/* Project Tabs */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-2">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-2 w-full sm:w-auto flex-wrap">
              {projectTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                    flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all
                    ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }
                  `}
                    title={tab.description}
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
        <div>
          {activeTab === "view" && <ProjectViewTab />}
          {activeTab === "upload" && <ProjectUploadTab />}
        </div>
      </div>
    </div>
  );
};

export default ProjectManagement;
