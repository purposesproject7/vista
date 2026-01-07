// // src/features/project-coordinator/components/shared/CoordinatorTabs.jsx
// import React, { useEffect, useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import {
//   UserGroupIcon,
//   AcademicCapIcon,
//   DocumentTextIcon,
//   UsersIcon,
//   ClipboardDocumentListIcon,
// } from "@heroicons/react/24/outline";
// import { toast } from "react-hot-toast"; // Recommended: install react-hot-toast for better UX

// const CoordinatorTabs = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [coordinator, setCoordinator] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Fetch current coordinator permissions (adjust API endpoint as per your backend)
//   useEffect(() => {
//     const fetchCoordinator = async () => {
//       try {
//         const res = await fetch("/api/coordinator/me"); // Your actual endpoint
//         const data = await res.json();
//         setCoordinator(data);
//       } catch (err) {
//         console.error("Failed to fetch coordinator permissions", err);
//         toast.error("Failed to load permissions");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCoordinator();
//   }, []);

//   const isActiveTab = (path) => location.pathname.startsWith(path);

//   // Helper: Check if a permission is currently granted
//   const isPermissionActive = (perm) => {
//     if (!perm || !perm.enabled) return false;
//     if (perm.deadline && new Date(perm.deadline) < new Date("2025-12-27")) {
//       return false; // Expired
//     }
//     return true;
//   };

//   // Check if coordinator has access to the 4 main management features
//   const hasManagementAccess = (coordinator) => {
//     if (!coordinator?.permissions) return false;

//     const p = coordinator.permissions;

//     const studentAccess =
//       isPermissionActive(p.canUploadStudents) ||
//       isPermissionActive(p.canModifyStudents) ||
//       isPermissionActive(p.canDeleteStudents);

//     const facultyAccess =
//       isPermissionActive(p.canCreateFaculty) ||
//       isPermissionActive(p.canEditFaculty) ||
//       isPermissionActive(p.canDeleteFaculty);

//     const projectAccess =
//       isPermissionActive(p.canCreateProjects) ||
//       isPermissionActive(p.canEditProjects) ||
//       isPermissionActive(p.canDeleteProjects);

//     const panelAccess =
//       isPermissionActive(p.canCreatePanels) ||
//       isPermissionActive(p.canEditPanels) ||
//       isPermissionActive(p.canDeletePanels) ||
//       isPermissionActive(p.canAssignPanels) ||
//       isPermissionActive(p.canReassignPanels);

//     return studentAccess && facultyAccess && projectAccess && panelAccess;
//   };

//   const managementAllowed = hasManagementAccess(coordinator);

//   const tabs = [
//     {
//       id: "students",
//       label: "Student Management",
//       path: "/coordinator/students",
//       icon: UserGroupIcon,
//       blocked: !managementAllowed,
//     },
//     {
//       id: "faculty",
//       label: "Faculty Management",
//       path: "/coordinator/faculty",
//       icon: AcademicCapIcon,
//       blocked: !managementAllowed,
//     },
//     {
//       id: "projects",
//       label: "Project Management",
//       path: "/coordinator/projects",
//       icon: DocumentTextIcon,
//       blocked: !managementAllowed,
//     },
//     {
//       id: "panels",
//       label: "Panel Management",
//       path: "/coordinator/panels",
//       icon: UsersIcon,
//       blocked: !managementAllowed,
//     },
//     {
//       id: "requests",
//       label: "Request Management",
//       path: "/coordinator/requests",
//       icon: ClipboardDocumentListIcon,
//       blocked: false,
//     },
//     {
//       id: "requests_by_ProjectCoordinator",
//       label: "Feature Request",
//       path: "/coordinator/request-access",
//       icon: ClipboardDocumentListIcon,
//       blocked: false,
//     },
//   ];

//   const handleTabClick = (tab) => {
//     if (tab.blocked) {
//       toast.error("Request to Admin using Feature Request Page", {
//         duration: 5000,
//       });
//       navigate("/coordinator/request-access");
//       return;
//     }
//     navigate(tab.path);
//   };

//   if (loading) {
//     return <div className="py-4 text-center">Loading permissions...</div>;
//   }

//   return (
//     <div className="bg-white border-b border-gray-200 shadow-sm">
//       <div className="max-w-7xl mx-auto px-4">
//         <div className="flex items-center gap-2 py-3 flex-wrap">
//           {tabs.map((tab) => {
//             const Icon = tab.icon;
//             const isCurrent = isActiveTab(tab.path);

