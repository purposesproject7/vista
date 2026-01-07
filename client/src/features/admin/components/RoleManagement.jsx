import { useState, useMemo, useEffect } from "react";
import {
  UserGroupIcon,
  StarIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import LoadingSpinner from "../../../shared/components/LoadingSpinner";
import { useToast } from "../../../shared/hooks/useToast";
import {
  fetchProjectCoordinators,
  assignProjectCoordinator,
  updateCoordinatorPermissions,
  removeProjectCoordinator,
  fetchFaculty,
} from "../services/adminApi";

const RoleManagement = ({ schools, programsBySchool, years }) => {
  const { showToast } = useToast();

  // Academic Context Selection
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedProgramme, setSelectedProgramme] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  // Role assignments
  const [coordinatorAssignments, setCoordinatorAssignments] = useState([]);

  // Faculty list
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search and selection
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState([]);

  // Get available programmes based on selected school
  const availableProgrammes = useMemo(() => {
    if (!selectedSchool) return [];
    const schoolObj = schools.find((s) => s.code === selectedSchool);
    if (!schoolObj) return [];
    return programsBySchool?.[schoolObj.code] || [];
  }, [selectedSchool, programsBySchool, schools]);

  // Filter progress calculation
  const filtersComplete = useMemo(() => {
    const completed = [selectedSchool, selectedProgramme, selectedYear].filter(
      Boolean
    ).length;
    return { completed, total: 3, percentage: (completed / 3) * 100 };
  }, [selectedSchool, selectedProgramme, selectedYear]);

  // Load faculty when school changes
  useEffect(() => {
    if (selectedSchool) {
      loadFaculty();
    } else {
      setFacultyList([]);
    }
  }, [selectedSchool]);

  // Load coordinators when context changes
  useEffect(() => {
    if (filtersComplete.completed === 3) {
      loadCoordinators();
    } else {
      setCoordinatorAssignments([]);
    }
  }, [selectedSchool, selectedProgramme, selectedYear]);

  const loadCoordinators = async () => {
    setLoading(true);
    try {
      // Get year name
      const yearObj = years.find((y) => y.id === parseInt(selectedYear));
      const schoolObj = schools.find((s) => s.code === selectedSchool);
      const programObj = programsBySchool[selectedSchool]?.find(
        (p) => p.code === selectedProgramme
      );

      if (!yearObj || !schoolObj || !programObj) {
        return;
      }

      // Fetch coordinators for this context
      const coordResponse = await fetchProjectCoordinators({
        academicYear: yearObj.name,
        school: schoolObj.code,
        program: programObj.code,
      });

      if (coordResponse.success) {
        setCoordinatorAssignments(coordResponse.data || []);
      }
    } catch (error) {
      console.error("Error loading coordinators:", error);
      showToast("Failed to load coordinators", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadFaculty = async () => {
    setLoading(true);
    try {
      const schoolObj = schools.find((s) => s.code === selectedSchool);
      if (!schoolObj) return;

      // Fetch all faculty for this school
      const facultyResponse = await fetchFaculty({
        school: schoolObj.code,
      });

      if (facultyResponse.success) {
        // adminApi.js fetchFaculty returns { success, count, faculty }
        setFacultyList(facultyResponse.faculty || []);
      }
    } catch (error) {
      console.error("Error loading faculty:", error);
      showToast("Failed to load faculty", "error");
    } finally {
      setLoading(false);
    }
  };

  // Get faculty for selected context
  const contextFaculty = useMemo(() => {
    return facultyList.filter(
      (f) => f.role === "faculty" || f.role === "project-coordinator"
    );
  }, [facultyList]);

  // Search filtered faculty
  const filteredFaculty = useMemo(() => {
    if (!searchTerm.trim()) return contextFaculty;
    const term = searchTerm.toLowerCase();
    return contextFaculty.filter(
      (f) =>
        f.name.toLowerCase().includes(term) ||
        f.employeeId.toLowerCase().includes(term) ||
        f.email?.toLowerCase().includes(term)
    );
  }, [contextFaculty, searchTerm]);

  // Assigned coordinators
  const assignedCoordinators = useMemo(() => {
    if (coordinatorAssignments.length === 0) return [];

    return coordinatorAssignments
      .map((coord) => {
        const faculty = facultyList.find(
          (f) =>
            f._id === coord.faculty?._id ||
            f._id === coord.faculty ||
            f._id === coord.facultyId // Fallback just in case
        );
        return {
          ...coord,
          faculty: faculty || coord.faculty || coord.facultyId,
        };
      })
      .filter((c) => c.faculty);
  }, [coordinatorAssignments, facultyList]);

  // Handlers
  const toggleFacultySelection = (facultyId) => {
    setSelectedFaculty((prev) =>
      prev.includes(facultyId)
        ? prev.filter((id) => id !== facultyId)
        : [...prev, facultyId]
    );
  };

  const handleAssignCoordinators = async () => {
    if (selectedFaculty.length === 0) {
      showToast("Please select at least one faculty member", "error");
      return;
    }

    const yearObj = years.find(
      (y) => y.id === parseInt(selectedYear) || y.id == selectedYear
    );
    const schoolObj = schools.find((s) => s.code === selectedSchool);
    const programObj = programsBySchool[selectedSchool]?.find(
      (p) => p.code === selectedProgramme
    );

    console.log("Context Debug:", {
      selectedYear,
      selectedSchool,
      selectedProgramme,
      yearObj,
      schoolObj,
      programObj,
      years,
      schools,
      programs: programsBySchool[selectedSchool],
    });

    if (!yearObj || !schoolObj || !programObj) {
      showToast("Invalid context", "error");
      return;
    }

    setLoading(true);
    try {
      // Assign each selected faculty as coordinator
      for (const facultyId of selectedFaculty) {
        await assignProjectCoordinator(
          facultyId,
          yearObj.name,
          schoolObj.code,
          programObj.code,
          false
        );
      }

      showToast(
        `${selectedFaculty.length} coordinator(s) assigned successfully`,
        "success"
      );
      setSelectedFaculty([]);

      setSelectedFaculty([]);

      // Reload data
      await loadCoordinators();
    } catch (error) {
      console.error("Error assigning coordinators:", error);
      showToast(
        error.response?.data?.message || "Failed to assign coordinators",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSetMainCoordinator = async (coordinatorId) => {
    setLoading(true);
    try {
      await updateCoordinatorPermissions(coordinatorId, {
        isPrimary: true,
      });

      showToast("Main coordinator updated successfully", "success");
      await loadCoordinators();
    } catch (error) {
      console.error("Error setting main coordinator:", error);
      showToast("Failed to update main coordinator", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoordinator = async (coordinatorId) => {
    if (!window.confirm("Are you sure you want to remove this coordinator?")) {
      return;
    }

    setLoading(true);
    try {
      await removeProjectCoordinator(coordinatorId);
      showToast("Coordinator removed successfully", "success");
      await loadCoordinators();
    } catch (error) {
      console.error("Error removing coordinator:", error);
      showToast("Failed to remove coordinator", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Role Management</h2>
        <p className="text-sm text-gray-600 mt-1">
          Assign and manage project coordinators for specific academic contexts
        </p>
      </div>

      {/* Context Selection */}
      <Card>
        <div className="p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Academic Context
          </h3>

          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Selection Progress: {filtersComplete.completed}/3
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(filtersComplete.percentage)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${filtersComplete.percentage}%` }}
                />
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School
                </label>
                <select
                  value={selectedSchool}
                  onChange={(e) => {
                    setSelectedSchool(e.target.value);
                    setSelectedProgramme("");
                    setSelectedYear("");
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select School</option>
                  {schools.map((school) => (
                    <option key={school.code} value={school.code}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Programme
                </label>
                <select
                  value={selectedProgramme}
                  onChange={(e) => {
                    setSelectedProgramme(e.target.value);
                    setSelectedYear("");
                  }}
                  disabled={!selectedSchool}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select Programme</option>
                  {availableProgrammes.map((prog) => (
                    <option key={prog.code} value={prog.code}>
                      {prog.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year & Semester
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  disabled={!selectedProgramme}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select Year</option>
                  {years.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Assigned Coordinators */}
      {filtersComplete.completed === 3 && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <UserGroupIcon className="h-5 w-5 text-blue-600" />
                Assigned Coordinators ({assignedCoordinators.length})
              </h3>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : assignedCoordinators.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <UserGroupIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No coordinators assigned yet</p>
                <p className="text-sm mt-2">
                  Select faculty below to assign them as coordinators
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {assignedCoordinators.map((coord) => (
                  <div
                    key={coord._id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {coord.isPrimary && (
                        <StarIconSolid className="h-5 w-5 text-yellow-500" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {coord.faculty?.name || coord.facultyId?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {coord.faculty?.employeeId ||
                            coord.facultyId?.employeeId}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!coord.isPrimary && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSetMainCoordinator(coord._id)}
                          disabled={loading}
                        >
                          <StarIcon className="h-4 w-4 mr-1" />
                          Set as Main
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRemoveCoordinator(coord._id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={loading}
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Faculty Selection */}
      {selectedSchool && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">
                Assign New Coordinators
              </h3>
              {selectedFaculty.length > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAssignCoordinators}
                  disabled={loading || filtersComplete.completed !== 3}
                  title={
                    filtersComplete.completed !== 3
                      ? "Complete context selection to assign"
                      : ""
                  }
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Assign {selectedFaculty.length} Coordinator
                  {selectedFaculty.length !== 1 ? "s" : ""}
                </Button>
              )}
            </div>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search faculty by name, ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Faculty List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : filteredFaculty.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No faculty found for this context</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredFaculty.map((faculty) => {
                  const isAssigned = assignedCoordinators.some(
                    (c) =>
                      (c.faculty?._id || c.facultyId?._id || c.facultyId) ===
                      faculty._id
                  );
                  const isSelected = selectedFaculty.includes(faculty._id);

                  return (
                    <div
                      key={faculty._id}
                      onClick={() =>
                        !isAssigned && toggleFacultySelection(faculty._id)
                      }
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer ${
                        isAssigned
                          ? "bg-gray-100 border-gray-300 cursor-not-allowed opacity-60"
                          : isSelected
                          ? "bg-blue-50 border-blue-500 ring-2 ring-blue-200"
                          : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected || isAssigned}
                          disabled={isAssigned}
                          onChange={() => {}}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {faculty.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {faculty.employeeId} • {faculty.email}
                          </p>
                        </div>
                      </div>
                      {isAssigned && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Already Assigned
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default RoleManagement;
