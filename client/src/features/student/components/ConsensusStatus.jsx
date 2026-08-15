import React from "react";
import Badge from "../../../shared/components/Badge";
import Card from "../../../shared/components/Card";

const STATUS_LABELS = {
  not_started: { label: "Not Started", variant: "default" },
  pending_consensus: { label: "Waiting on Teammates", variant: "warning" },
  discrepancy: { label: "Discrepancy Found", variant: "danger" },
  consensus_reached: { label: "Consensus Reached", variant: "info" },
  pending_review: { label: "Pending Guide Review", variant: "info" },
  accepted: { label: "Accepted & Locked", variant: "success" },
};

const ConsensusStatus = ({ status, waitingOn, submissions, proposedTitle, proposedAbstract, contentCheck, acceptedAt }) => {
  const meta = STATUS_LABELS[status] || STATUS_LABELS.not_started;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Status:</span>
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </div>

      {status === "pending_consensus" && waitingOn?.length > 0 && (
        <Card padding="sm" className="bg-yellow-50 border-yellow-200">
          <p className="text-sm text-yellow-800">
            Waiting on: {waitingOn.map((s) => `${s.name} (${s.regNo})`).join(", ")}
          </p>
        </Card>
      )}

      {status === "discrepancy" && submissions?.length > 0 && (
        <Card padding="sm" className="bg-red-50 border-red-200">
          <p className="text-sm text-red-800 font-medium mb-2">
            Your team's submissions don't match. Please align with your teammates and
            resubmit the exact same title and abstract.
          </p>
          <div className="space-y-2 overflow-x-auto">
            {submissions.map((s) => (
              <div key={s.regNo} className="text-xs bg-white rounded border border-red-100 p-2">
                <p className="font-semibold text-gray-700">
                  {s.name} ({s.regNo})
                </p>
                <p className="text-gray-600 mt-1">
                  <span className="font-medium">Title:</span> {s.title}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(status === "pending_review" || status === "accepted") && (
        <Card padding="sm" className="space-y-2">
          <p className="text-sm font-semibold text-gray-900">{proposedTitle}</p>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{proposedAbstract}</p>

          {contentCheck && (
            <div className="pt-2 border-t border-gray-100 space-y-1">
              <p className="text-xs text-gray-500">
                Plagiarism Score:{" "}
                <span className="font-medium text-gray-700">
                  {contentCheck.plagiarismScore}%
                </span>
              </p>
              <p className="text-xs text-gray-500">
                AI-Generated Content Score:{" "}
                <span className="font-medium text-gray-700">{contentCheck.aiScore}%</span>
              </p>
              {contentCheck.flagged && (
                <p className="text-xs text-orange-600 font-medium">
                  ⚠ This submission has been flagged for your guide's attention.
                </p>
              )}
            </div>
          )}

          {status === "accepted" && (
            <p className="text-xs text-green-700 font-medium pt-2 border-t border-gray-100">
              Locked — accepted by your guide
              {acceptedAt ? ` on ${new Date(acceptedAt).toLocaleDateString()}` : ""}. This
              title and abstract can no longer be changed.
            </p>
          )}
          {status === "pending_review" && (
            <p className="text-xs text-blue-700 font-medium pt-2 border-t border-gray-100">
              Your team's submission is awaiting your guide's approval.
            </p>
          )}
        </Card>
      )}
    </div>
  );
};

export default ConsensusStatus;
