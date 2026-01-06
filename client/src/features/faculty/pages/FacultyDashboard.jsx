// src/features/faculty/pages/FacultyDashboard.jsx - Light Mode
import React, { useState } from "react";
import FilterPanel from "../components/FilterPanel";
import StatisticsCard from "../components/StatisticsCard";
import ActiveReviewsSection from "../components/ActiveReviewsSection";
import DeadlinePassedSection from "../components/DeadlinePassedSection";
import PastReviewsSection from "../components/PastReviewsSection";
import MarkEntryModal from "../components/MarkEntryModal";
import Navbar from "../../../shared/components/Navbar";
import LoadingSpinner from "../../../shared/components/LoadingSpinner";
import { useFacultyReviews } from "../hooks/useFacultyReviews";
import { LockClosedIcon } from "@heroicons/react/24/outline";

const FacultyDashboard = () => {
  const [filters, setFilters] = useState({
    year: "",
    school: "",
    programme: "",
    type: "",
  });

  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { active, deadlinePassed, past, loading, error, refetch } =
    useFacultyReviews(filters);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleEnterMarks = (review, team) => {
    setSelectedReview(review);
    setSelectedTeam(team);
    setIsModalOpen(true);
  };

  const handleMarkSubmitSuccess = () => {
    refetch();
  };

  const allFiltersSelected =
    filters.year && filters.school && filters.programme && filters.type;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-4">
        <FilterPanel filters={filters} onFilterChange={handleFilterChange} />

        {!allFiltersSelected ? (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-200 shadow-sm">
            <LockClosedIcon className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Complete All Filters
            </h3>
            <p className="text-gray-600 text-sm">
              Select all four filters above to view reviews
            </p>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <LoadingSpinner message="Loading reviews..." />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <>
            <StatisticsCard
              active={active}
              deadlinePassed={deadlinePassed}
              past={past}
            />

            <div className="space-y-4">
              <ActiveReviewsSection
                reviews={active}
                onEnterMarks={(team) => {
                  const review = active.find((r) =>
                    r.teams?.some((t) => t.id === team.id)
                  );
                  handleEnterMarks(review, team);
                }}
              />

              <DeadlinePassedSection
                reviews={deadlinePassed}
                onEnterMarks={(team) => {
                  const review = deadlinePassed.find((r) =>
                    r.teams?.some((t) => t.id === team.id)
                  );
                  handleEnterMarks(review, team);
                }}
              />

              <PastReviewsSection reviews={past} />
            </div>
          </>
        )}
      </div>

      {selectedReview && selectedTeam && (
        <MarkEntryModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTeam(null);
            setSelectedReview(null);
          }}
          review={selectedReview}
          team={selectedTeam}
          onSuccess={handleMarkSubmitSuccess}
        />
      )}
    </div>
  );
};

export default FacultyDashboard;
