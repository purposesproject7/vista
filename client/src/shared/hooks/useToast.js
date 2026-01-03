// src/shared/hooks/useToast.js
import { useCallback } from 'react';

export const useToast = () => {
  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    // Simple implementation using console for now
    // TODO: Implement proper toast notifications
    if (type === 'error') {
      console.error(message);
      // Show error in a more user-friendly way
      if (typeof window !== 'undefined') {
        // Could use a toast library here
        alert(message);
      }
    } else if (type === 'success') {
      console.log(message);
    } else {
      console.info(message);
    }
  }, []);

  return {
    showToast
  };
};
