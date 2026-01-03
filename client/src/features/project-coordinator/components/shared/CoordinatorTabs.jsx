// src/features/project-coordinator/components/shared/CoordinatorTabs.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  UserGroupIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

const CoordinatorTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      id: "students",
      label: "Student Management",
      path: "/coordinator/students",
      icon: UserGroupIcon,
      description: "View and manage students",
    },
    {
      id: "faculty",
      label: "Faculty Management",
      path: "/coordinator/faculty",
      icon: AcademicCapIcon,
      description: "Manage faculty members",
    },
    {
      id: "projects",
      label: "Project Management",
      path: "/coordinator/projects",
      icon: DocumentTextIcon,
      description: "Oversee student projects",
    },
    {
      id: "panels",
      label: "Panel Management",
      path: "/coordinator/panels",
      icon: UsersIcon,
      description: "Manage evaluation panels",
    },
    {
      id: "requests",
      label: "Request Management",
      path: "/coordinator/requests",
      icon: ClipboardDocumentListIcon,
      description: "Handle requests",
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2 py-3 flex-wrap">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);

            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                  transition-all duration-200 whitespace-nowrap
                  ${
                    active
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow"
                  }
                `}
                title={tab.description}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CoordinatorTabs;
