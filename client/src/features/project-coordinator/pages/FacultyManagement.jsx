// src/features/project-coordinator/pages/FacultyManagement.jsx
import { useState, useEffect, useCallback } from "react";
import { PlusCircleIcon, EyeIcon } from "@heroicons/react/24/outline";
import Navbar from "../../../shared/components/Navbar";
import CoordinatorTabs from "../components/shared/CoordinatorTabs";
import AcademicFilterSelector from "../components/shared/AcademicFilterSelector";
import FacultyList from "../components/faculty-management/FacultyList";
import FacultyModal from "../components/faculty-management/FacultyModal";
import FacultyCreationTab from "../components/faculty-management/FacultyCreation";
import Card from "../../../shared/components/Card";
import { useToast } from "../../../shared/hooks/useToast";
import { useAuth } from "../../../shared/hooks/useAuth";
import {
  fetchFaculty as apiFetchFaculty,
  createFaculty as apiCreateFaculty,
  updateFaculty as apiUpdateFaculty,
  deleteFaculty as apiDeleteFaculty,
  fetchPermissions as apiFetchPermissions,
} from "../services/coordinatorApi";

const FacultyManagement = () => {
  const [faculty, setFaculty] = useState([]);
  const [filters, setFilters] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPrimary, setIsPrimary] = useState(true);
  const [activeTab, setActiveTab] = useState("view");
  const [showModal, setShowModal] = useState(false);
  const [showAllPrograms, setShowAllPrograms] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [coordinatorSchool, setCoordinatorSchool] = useState("1"); // Default SCOPE
  const [coordinatorProgramme, setCoordinatorProgramme] = useState("1"); // Default B.Tech CSE
  const { showToast } = useToast();
  const { user } = useAuth();

  // Load coordinator context (school and programme)
  useEffect(() => {
    const fetchCoordinatorContext = async () => {
      try {
        setLoading(true);
        // Get coordinator's school and programme from user data or API
        if (user && user.school && user.department) {
          setCoordinatorSchool(user.school);
          setCoordinatorProgramme(user.department);
        }

        // Fetch permissions to check if primary
        const permResponse = await apiFetchPermissions();
        if (permResponse.success) {
          setIsPrimary(permResponse.data.isPrimary);
        }
      } catch (error) {
        console.error("Error fetching coordinator context:", error);
        showToast("Error loading coordinator context", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchCoordinatorContext();
  }, [user, showToast]);

  // Fetch faculty when filters change
  useEffect(() => {
    if (filters && activeTab === "view") {
      fetchFaculty();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, activeTab, showAllPrograms]);

  const fetchFaculty = async () => {
    try {
      setLoading(true);

      const response = await apiFetchFaculty({
        school: user?.school,
        program: showAllPrograms ? 'all' : user?.program,
        academicYear: filters?.year,
        showAllPrograms: showAllPrograms
      });

      if (response.success) {
        // Filter out admins
        const validFaculty = (response.faculty || []).filter(
          f => f.role?.toLowerCase() !== 'admin'
        );
        setFaculty(validFaculty);
        showToast(
          `Loaded ${validFaculty.length} faculty members`,
          "success"
        );
      } else {
        showToast(response.message || "Failed to load faculty", "error");
      }
    } catch (error) {
      console.error("Error fetching faculty:", error);
      showToast(
        error.response?.data?.message || "Failed to load faculty",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(selectedFilters)) return prev;
      return selectedFilters;
    });
  }, []);

  const facultyTabs = [
    {
      id: "view",
      label: "Faculty View",
      icon: EyeIcon,
      description: "View existing faculty",
      enabled: true,
    },
    {
      id: "create",
      label: "Faculty Create",
      icon: PlusCircleIcon,
      description: "Add faculty members",
      enabled: isPrimary, // Only primary coordinators can create
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <CoordinatorTabs />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Faculty Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {isPrimary
              ? "You have full access to faculty management"
              : "You have view-only access"}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-2">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-2 flex-wrap">
              {facultyTabs.map((tab) => {
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
                      ${isDisabled
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

            <div className="px-4 flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Total Faculty:</span>
              <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full font-bold text-xs">
                {faculty.length}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "view" && (
          <div className="space-y-6">
            {/* Filter Selector */}
            <AcademicFilterSelector onFilterComplete={handleFilterComplete} />

            {/* Show All Toggle */}
            <div className="flex justify-end px-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showAll"
                  checked={showAllPrograms}
                  onChange={(e) => setShowAllPrograms(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="showAll" className="text-sm font-medium text-gray-700 select-none">
                  Show Faculties from All Programs
                </label>
              </div>
            </div>

            {/* Faculty List */}
            <FacultyList faculty={faculty} />
            {/* {filters && (
              <>
                {loading ? (
                  <Card>
                    <div className="py-12 flex justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  </Card>
                ) : (
                )}
              </> */}
            {/* )} */}
          </div>
        )}

        {activeTab === "create" && isPrimary && (
          <FacultyCreationTab
            school={coordinatorSchool}
            programme={coordinatorProgramme}
            hideSchoolProgramme={true}
          />
        )}
      </div>

      {/* Faculty Modal */}
      <FacultyModal
        isOpen={showModal}
        faculty={selectedFaculty}
        onClose={() => {
          setShowModal(false);
          setSelectedFaculty(null);
        }}
        onSave={async (formData) => {
          try {
            if (selectedFaculty) {
              // Update existing faculty
              const response = await apiUpdateFaculty(
                selectedFaculty.id || selectedFaculty._id,
                formData
              );

              if (response.success) {
                setFaculty(
                  faculty.map((f) =>
                    f.id === selectedFaculty.id || f._id === selectedFaculty._id
                      ? { ...f, ...formData }
                      : f
                  )
                );
                showToast("Faculty updated successfully", "success");
                setShowModal(false);
                setSelectedFaculty(null);
              } else {
                showToast(
                  response.message || "Failed to update faculty",
                  "error"
                );
              }
            } else {
              // Create new faculty
              const response = await apiCreateFaculty({
                ...formData,
                school: user?.school,
                department: user?.department,
                academicYear: filters?.academicYear,
              });

              if (response.success) {
                // The API returns the created object in response.data, but list expects full object
                // We might need to refresh the list or construct the object
                // For now, let's refresh the list to be safe and simple
                fetchFaculty();
                showToast("Faculty added successfully", "success");
                setShowModal(false);
              } else {
                showToast(
                  response.message || "Failed to create faculty",
                  "error"
                );
              }
            }
          } catch (error) {
            console.error("Error saving faculty:", error);
            showToast(
              error.response?.data?.message || "Failed to save faculty",
              "error"
            );
          }
        }}
      />
    </div>
  );
};

export default FacultyManagement;
