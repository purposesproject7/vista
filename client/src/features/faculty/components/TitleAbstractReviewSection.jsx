import React, { useState } from "react";
import Badge from "../../../shared/components/Badge";
import Button from "../../../shared/components/Button";
import { useToast } from "../../../shared/hooks/useToast";
import { acceptTitleAbstract } from "../services/facultyApi";

const STATUS_LABELS = {
  not_started: { label: "Not Started", variant: "default" },
  pending_consensus: { label: "Waiting on Students", variant: "warning" },
  discrepancy: { label: "Discrepancy Among Students", variant: "danger" },
  consensus_reached: { label: "Consensus Reached", variant: "info" },
  pending_review: { label: "Pending Your Review", variant: "info" },
  accepted: { label: "Accepted & Locked", variant: "success" },
};

const TitleAbstractReviewSection = ({ project, onAccepted }) => {
  const [accepting, setAccepting] = useState(false);
  const { showToast } = useToast();

  const status = project.titleAbstractStatus || "not_started";
  const meta = STATUS_LABELS[status] || STATUS_LABELS.not_started;

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const response = await acceptTitleAbstract(project._id);
      showToast("Title and abstract accepted and locked.", "success");
      onAccepted?.(response.data);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Error accepting title/abstract.",
        "error"
      );
    } finally {
      setAccepting(false);
    }
  };

  if (status === "not_started" || status === "pending_consensus") {
    return (
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">
            Title/Abstract:
          </span>
          <Badge variant={meta.variant} size="sm">
            {meta.label}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">
          Title/Abstract:
        </span>
        <Badge variant={meta.variant} size="sm">
          {meta.label}
        </Badge>
      </div>

      {status === "discrepancy" && (
        <p className="text-xs text-red-600">
          Students on this team submitted mismatched titles/abstracts and need
          to resubmit matching content before you can review.
        </p>
      )}

      {(status === "pending_review" || status === "accepted") && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <p className="text-sm font-semibold text-gray-900">
            {project.proposedTitle || project.name}
          </p>
          <p className="text-xs text-gray-600 whitespace-pre-wrap line-clamp-4">
            {project.proposedAbstract || project.abstract}
          </p>

          {project.contentCheck && (
            <div className="pt-2 border-t border-gray-200 space-y-1">
              <p className="text-xs text-gray-500">
                Plagiarism: {project.contentCheck.plagiarismScore}% &middot; AI
                Content: {project.contentCheck.aiScore}%
              </p>
              {project.contentCheck.flagged && (
                <p className="text-xs text-orange-600 font-medium">
                  ⚠ Flagged for review — scores exceed the configured
                  threshold for this program.
                </p>
              )}
            </div>
          )}

          {status === "pending_review" && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleAccept}
              disabled={accepting}
              className="w-full"
            >
              {accepting ? "Accepting..." : "Accept & Lock"}
            </Button>
          )}

          {status === "accepted" && (
            <p className="text-xs text-green-700 font-medium">
              Locked
              {project.titleAbstractAcceptedAt
                ? ` on ${new Date(
                    project.titleAbstractAcceptedAt
                  ).toLocaleDateString()}`
                : ""}
              . Students can no longer edit this.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TitleAbstractReviewSection;
