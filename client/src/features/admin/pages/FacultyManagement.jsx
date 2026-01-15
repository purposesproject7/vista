// src/features/admin/pages/FacultyManagement.jsx
import React, { useState, useEffect } from "react";
import { EyeIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import Navbar from "../../../shared/components/Navbar";
import AdminTabs from "../components/shared/AdminTabs";
import FacultyViewTab from "../components/faculty-management/FacultyViewTab";
import FacultyUploadTab from "../components/faculty-management/FacultyUploadTab";
import { fetchFaculty } from "../services/adminApi";

const FacultyManagement = () => {
  const [activeTab, setActiveTab] = useState("view");
  const [stats, setStats] = useState({
    total: 0,
    members: 0,
    admins: 0,
    filtered: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetchFaculty({});
        if (response.success) {
          const allFaculty = response.faculty || [];
          setStats({
            total: response.count || 0,
            members: allFaculty.filter((f) => f.role === "faculty").length,
            admins: allFaculty.filter((f) => f.role === "admin").length,
            filtered: response.count || 0, // Initially filtered is same as total
          });
        }
      } catch (error) {
        console.error("Failed to load stats", error);
      }
    };
    loadStats();
  }, []);

  const facultyTabs = [
    {
      id: "view",
      label: "Faculty View",
      icon: EyeIcon,
      description: "View and manage existing faculty",
    },
    {
      id: "upload",
      label: "Faculty Upload",
      icon: ArrowUpTrayIcon,
      description: "Add faculty via Excel or single entry",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <AdminTabs />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Faculty Management
          </h1>
        </div>

        {/* Faculty Tabs */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-2">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-2 w-full sm:w-auto">
              {facultyTabs.map((tab) => {
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
              <div className="items-center gap-2 hidden md:flex">
                <span className="font-medium">Faculty:</span>
                <span className="bg-green-100 text-green-800 py-0.5 px-2 rounded-full font-bold">
                  {stats.members}
                </span>
              </div>
              <div className="items-center gap-2 hidden md:flex">
                <span className="font-medium">Admins:</span>
                <span className="bg-purple-100 text-purple-800 py-0.5 px-2 rounded-full font-bold">
                  {stats.admins}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "view" && <FacultyViewTab />}
          {activeTab === "upload" && <FacultyUploadTab />}
        </div>
      </div>
    </div>
  );
};

export default FacultyManagement;
