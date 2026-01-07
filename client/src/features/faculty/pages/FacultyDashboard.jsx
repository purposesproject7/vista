import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../../../shared/components/Navbar";
import { useEnhancedFacultyReviews } from "../hooks/useEnhancedFacultyReviews";
import ActiveReviewsSection from "../components/ActiveReviewsSection";
import DeadlinePassedSection from "../components/DeadlinePassedSection";
import PastReviewsSection from "../components/PastReviewsSection";
import MarkEntryModal from "../components/MarkEntryModal";
import Button from "../../../shared/components/Button";
import LoadingSpinner from "../../../shared/components/LoadingSpinner";
import {
  FunnelIcon,
  CalendarIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  WifiIcon,
  SignalIcon,
} from "@heroicons/react/24/outline";
import { getMasterData } from "../services/facultyService";
import toast from "react-hot-toast";
import PerformanceDebug, {
  ProductionPerformanceMonitor,
} from "../../../shared/components/PerformanceDebug";
import RealTimeStatus from "../../../shared/components/RealTimeStatus";

const FacultyDashboard = () => {
  // Filter State with memoization for potato devices
  const [filters, setFilters] = useState({
    year: "",
    school: "",
    program: "",
    type: "",
  });

  // Memoized filters for WebSocket to prevent unnecessary reconnections
  const memoizedFilters = useMemo(() => {
    if (!filters.year || !filters.school || !filters.program || !filters.type) {
      return null;
    }
    return {
      year: filters.year,
      school: filters.school,
      programme: filters.program,
      type: filters.type,
    };
  }, [filters.year, filters.school, filters.program, filters.type]);

  const {
    active,
    deadlinePassed,
    past,
    loading,
    error,
    isOnline,
    wsConnected,
    lastFetchTime,
    dataSource,
    refetch,
    submitMarks: submitMarksOptimized,
    metrics,
    allFiltersSelected,
    isReady,
  } = useEnhancedFacultyReviews(memoizedFilters);

  const [filterOptions, setFilterOptions] = useState({
    years: [],
    schools: [],
    programs: [],
    types: [
      { value: "guide", label: "Guide Reviews" },
      { value: "panel", label: "Panel Reviews" },
    ],
  });
  const [loadingFilters, setLoadingFilters] = useState(true);

  // Initial Data Fetch
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const data = await getMasterData();

        // Process Master Data
        const years = data.academicYears
          .filter((y) => y.isActive)
          .map((y) => y.year);
        const schools = data.schools
          .filter((s) => s.isActive)
          .map((s) => s.code);
        const programs = data.programs
          .filter((p) => p.isActive)
          .map((p) => p.name);
        // Programs might need to be filtered by selected school later

        setFilterOptions({ years, schools, programs });

        // Set defaults if available
        setFilters((prev) => ({
          ...prev,
          year: years[0] || "",
          school: schools[0] || "",
          program: programs[0] || "",
          type: "guide",
        }));
      } catch (err) {
        console.error("Failed to load filter options", err);
      } finally {
        setLoadingFilters(false);
      }
    };

    fetchFilters();
  }, []);

  // Workflow State

  // Workflow State
  const [isInitialized, setIsInitialized] = useState(false);

  // Marking Workflow State
  const [isMarkingOpen, setIsMarkingOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);
  const [currentTeam, setCurrentTeam] = useState(null);

  // Debug state
  const [showDebugPanel, setShowDebugPanel] = useState(
    import.meta.env.VITE_ENABLE_DEBUG_PANEL === "true" && import.meta.env.DEV
  );

  const handleEnterMarks = (review, team) => {
    setCurrentReview(review);
    setCurrentTeam(team);
    setIsMarkingOpen(true);
  };

  const handleMarkingSuccess = async (data) => {
    try {
      console.log("Marking saved:", data);

      // Use optimized WebSocket submission if available
      await submitMarksOptimized(data);

      toast.success("Marks submitted successfully!", {
        duration: 2000,
        position: "top-center",
      });

      setIsMarkingOpen(false);
    } catch (error) {
      console.error("Failed to submit marks:", error);
      toast.error("Failed to submit marks. Please try again.");
    }
  };

  // Connection status indicator component
  const ConnectionStatus = () => {
    if (!allFiltersSelected) return null;

    return (
      <RealTimeStatus
        isConnected={wsConnected}
        isOnline={isOnline}
        lastUpdate={lastFetchTime}
        dataSource={dataSource}
        reconnectAttempts={metrics?.reconnectAttempts || 0}
        maxReconnectAttempts={5}
        showDetails={false}
        size="sm"
      />
    );
  };

  // --- SETUP VIEW ---
  if (!isInitialized) {
    return (
      <div className="flex flex-col h-screen bg-slate-50 font-sans">
        {/* Show Navbar, but empty center */}
        <div className="shrink-0 z-30">
          <Navbar />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 -mt-16">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center animate-slideUp">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
              <FunnelIcon className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Welcome, Professor
            </h1>
            <p className="text-slate-500 mb-8">
              Please select your dashboard parameters to begin real-time
              monitoring.
            </p>

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Academic Year
                </label>
                <select
                  value={filters.year}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, year: e.target.value }))
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                  disabled={loadingFilters}
                >
                  <option value="">Select Year</option>
                  {filterOptions.years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  School
                </label>
                <select
                  value={filters.school}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, school: e.target.value }))
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                  disabled={loadingFilters}
                >
                  <option value="">Select School</option>
                  {filterOptions.schools.map((school) => (
                    <option key={school} value={school}>
                      {school}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Program
                </label>
                <select
                  value={filters.program}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, program: e.target.value }))
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                  disabled={loadingFilters}
                >
                  <option value="">Select Program</option>
                  {filterOptions.programs.map((program) => (
                    <option key={program} value={program}>
                      {program}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Review Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, type: e.target.value }))
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                  disabled={loadingFilters}
                >
                  <option value="">Select Type</option>
                  {filterOptions.types.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => setIsInitialized(true)}
              disabled={
                !filters.year ||
                !filters.school ||
                !filters.program ||
                !filters.type
              }
              className="w-full mt-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-200 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loadingFilters ? (
                <>Loading Options...</>
              ) : (
                <>
                  Load Real-time Dashboard{" "}
                  <ArrowRightIcon className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD VIEW (Normal) ---

  // Define Filter Component to pass to Navbar (Compact Mode) with WebSocket status
  const FilterBar = (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
        <div className="flex items-center px-2 text-slate-400 gap-1 text-xs font-bold uppercase tracking-wide">
          <FunnelIcon className="w-3 h-3" /> Filter
        </div>
        <div className="h-4 w-px bg-slate-200 mx-1"></div>

        {/* Year Filter */}
        <div className="relative group">
          <select
            value={filters.year}
            onChange={(e) =>
              setFilters((f) => ({ ...f, year: e.target.value }))
            }
            className="pl-2 pr-6 py-1 bg-transparent text-sm font-medium text-slate-700 focus:ring-0 border-none outline-none cursor-pointer hover:text-blue-600 transition-colors appearance-none"
          >
            {filterOptions.years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="h-4 w-px bg-slate-200"></div>

        {/* School Filter */}
        <div className="relative group">
          <select
            value={filters.school}
            onChange={(e) =>
              setFilters((f) => ({ ...f, school: e.target.value }))
            }
            className="pl-2 pr-6 py-1 bg-transparent text-sm font-medium text-slate-700 focus:ring-0 border-none outline-none cursor-pointer hover:text-blue-600 transition-colors appearance-none"
          >
            {filterOptions.schools.map((school) => (
              <option key={school} value={school}>
                {school}
              </option>
            ))}
          </select>
        </div>

        <div className="h-4 w-px bg-slate-200"></div>

        {/* Program Filter */}
        <div className="relative">
          <select
            value={filters.program}
            onChange={(e) =>
              setFilters((f) => ({ ...f, program: e.target.value }))
            }
            className="pl-2 pr-6 py-1 bg-transparent text-sm font-medium text-slate-700 focus:ring-0 border-none outline-none cursor-pointer hover:text-blue-600 transition-colors appearance-none"
          >
            {filterOptions.programs.map((program) => (
              <option key={program} value={program}>
                {program}
              </option>
            ))}
          </select>
        </div>

        <div className="h-4 w-px bg-slate-200"></div>

        {/* Type Filter */}
        <div className="relative">
          <select
            value={filters.type}
            onChange={(e) =>
              setFilters((f) => ({ ...f, type: e.target.value }))
            }
            className="pl-2 pr-6 py-1 bg-transparent text-sm font-bold text-blue-700 focus:ring-0 border-none outline-none cursor-pointer hover:text-blue-800 transition-colors appearance-none"
          >
            {filterOptions.types.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Connection Status */}
      <ConnectionStatus />

      {/* Debug toggle for development */}
      {import.meta.env.DEV && (
        <button
          onClick={() => setShowDebugPanel(!showDebugPanel)}
          className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
          title="Toggle Debug Panel"
        >
          🐛 Debug
        </button>
      )}
    </div>
  );

  if (loading && !isReady) {
    return (
      <div className="flex flex-col h-screen bg-slate-50">
        <div className="shrink-0 z-30">
          <Navbar />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner message="Establishing real-time connection..." />
        </div>
      </div>
    );
  }

  if (error && !isReady) {
    return (
      <div className="flex flex-col h-screen bg-slate-50">
        <div className="shrink-0 z-30">
          <Navbar />
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-red-500 mb-4">⚠️ Connection Error</div>
            <p className="text-slate-600 mb-4">{error}</p>
            <button
              onClick={refetch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!allFiltersSelected) {
    return (
      <div className="flex flex-col h-screen bg-slate-50">
        <div className="shrink-0 z-30">
          <Navbar />
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white rounded-xl p-8 text-center border border-gray-200 shadow-sm">
            <FunnelIcon className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Complete All Filters
            </h3>
            <p className="text-gray-600 text-sm">
              Select all filters to view real-time reviews
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      {/* 1. MERGED HEADER (Navbar + Filters) */}
      <div className="shrink-0 z-30">
        <Navbar centerContent={FilterBar} />
      </div>

      {/* 2. SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 pb-32">
        {/* Performance Debug Info (Development Only) */}
        {import.meta.env.DEV &&
          import.meta.env.VITE_SHOW_PERFORMANCE_METRICS === "true" &&
          metrics && (
            <div className="text-xs text-slate-500 bg-slate-100 p-2 rounded">
              Cache: {metrics.cacheSize} | WS:{" "}
              {wsConnected ? "Connected" : "Disconnected"} | Source:{" "}
              {dataSource} | Queue: {metrics.queueSize} | Last:{" "}
              {lastFetchTime
                ? new Date(lastFetchTime).toLocaleTimeString()
                : "Never"}
            </div>
          )}

        {/* Active Reviews (Always Open) */}
        <section className="animate-slideUp">
          <ActiveReviewsSection
            reviews={active || []}
            onEnterMarks={(review, team) => handleEnterMarks(review, team)}
          />
        </section>

        {/* Collapsible Sections */}
        <section className="space-y-6 animate-slideUp delay-100">
          <DeadlinePassedSection
            reviews={deadlinePassed || []}
            onEnterMarks={handleEnterMarks}
          />

          <PastReviewsSection
            reviews={past || []}
            onEnterMarks={handleEnterMarks}
          />
        </section>
      </div>

      {/* MARKING MODAL */}
      {isMarkingOpen && (
        <MarkEntryModal
          isOpen={isMarkingOpen}
          onClose={() => setIsMarkingOpen(false)}
          review={currentReview}
          team={currentTeam}
          onSuccess={handleMarkingSuccess}
        />
      )}

      {/* Performance Debug Panel */}
      {import.meta.env.DEV && (
        <PerformanceDebug
          wsStats={metrics}
          isVisible={showDebugPanel}
          onClose={() => setShowDebugPanel(false)}
          position="bottom-right"
          enableAutoHide={false}
        />
      )}

      {/* Production Performance Monitor */}
      {!import.meta.env.DEV && <ProductionPerformanceMonitor />}
    </div>
  );
};

export default FacultyDashboard;
