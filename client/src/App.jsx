import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./shared/context/AuthContext";
import { useAuth } from "./shared/hooks/useAuth";
import { AdminProvider } from "./features/admin/context/AdminContext";
import { CoordinatorProvider } from "./features/project-coordinator/context/CoordinatorContext";
import GlobalErrorBoundary from "./shared/components/GlobalErrorBoundary";

import FacultyDashboard from "./features/faculty/pages/FacultyDashboard";
import FacultyTutorial from "./features/faculty/pages/tutorial/FacultyTutorial";
import GuideReviews from "./features/faculty/pages/GuideReviews";
import StudentManagement from "./features/admin/pages/StudentManagement";
import FacultyManagement from "./features/admin/pages/FacultyManagement";
import AdminManagement from "./features/admin/pages/AdminManagement";
import ProjectManagement from "./features/admin/pages/ProjectManagement";
import PanelManagementLanding from "./features/admin/pages/PanelManagementLanding";
import AdminReports from "./features/admin/pages/AdminReports";
import AdminSettings from "./features/admin/pages/AdminSettings";
import RequestManagement from "./features/admin/pages/RequestManagement";
import AdminBroadcasts from "./features/admin/pages/AdminBroadcasts";
import CoordinatorManagement from "./features/admin/pages/CoordinatorManagement";


// Project Coordinator Pages
import CoordinatorStudentManagement from "./features/project-coordinator/pages/StudentManagement";
import CoordinatorFacultyManagement from "./features/project-coordinator/pages/FacultyManagement";
import CoordinatorProjectManagement from "./features/project-coordinator/pages/ProjectManagement";
import CoordinatorPanelManagement from "./features/project-coordinator/pages/PanelManagement";
import CoordinatorRequestManagement from "./features/project-coordinator/pages/RequestManagement";
import CoordinatorRequestAccess from "./features/project-coordinator/pages/RequestAccess";
import CoordinatorRubricsManagement from "./features/project-coordinator/pages/RubricsManagement";
import CoordinatorModificationsManagement from "./features/project-coordinator/pages/ModificationsManagement";
import CoordinatorReports from "./features/project-coordinator/pages/CoordinatorReports";

import Login from "./features/auth/pages/Login";
import ForgotPassword from "./features/auth/pages/ForgotPassword";
import InstructionsPage from "./features/auth/pages/InstructionsPage";
import BlockedPage from "./features/auth/pages/BlockedPage";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    // Check if user's role is in allowed roles
    const hasRole = allowedRoles.includes(user.role);

    // Special case: if route allows "project_coordinator", also allow faculty with isProjectCoordinator flag
    const isCoordinatorRoute = allowedRoles.includes("project_coordinator");
    const isFacultyCoordinator =
      user.role === "faculty" && user.isProjectCoordinator;

    if (!hasRole && !(isCoordinatorRoute && isFacultyCoordinator)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

// Unauthorized Page Component
const UnauthorizedPage = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page.
        </p>
        <div className="space-y-2">
          <button
            onClick={() => window.history.back()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
          <button
            onClick={logout}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

function AppRoutes() {
  return (
    <GlobalErrorBoundary>
      <Routes>
        <Route path="/" element={<InstructionsPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/blocked" element={<BlockedPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route
          path="/faculty"
          element={
            <ProtectedRoute allowedRoles={["faculty"]}>
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/tutorial"
          element={
            <ProtectedRoute allowedRoles={["faculty"]}>
              <FacultyTutorial />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/reviews"
          element={
            <ProtectedRoute allowedRoles={["faculty"]}>
              <GuideReviews />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes - accessible by admin role */}
        <Route
          path="/admin/*"
          element={
            <AdminProvider>
              <Routes>
                <Route path="" element={<Navigate to="students" replace />} />
                <Route
                  path="students"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <StudentManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="faculty"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <FacultyManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admins"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="coordinators"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <CoordinatorManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="projects"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <ProjectManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="panels"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <PanelManagementLanding />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="reports"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminReports />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="requests"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <RequestManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="broadcasts"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminBroadcasts />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </AdminProvider>
          }
        />


        {/* Project Coordinator Routes - separate from admin */}
        <Route
          path="/coordinator/*"
          element={
            <CoordinatorProvider>
              <Routes>
                <Route path="" element={<Navigate to="students" replace />} />
                <Route
                  path="students"
                  element={
                    <ProtectedRoute allowedRoles={["project_coordinator"]}>
                      <CoordinatorStudentManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="faculty"
                  element={
                    <ProtectedRoute allowedRoles={["project_coordinator"]}>
                      <CoordinatorFacultyManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="projects"
                  element={
                    <ProtectedRoute allowedRoles={["project_coordinator"]}>
                      <CoordinatorProjectManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="panels"
                  element={
                    <ProtectedRoute allowedRoles={["project_coordinator"]}>
                      <CoordinatorPanelManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="requests"
                  element={
                    <ProtectedRoute allowedRoles={["project_coordinator"]}>
                      <CoordinatorRequestManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="request-access"
                  element={
                    <ProtectedRoute allowedRoles={["project_coordinator"]}>
                      <CoordinatorRequestAccess />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="rubrics"
                  element={
                    <ProtectedRoute allowedRoles={["project_coordinator"]}>
                      <CoordinatorRubricsManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="modifications"
                  element={
                    <ProtectedRoute allowedRoles={["project_coordinator"]}>
                      <CoordinatorModificationsManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="reports"
                  element={
                    <ProtectedRoute allowedRoles={["project_coordinator"]}>
                      <CoordinatorReports />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </CoordinatorProvider>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </GlobalErrorBoundary>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
