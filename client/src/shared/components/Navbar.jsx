// src/shared/components/Navbar.jsx - Light mode
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Button from "./Button";
import UserMenu from "./UserMenu";
import ChangePasswordModal from "../../features/auth/components/ChangePasswordModal";
import {
  ArrowRightOnRectangleIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Determine if currently on coordinator or faculty route
  const isOnCoordinatorRoute = location.pathname.startsWith("/coordinator");
  const isOnFacultyRoute = location.pathname.startsWith("/faculty");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="vista-brand text-2xl font-bold text-blue-600"
              data-tutorial="vista-brand"
            >
              VISTA
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {isOnCoordinatorRoute
                ? "Project Coordinator Dashboard"
                : isOnFacultyRoute
                ? "Faculty Dashboard"
                : user.role === "admin"
                ? "Admin Dashboard"
                : "Dashboard"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              {isOnCoordinatorRoute && user.isProjectCoordinator && (
                <p className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                  {user.isPrimary ? "Primary Coordinator" : "Co-Coordinator"}
                </p>
              )}
            </div>

            {/* Role Switcher for users with both faculty and coordinator access */}
            {user.isProjectCoordinator && user.role === "faculty" && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
                <ArrowsRightLeftIcon className="w-4 h-4 text-blue-600" />
                <button
                  onClick={() => {
                    if (isOnCoordinatorRoute) {
                      navigate("/faculty");
                    } else {
                      navigate("/coordinator");
                    }
                  }}
                  className="text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
                  title={
                    isOnCoordinatorRoute
                      ? "Switch to Faculty Dashboard"
                      : "Switch to Coordinator Dashboard"
                  }
                >
                  {isOnCoordinatorRoute
                    ? "Switch to Faculty"
                    : "Switch to Coordinator"}
                </button>
              </div>
            )}

            <UserMenu
              user={user}
              onChangePassword={() => setIsChangePasswordOpen(true)}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
};

export default Navbar;
