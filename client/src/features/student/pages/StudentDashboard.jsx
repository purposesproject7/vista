import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useToast } from "../../../shared/hooks/useToast";
import Card from "../../../shared/components/Card";
import LoadingSpinner from "../../../shared/components/LoadingSpinner";
import Navbar from "../../../shared/components/Navbar";
import TitleAbstractForm from "../components/TitleAbstractForm";
import ConsensusStatus from "../components/ConsensusStatus";
import GuidePanelInfo from "../components/GuidePanelInfo";
import { getMyProject, getTitleAbstractStatus, submitTitleAbstract } from "../services/studentApi";

const EDITABLE_STATUSES = ["not_started", "pending_consensus", "discrepancy"];

const StudentDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [project, setProject] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [projectData, titleAbstractStatus] = await Promise.all([
        getMyProject(user.regNo),
        getTitleAbstractStatus(),
      ]);
      setProject(projectData);
      setStatusData(titleAbstractStatus);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Error loading your project details.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [user?.regNo, showToast]);

  useEffect(() => {
    if (user?.regNo) {
      loadData();
    }
  }, [user?.regNo, loadData]);

  const handleSubmit = async ({ title, abstract }) => {
    setSubmitting(true);
    try {
      const result = await submitTitleAbstract({ title, abstract });
      setStatusData((prev) => ({ ...prev, ...result, mySubmission: { title, abstract } }));
      showToast("Title and abstract submitted.", "success");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Error submitting title/abstract.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  const status = statusData?.status || "not_started";
  const showForm = EDITABLE_STATUSES.includes(status);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Welcome, {user?.name}
          </h1>
          <p className="text-sm text-gray-500">{user?.regNo}</p>
        </div>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Project Title & Abstract
          </h2>

          <ConsensusStatus
            status={status}
            waitingOn={statusData?.waitingOn}
            submissions={statusData?.submissions}
            proposedTitle={statusData?.proposedTitle || statusData?.title}
            proposedAbstract={statusData?.proposedAbstract || statusData?.abstract}
            contentCheck={statusData?.contentCheck}
            acceptedAt={statusData?.acceptedAt}
          />

          {showForm && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <TitleAbstractForm
                initialTitle={statusData?.mySubmission?.title || ""}
                initialAbstract={statusData?.mySubmission?.abstract || ""}
                onSubmit={handleSubmit}
                submitting={submitting}
              />
            </div>
          )}
        </Card>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your Guide & Panel
          </h2>
          <GuidePanelInfo project={project} />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
