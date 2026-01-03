const renderTeamMembers = (teamMembers) => {
  if (!Array.isArray(teamMembers) || teamMembers.length === 0) {
    return <span className="text-gray-400 italic">No members</span>;
  }

  const memberList = teamMembers
    .map(m => m.regNo || m.registrationNumber || m.id || m.studentId || m.rollNo || 'Unknown')
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-1">
      <div>{memberList}</div>
      <div className="text-xs text-gray-500">
        ({teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''})
      </div>
    </div>
  );
};

export default renderTeamMembers