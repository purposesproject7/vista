import React from "react";
import Card from "../../../shared/components/Card";

const GuidePanelInfo = ({ project }) => {
  if (!project) return null;

  const guide = project.guideFaculty;
  const panelMembers = project.panel?.members || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Guide</h3>
        {guide ? (
          <div className="space-y-1 text-sm text-gray-600">
            <p className="font-medium text-gray-900">{guide.name}</p>
            <p>{guide.emailId}</p>
            {guide.employeeId && <p>Employee ID: {guide.employeeId}</p>}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Not yet assigned</p>
        )}
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Panel</h3>
        {panelMembers.length > 0 ? (
          <ul className="space-y-1 text-sm text-gray-600">
            {panelMembers.map((m, idx) => (
              <li key={m.faculty?._id || idx}>
                {m.faculty?.name}
                {m.faculty?.employeeId ? ` (${m.faculty.employeeId})` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">Not yet assigned</p>
        )}
      </Card>
    </div>
  );
};

export default GuidePanelInfo;
