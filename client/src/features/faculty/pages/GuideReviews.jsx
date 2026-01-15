import React, { useState } from "react";
import Navbar from "../../../shared/components/Navbar";
import ReviewCard from "../components/ReviewCard";
import AddReviewModal from "../components/AddReviewModal";
// import { useFacultyReviews } from '../hooks/useFacultyReviews'; // Hook might need 'filters'
import { PlusIcon } from "@heroicons/react/24/solid";
import { createReview, getFacultyReviews } from "../services/facultyApi";
import { useAuth } from "../../../shared/hooks/useAuth";

const GuideReviews = () => {
  const { user } = useAuth(); // Assuming useAuth provides current user details (academicYear, schools etc)
  // For now, I'll extract context from user or hardcode/select if needed.
  // The user hook usually has user.facultyDetails or similar.
  // Let's assume user object has the context for now.

  // Use local state for reviews list instead of useFacultyReviews hook if that hook is tightly coupled with filters
  // OR adapt the page to use filters.
  // The UI image doesn't show complex filters, just "Guide Reviews".
  // I will fetch all reviews for this guide.

  const [reviews, setReviews] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initial fetch
  React.useEffect(() => {
    const fetch = async () => {
      try {
        // Fetch all reviews without filters? or use defaults?
        // The backend service I wrote calls /faculty/reviews.
        const data = await getFacultyReviews();
        // Client side filter for "Guide" if needed, but backend should handle "my reviews"
        setReviews(data || []);
      } catch (e) {
        console.error("Error loading reviews", e);
      }
    };
    fetch();
  }, []);

  const handleCreateReview = async (reviewData) => {
    try {
      // Enrich data with context
      const payload = {
        ...reviewData,
        reviewType: "Review", // or whatever the backend expects
        facultyType: "guide",
        // academicYear, school, etc.
      };
      await createReview(payload);
      // Refresh list
      const data = await getFacultyReviews();
      setReviews(data || []);
    } catch (e) {
      console.error("Error creating review", e);
      alert("Failed to create review");
    }
  };

  const totalMarks = reviews.reduce((sum, r) => sum + (r.totalMarks || 0), 0); // Logic might vary

  // For Component Library Context, we need academicYear, school, department.
  // We'll try to get these from user profile or last review.
  // Fallback to empty string which might fail library fetch if strict.
  const academicContext = {
    academicYear: user?.academicYear || "2023-2024",
    school: user?.school || "SCOPE",
    department: user?.department || "CSE", // Adjust based on real user object
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-8 text-white flex items-center justify-between shadow-lg">
          <div>
            <h1 className="text-3xl font-bold mb-2">Guide Reviews</h1>
            <div className="flex items-center gap-4 text-blue-100">
              <span className="font-medium">{reviews.length} reviews</span>
              <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
              {/* <span className="font-medium bg-white/20 px-2 py-0.5 rounded-md text-sm">{totalMarks} marks</span> */}
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm"
          >
            <PlusIcon className="w-5 h-5" />
            Add Review
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}

          {reviews.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-500 text-lg">
                No reviews found. Click "Add Review" to start.
              </p>
            </div>
          )}
        </div>
      </div>

      <AddReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateReview}
        academicContext={academicContext}
      />
    </div>
  );
};

export default GuideReviews;
