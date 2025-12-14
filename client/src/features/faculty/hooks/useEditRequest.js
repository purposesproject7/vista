import { useState } from 'react';

export const useEditRequest = () => {
  const [requesting, setRequesting] = useState(false);

  const requestEdit = async (reviewId, teamId, reason) => {
    setRequesting(true);
    
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/faculty/edit-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          teamId,
          reason
        })
      });

      if (!response.ok) throw new Error('Request failed');

      return { success: true, message: 'Edit request submitted' };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setRequesting(false);
    }
  };

  return {
    requestEdit,
    requesting
  };
};
