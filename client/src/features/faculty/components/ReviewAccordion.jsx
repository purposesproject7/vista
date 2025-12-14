// src/features/faculty/components/ReviewAccordion.jsx - REPLACE ENTIRE FILE
import React from 'react';
import Accordion from '../../../shared/components/Accordion';
import Badge from '../../../shared/components/Badge';
import TeamCard from './TeamCard';
import { formatDate } from '../../../shared/utils/dateHelpers';

const ReviewAccordion = ({ review, onEnterMarks, showEditRequest = false }) => {
  const markedCount = review.teams?.filter(t => t.isMarked).length || 0;
  const totalTeams = review.teams?.length || 0;
  
  const badge = (
    <Badge variant={markedCount === totalTeams ? 'success' : 'info'}>
      {markedCount}/{totalTeams} Teams
    </Badge>
  );

  const subtitle = `Deadline: ${formatDate(review.endDate)}`;

  return (
    <Accordion
      title={review.name}
      subtitle={subtitle}
      badge={badge}
      className="mb-3"
    >
      {review.teams && review.teams.length > 0 ? (
        <div className="space-y-2">
          {review.teams.map(team => (
            <TeamCard 
              key={team.id} 
              team={team}
              review={review}
              onEnterMarks={onEnterMarks}
              showEditRequest={showEditRequest}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No teams assigned</p>
      )}
    </Accordion>
  );
};

export default ReviewAccordion;
