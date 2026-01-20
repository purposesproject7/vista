// src/features/admin/components/shared/AdminTabs.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  UserGroupIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  MegaphoneIcon,
  UsersIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../../shared/hooks/useAuth";

const AdminTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSudoAdmin } = useAuth();

  const tabs = [
    {
      id: "students",
      label: "Student Management",
      path: "/admin/students",
      icon: UserGroupIcon,
      description: "View and manage students",
    },
    {
      id: "faculty",
      label: "Faculty Management",
      path: "/admin/faculty",
      icon: AcademicCapIcon,
      description: "Manage faculty members",
    },
    {
      id: "admins",
      label: "Admin Management",
      path: "/admin/admins",
      icon: ShieldCheckIcon,
      description: "Manage admin users",
      sudoOnly: true, // Only visible to ADMIN001
    },
    {
      id: "projects",
      label: "Project Management",
      path: "/admin/projects",
      icon: DocumentTextIcon,
      description: "Oversee student projects",
    },
    {
      id: "panels",
      label: "Panel Management",
      path: "/admin/panels",
      icon: UsersIcon,
      description: "Manage evaluation panels",
    },
    {
      id: "reports",
      label: "Reports",
      path: "/admin/reports",
      icon: ChartBarIcon,
      description: "Generate reports",
    },
    {
      id: "requests",
      label: "Request Management",
      path: "/admin/requests",
      icon: ClipboardDocumentListIcon,
      description: "Handle requests",
    },
    {
      id: "broadcasts",
      label: "Broadcasts",
      path: "/admin/broadcasts",
      icon: MegaphoneIcon,
      description: "Send announcements",
    },
    {
      id: "settings",
      label: "Settings",
      path: "/admin/settings",
      icon: Cog6ToothIcon,
      description: "System settings",
    },
  ];

  const isActive = (path) => location.pathname === path;

  // Filter tabs based on sudo admin status
  const visibleTabs = tabs.filter(tab => {
    if (tab.sudoOnly) {
      return isSudoAdmin();
    }
    return true;
  });

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2 py-3 flex-wrap">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);

            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                  transition-all duration-200 whitespace-nowrap
                  ${active
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

export default AdminTabs;
