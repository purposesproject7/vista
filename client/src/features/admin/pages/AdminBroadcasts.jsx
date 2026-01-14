// src/features/admin/pages/AdminBroadcasts.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../../../shared/components/Navbar";
import AdminTabs from "../components/shared/AdminTabs";
import BroadcastForm from "../components/broadcasts/BroadcastForm";
import BroadcastHistory from "../components/broadcasts/BroadcastHistory";
import { useToast } from "../../../shared/hooks/useToast";
import {
  fetchBroadcasts as apiFetchBroadcasts,
  createBroadcast as apiCreateBroadcast,
  updateBroadcast as apiUpdateBroadcast,
  deleteBroadcast as apiDeleteBroadcast,
  fetchMasterData,
} from "../services/adminApi";

const DEFAULT_HISTORY_LIMIT = 25;

const AdminBroadcasts = () => {
  const { showToast } = useToast();

  // Options from database
  const [schoolOptions, setSchoolOptions] = useState([]);
  const [allSchools, setAllSchools] = useState([]); // Store full school objects
  const [allPrograms, setAllPrograms] = useState([]); // Store all programs with school info

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    targetSchools: [],
    targetPrograms: [], // Will store "SchoolName::ProgramName" format
    expiresAt: "",
    action: "notice",
    isActive: true,
    sendEmail: false,
  });
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [includeExpired, setIncludeExpired] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(DEFAULT_HISTORY_LIMIT);
  const [editingBroadcastId, setEditingBroadcastId] = useState(null);

  // Fetch schools, departments, years, and semesters from database
  const fetchOptions = useCallback(async () => {
    try {
      const masterData = await fetchMasterData();

      if (masterData.success) {
        const schoolsData = masterData.data?.schools || [];
        const schools = schoolsData.map((s) => s.name);

        // Create map of school code -> school name
        const schoolCodeMap = {};
        schoolsData.forEach((s) => {
          if (s.code) schoolCodeMap[s.code] = s.name;
          if (s.name) schoolCodeMap[s.name] = s.name;
        });

        const rawPrograms = masterData.data?.programs || [];
        const programs = rawPrograms.map((p) => ({
          ...p,
          schoolName: schoolCodeMap[p.school] || p.school,
        }));

        console.log("Schools:", schools);
        console.log("Programs:", programs);

        setAllSchools(schoolsData);
        setSchoolOptions(schools);
        // Store all programs with their school information
        setAllPrograms(programs);
      } else {
        showToast(masterData.message || "Failed to load options", "error");
      }
    } catch (err) {
      console.error("Failed to load options:", err);
      showToast("Unable to load dropdown options", "error");
    }
  }, [showToast]);

  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      message: "",
      targetSchools: [],
      targetPrograms: [],
      expiresAt: "",
      action: "notice",
      isActive: true,
      sendEmail: false,
    });
    setEditingBroadcastId(null);
  }, []);

  const toggleAudienceValue = useCallback(
    (key, value) => {
      setFormData((prev) => {
        const list = prev[key];
        const exists = list.includes(value);
        const nextValues = exists
          ? list.filter((item) => item !== value)
          : [...list, value];

        const updates = {
          ...prev,
          [key]: nextValues,
        };

        // If toggling schools, clear programs that don't belong to selected schools
        if (key === "targetSchools") {
          const selectedSchools = nextValues;
          if (selectedSchools.length > 0) {
            // Find codes for selected school names
            const selectedSchoolCodes = allSchools
              .filter((s) => selectedSchools.includes(s.name))
              .map((s) => s.code);

            // Filter out programs that don't belong to any selected school
            updates.targetPrograms = prev.targetPrograms.filter(
              (programKey) => {
                const [schoolCode] = programKey.split("::");
                return selectedSchoolCodes.includes(schoolCode);
              }
            );
          }
          // If no schools selected, keep all programs (show all mode)
        }

        return updates;
      });
    },
    [allSchools]
  );

  const resetAudience = (key) => {
    setFormData((prev) => ({
      ...prev,
      [key]: [],
    }));
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);

      const response = await apiFetchBroadcasts({
        limit: historyLimit,
        includeExpired,
      });

      if (response.success) {
        setHistory(response.data || []);
      } else {
        showToast(
          response.message || "Failed to load broadcast history",
          "error"
        );
      }
    } catch (err) {
      console.error("Failed to load broadcast history:", err);
      showToast("Unable to load broadcast history", "error");
    } finally {
      setHistoryLoading(false);
    }
  }, [historyLimit, includeExpired, showToast]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.message.trim()) {
      showToast("Message required", "error");
      return;
    }

    if (!formData.expiresAt) {
      showToast("Expiry required", "error");
      return;
    }

    // DateTimePicker already returns ISO string
    const expiryIso = formData.expiresAt;
    if (!expiryIso || new Date(expiryIso) <= new Date()) {
      showToast("Expiry must be in the future", "error");
      return;
    }

    setSending(true);
    try {
      // Extract just program names from "School::Program" format
      const programNames = formData.targetPrograms.map((key) => {
        const [, programName] = key.split("::");
        return programName;
      });

      const payload = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        targetSchools: formData.targetSchools,
        targetPrograms: programNames,
        expiresAt: expiryIso,
        action: formData.action || "notice",
        isActive: formData.isActive,
        sendEmail: formData.sendEmail,
      };

      let response;
      if (editingBroadcastId) {
        response = await apiUpdateBroadcast(editingBroadcastId, payload);
      } else {
        response = await apiCreateBroadcast(
          payload.message,
          payload.expiresAt,
          payload.targetSchools,
          payload.targetPrograms,
          payload.title,
          payload.action,
          payload.priority,
          payload.sendEmail
        );
      }

      if (response.success) {
        showToast(
          editingBroadcastId
            ? "Broadcast updated successfully"
            : "Broadcast sent successfully",
          "success"
        );
        resetForm();
        fetchHistory();
      } else {
        showToast(response.message || "Failed to save broadcast", "error");
      }
    } catch (err) {
      console.error("Failed to submit broadcast:", err);
      showToast(
        err.response?.data?.message || "Unable to save broadcast",
        "error"
      );
    } finally {
      setSending(false);
    }
  };

  const handleEditBroadcast = useCallback(
    (broadcast) => {
      setEditingBroadcastId(broadcast._id);

      // Convert program names back to "School::Program" format for editing
      const programNames =
        broadcast.targetPrograms || broadcast.targetDepartments || [];
      const programKeys = programNames.map((programName) => {
        // Find the program in allPrograms to get its school
        const program = allPrograms.find((p) => p.name === programName);
        return program ? `${program.school}::${program.name}` : programName;
      });

      setFormData({
        title: broadcast.title || "",
        message: broadcast.message || "",
        targetSchools: broadcast.targetSchools || [],
        targetPrograms: programKeys,
        expiresAt: broadcast.expiresAt, // DateTimePicker expects ISO string
        action: broadcast.action || "notice",
        isActive: broadcast.isActive ?? true,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [allPrograms]
  );

  const handleCancelEdit = useCallback(() => {
    resetForm();
  }, [resetForm]);

  const handleDeleteBroadcast = useCallback(
    async (broadcastId) => {
      if (!window.confirm("Delete this broadcast permanently?")) return;

      try {
        const response = await apiDeleteBroadcast(broadcastId);

        if (response.success) {
          showToast("Broadcast deleted", "success");
          if (editingBroadcastId === broadcastId) {
            resetForm();
          }
          fetchHistory();
        } else {
          showToast(response.message || "Failed to delete broadcast", "error");
        }
      } catch (err) {
        console.error("Failed to delete broadcast:", err);
        showToast(
          err.response?.data?.message || "Unable to delete broadcast",
          "error"
        );
      }
    },
    [editingBroadcastId, fetchHistory, resetForm, showToast]
  );

  // Filter programs based on selected schools
  // Return format: { key: "School::Program", label: "Program (School)" }
  const filteredProgramOptions = useMemo(() => {
    let programsToShow = allPrograms;

    // Filter by selected schools if any are selected
    if (formData.targetSchools.length > 0) {
      // Find codes for selected school names
      const selectedSchoolCodes = allSchools
        .filter((s) => formData.targetSchools.includes(s.name))
        .map((s) => s.code);

      programsToShow = allPrograms.filter((program) => {
        // program.school is the school code
        return selectedSchoolCodes.includes(program.school);
      });
    }

    // Create unique keys by combining school and program name
    // Display format: "Program Name (School Name)"
    return programsToShow.map((p) => ({
      key: `${p.school}::${p.name}`,
      label: `${p.name} (${p.schoolName})`,
    }));
  }, [formData.targetSchools, allPrograms, allSchools]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Admin Tabs */}
      <AdminTabs />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Broadcast Form */}
        <BroadcastForm
          formData={formData}
          editingBroadcastId={editingBroadcastId}
          sending={sending}
          onSubmit={handleSubmit}
          onInputChange={handleInputChange}
          onToggleAudience={toggleAudienceValue}
          onResetAudience={resetAudience}
          onCancelEdit={handleCancelEdit}
          onRefreshHistory={fetchHistory}
          historyLoading={historyLoading}
          schoolOptions={schoolOptions}
          programOptions={filteredProgramOptions}
        />

        {/* Broadcast History */}
        <BroadcastHistory
          history={history}
          loading={historyLoading}
          includeExpired={includeExpired}
          historyLimit={historyLimit}
          onIncludeExpiredChange={setIncludeExpired}
          onLimitChange={setHistoryLimit}
          onEdit={handleEditBroadcast}
          onDelete={handleDeleteBroadcast}
        />
      </div>
    </div>
  );
};

export default AdminBroadcasts;
