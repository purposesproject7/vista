import React from "react";
import { DocumentMagnifyingGlassIcon } from "@heroicons/react/24/outline";
import TitleAbstractReviewSection from "./TitleAbstractReviewSection";

// Statuses where the guide has something to look at: awaiting their decision,
// or auto-rejected by the content check (so they can see why).
const NEEDS_GUIDE = ["pending_review", "rejected"];

/**
 * Always-visible list of guided teams whose title/abstract needs the guide,
 * with the similarity score, closest matches and Accept & Lock. (The same
 * details also appear in the collapsed "My Guided Teams" cards.)
 */
const TitleAbstractApprovals = ({ guideAssignments = [], onAccepted }) => {
  const teams = guideAssignments
    .filter((p) => NEEDS_GUIDE.includes(p.titleAbstractStatus))
    // Waiting on the guide first, then auto-rejected.
    .sort((a, b) => NEEDS_GUIDE.indexOf(a.titleAbstractStatus) - NEEDS_GUIDE.indexOf(b.titleAbstractStatus));

  if (teams.length === 0) return null;
  const pending = teams.filter((p) => p.titleAbstractStatus === "pending_review").length;

  return (
    <section className="animate-slideUp mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
          <DocumentMagnifyingGlassIcon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Title &amp; Abstract Reviews</h2>
          <p className="text-sm text-gray-500">
            Check each submission's similarity to existing and commonly done projects, then accept to lock it.
          </p>
        </div>
        {pending > 0 && (
          <span className="ml-auto bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">
            {pending} Awaiting review
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teams.map((project) => (
          <div key={project._id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 truncate" title={project.name}>
              {project.name}
            </h3>
            <p className="text-xs text-slate-500">
              {project.students?.map((s) => s.name).join(", ")}
            </p>
            <TitleAbstractReviewSection project={project} onAccepted={onAccepted} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default TitleAbstractApprovals;
