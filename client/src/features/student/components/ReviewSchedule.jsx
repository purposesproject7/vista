import React from "react";
import { CalendarDaysIcon, MapPinIcon } from "@heroicons/react/24/outline";
import Card from "../../../shared/components/Card";
import { formatDate } from "../../../shared/utils/dateHelpers";

/** When and where each of the team's reviews happens. */
const ReviewSchedule = ({ reviews = [] }) => {
  if (reviews.length === 0) return null;

  return (
    <Card>
      <ul className="divide-y divide-gray-100">
        {reviews.map((r) => {
          const withGuide = r.facultyType === "guide";
          return (
            <li key={r.reviewName} className="py-3 first:pt-0 last:pb-0">
              <p className="font-medium text-gray-900">{r.displayName || r.reviewName}</p>
              <div className="mt-1 space-y-1 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <CalendarDaysIcon className="w-4 h-4 shrink-0 text-gray-400" />
                  {r.dateTime
                    ? formatDate(r.dateTime)
                    : r.window?.from && r.window?.to
                      ? `Between ${formatDate(r.window.from)} and ${formatDate(r.window.to)}${withGuide ? "" : " (slot not yet scheduled)"}`
                      : "Not yet scheduled"}
                </p>
                <p className="flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4 shrink-0 text-gray-400" />
                  {withGuide ? "With your guide" : r.venue || "Venue not yet announced"}
                  {!withGuide && r.panelName && <span className="text-gray-400">· {r.panelName}</span>}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};

export default ReviewSchedule;
