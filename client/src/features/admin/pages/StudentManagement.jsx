// src/features/admin/pages/StudentManagement.jsx
import React, { useState, useEffect } from "react";
import { EyeIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import Navbar from "../../../shared/components/Navbar";
import AdminTabs from "../components/shared/AdminTabs";
import StudentViewTab from "../components/student-management/StudentViewTab";
import StudentUploadTab from "../components/student-management/StudentUploadTab";
import { fetchStudents } from "../services/adminApi";

const StudentManagement = () => {
  const [activeTab, setActiveTab] = useState("view");
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetchStudents({});
        if (response.success) {
          setTotalStudents(response.count || 0);
        }
      } catch (error) {
        console.error("Failed to load stats", error);
      }
    };
    loadStats();
  }, []);

  const studentTabs = [
    {
      id: "view",
      label: "Student View",
      icon: EyeIcon,
      description: "View and manage existing students",
    },
    {
      id: "upload",
      label: "Student Upload",
      icon: ArrowUpTrayIcon,
      description: "Add students via Excel or single entry",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <AdminTabs />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Student Management
          </h1>
        </div>

        {/* Student Tabs */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-2">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-2 w-full sm:w-auto">
              {studentTabs.map((tab) => {
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
              <span className="font-medium">Total Students:</span>
              <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full font-bold text-xs">
                {totalStudents}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "view" && <StudentViewTab />}
          {activeTab === "upload" && <StudentUploadTab />}
        </div>
      </div>
    </div>
  );
};

export default StudentManagement;
