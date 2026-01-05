const renderTeamMembers = (teamMembers) => { /* here teamMembers is Faculty Id*/
  if (!Array.isArray(teamMembers) || teamMembers.length === 0) {
    return <span className="text-gray-400 italic">No members</span>;
  }

  const memberList = teamMembers
    .map(m => m || m.currentFacultyId || 'Unknown')
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