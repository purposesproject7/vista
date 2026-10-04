import React, { useState } from "react";
import Badge from "../../../shared/components/Badge";
import Button from "../../../shared/components/Button";
import { useToast } from "../../../shared/hooks/useToast";
import { acceptTitleAbstract } from "../services/facultyApi";

// Plagiarism/AI scores are null when the program has those checks turned off.
function scoreLine(c) {
  const parts = [];
  if (c.plagiarismScore != null) parts.push(`Plagiarism: ${c.plagiarismScore}%`, `AI Content: ${c.aiScore}%`);
  if (c.similarityScore != null) parts.push(`Similarity: ${c.similarityScore}%`);
  return parts.join(" · ") || "Not checked";
}

// Why a submission was flagged or rejected, from what the content check stored.
// Matches against the common-project baseline come back labelled "Common project".
function checkReason(c) {
  const top = c?.similarProjects?.[0];
  if (top && c.similarityScore != null && top.score === c.similarityScore) {
    return top.academicYear === "Common project"
      ? `It closely matches a commonly done project ("${top.title}", ${top.score}%). Check the team's plan is their own work.`
      : `It closely matches an approved project ("${top.title}", ${top.score}%).`;
  }
  if (c?.plagiarismScore != null) return "Its plagiarism / AI-generated content score exceeds this program's threshold.";
  return "It exceeds the content check threshold.";
}

const STATUS_LABELS = {
  not_started: { label: "Not Started", variant: "default" },
  pending_consensus: { label: "Waiting on Students", variant: "warning" },
  discrepancy: { label: "Discrepancy Among Students", variant: "danger" },
  consensus_reached: { label: "Consensus Reached", variant: "info" },
  rejected: { label: "Auto-Rejected", variant: "danger" },
  pending_review: { label: "Pending Your Review", variant: "info" },
  accepted: { label: "Accepted & Locked", variant: "success" },
};

const SimilarProjects = ({ contentCheck }) =>
  contentCheck?.similarProjects?.length > 0 && (
    <div className="text-xs text-gray-600">
      <p>Most similar existing projects:</p>
      <ul className="list-disc pl-4">
        {contentCheck.similarProjects.map((p) => (
          <li key={p.project || p.title}>
            {p.title}
            {p.academicYear ? ` (${p.academicYear})` : ""} — {p.score}%
          </li>
        ))}
      </ul>
    </div>
  );

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

      {status === "rejected" && (
        <div className="text-xs text-red-600 space-y-1">
          <p>
            The team's submission was automatically rejected and never reached
            your review queue. {checkReason(project.contentCheck)} Students must
            revise and resubmit.
          </p>
          {project.contentCheck && (
            <p className="text-gray-600">
              {scoreLine(project.contentCheck)}
            </p>
          )}
          <SimilarProjects contentCheck={project.contentCheck} />
        </div>
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
                {scoreLine(project.contentCheck)}
              </p>
              <SimilarProjects contentCheck={project.contentCheck} />
              {project.contentCheck.flagged && (
                <p className="text-xs text-orange-600 font-medium">
                  ⚠ Flagged: {checkReason(project.contentCheck)}
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