//             return (
//               <button
//                 key={tab.id}
//                 onClick={() => handleTabClick(tab)}
//                 disabled={tab.blocked}
//                 className={`
//                   flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
//                   transition-all duration-200 whitespace-nowrap relative
//                   ${
//                     isCurrent
//                       ? "bg-blue-600 text-white shadow-md"
//                       : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow"
//                   }
//                   ${tab.blocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
//                 `}
//                 title={tab.blocked ? "Access restricted - Request via Feature Request page" : tab.label}
//               >
//                 <Icon className="w-5 h-5" />
//                 <span>{tab.label}</span>
//                 {tab.blocked && (
//                   <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
//                     Locked
//                   </span>
//                 )}
//               </button>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CoordinatorTabs;

// src/features/project-coordinator/components/shared/CoordinatorTabs.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  UserGroupIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { fetchPermissions as apiFetchPermissions } from "../../services/coordinatorApi";

const CoordinatorTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [coordinator, setCoordinator] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==================================================================
  // FOR DEVELOPMENT: Bypass permission check → All tabs are free
  // ==================================================================
  const IS_DEVELOPMENT = false; // <<<<< CHANGE THIS TO `false` IN PRODUCTION

  // Fetch coordinator data (only needed in production)
  useEffect(() => {
    const fetchCoordinator = async () => {
      if (IS_DEVELOPMENT) {
        // Simulate loaded state instantly for dev
        setCoordinator({ permissions: "mock" }); // any truthy value
        setLoading(false);
        return;
      }

      try {
        const data = await apiFetchPermissions();
        if (data.success) {
          setCoordinator(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch coordinator permissions", err);
        toast.error("Failed to load permissions");
      } finally {
        setLoading(false);
      }
    };

    fetchCoordinator();
  }, []);

  const isActiveTab = (path) => location.pathname.startsWith(path);

  // Helper: Check if a permission is active (used only in production)
  const isPermissionActive = (perm) => {
    if (!perm || !perm.enabled) return false;
    if (perm.deadline && new Date(perm.deadline) < new Date()) {
      return false; // Expired (uses real current date)
    }
    return true;
  };

  // Real permission logic (only used when IS_DEVELOPMENT = false)
  const hasManagementAccess = (coordinator) => {
    if (IS_DEVELOPMENT) return true; // <<<<< DEV: Always allow

    if (!coordinator?.permissions) return false;

    const p = coordinator.permissions;

    const studentAccess = isPermissionActive(p.student_management);
    const facultyAccess = isPermissionActive(p.faculty_management);
    const projectAccess = isPermissionActive(p.project_management);
    const panelAccess = isPermissionActive(p.panel_management);

    return studentAccess && facultyAccess && projectAccess && panelAccess;
  };

  // Final decision: Are management tabs allowed?
  const managementAllowed = hasManagementAccess(coordinator);

  const tabs = [
    {
      id: "students",
      label: "Student Management",
      path: "/coordinator/students",
      icon: UserGroupIcon,
      blocked: !managementAllowed,
    },
    {
      id: "faculty",
      label: "Faculty Management",
      path: "/coordinator/faculty",
      icon: AcademicCapIcon,
      blocked: !managementAllowed,
    },
    {
      id: "projects",
      label: "Project Management",
      path: "/coordinator/projects",
      icon: DocumentTextIcon,
      blocked: !managementAllowed,
    },
    {
      id: "panels",
      label: "Panel Management",
      path: "/coordinator/panels",
      icon: UsersIcon,
      blocked: !managementAllowed,
    },
    {
      id: "requests",
      label: "Request Management",
      path: "/coordinator/requests",
      icon: ClipboardDocumentListIcon,
      blocked: false,
    },
    {
      id: "requests_by_ProjectCoordinator",
      label: "Feature Request",
      path: "/coordinator/request-access",
      icon: ClipboardDocumentListIcon,
      blocked: false,
    },
  ];

  const handleTabClick = (tab) => {
    if (tab.blocked) {
      toast.error("Request to Admin using Feature Request Page", {
        duration: 5000,
      });
      navigate("/coordinator/request-access");
      return;
    }
    navigate(tab.path);
  };

  if (loading) {
    return <div className="py-4 text-center">Loading permissions...</div>;
  }

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2 py-3 flex-wrap">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isCurrent = isActiveTab(tab.path);

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                disabled={tab.blocked}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                  transition-all duration-200 whitespace-nowrap relative
                  ${
                    isCurrent
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow"
                  }
                  ${
                    tab.blocked
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }
                `}
                title={
                  tab.blocked
                    ? "Access restricted - Request via Feature Request page"
                    : tab.label
                }
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
                {tab.blocked && (
                  <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                    Locked
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CoordinatorTabs;
