// src/features/admin/pages/PanelManagementLanding.jsx
import React, { useState, useEffect } from "react";
import { PlusCircleIcon, EyeIcon, LinkIcon } from "@heroicons/react/24/outline";
import Navbar from "../../../shared/components/Navbar";
import AdminTabs from "../components/shared/AdminTabs";
import PanelCreationTab from "../components/panel-management/PanelCreationTab";
import PanelViewTab from "../components/panel-management/PanelViewTab";
import ProjectPanelAssignment from "../components/panel-management/ProjectPanelAssignment";
import { fetchPanels } from "../services/adminApi";

const PanelManagementLanding = () => {
  const [activeTab, setActiveTab] = useState("view");
  const [totalPanels, setTotalPanels] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetchPanels({});
        if (response.success) {
          setTotalPanels(response.panels?.length || 0);
        }
      } catch (error) {
        console.error("Failed to load stats", error);
      }
    };
    loadStats();
  }, []);

  const panelTabs = [
    {
      id: "view",
      label: "Panel View",
      icon: EyeIcon,
      description: "View existing panels",
    },
    {
      id: "create",
      label: "Panel Creation",
      icon: PlusCircleIcon,
      description: "Upload faculty data",
    },
    {
      id: "assign",
      label: "Project Assignment",
      icon: LinkIcon,
      description: "Assign projects to panels",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <AdminTabs />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Panel Management</h1>
        </div>

        {/* Panel Tabs */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-2">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-2 w-full sm:w-auto">
              {panelTabs.map((tab) => {
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

            <div className="px-4 flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Total Panels:</span>
              <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full font-bold text-xs">
                {totalPanels}
              </span>
            </div>
          </div>
        </div>

        {/* Panel Content */}
        <div>
          {activeTab === "create" && <PanelCreationTab />}
          {activeTab === "view" && <PanelViewTab />}
          {activeTab === "assign" && <ProjectPanelAssignment />}
        </div>
      </div>
    </div>
  );
};

export default PanelManagementLanding;
