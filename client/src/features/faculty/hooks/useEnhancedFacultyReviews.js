// src/features/faculty/hooks/useEnhancedFacultyReviews.js
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { isDeadlinePassed, isReviewActive } from '../../../shared/utils/dateHelpers';
import { adaptReviewData } from '../services/facultyAdapter';
import { MOCK_REVIEWS } from '../../../shared/utils/mockData';
import { useFacultyWebSocket } from './useFacultyWebSocket';

// Configuration for potato device optimization
const OPTIMIZATION_CONFIG = {
  maxRetries: 3,
  retryDelay: 2000,
  cacheTimeout: 30000, // 30 seconds
  fallbackTimeout: 5000,
  maxConcurrentRequests: 2,
  enableOfflineMode: true,
  compressionThreshold: 1024
};

export const useEnhancedFacultyReviews = (filters) => {
  // State management
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dataSource, setDataSource] = useState('initial'); // 'initial', 'api', 'websocket', 'cache'

  // Refs for optimization
  const apiCacheRef = useRef(new Map());
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef(null);
  const fetchTimeoutRef = useRef(null);

  // WebSocket integration
  const {
    isConnected: wsConnected,
    realTimeData,
    loading: wsLoading,
    requestData,
    submitMarks,
    lastUpdate,
    stats: wsStats
  } = useFacultyWebSocket(filters);

  // Check if all required filters are selected
  const allFiltersSelected = useMemo(() => {
    return filters?.year && filters?.school && filters?.programme && filters?.type;
  }, [filters]);

  // Generate cache key for API responses
  const getCacheKey = useCallback((currentFilters) => {
    if (!currentFilters) return null;
    return `faculty_reviews_${JSON.stringify(currentFilters)}`;
  }, []);

  // Check if cached data is still valid
  const isCacheValid = useCallback((cacheEntry) => {
    if (!cacheEntry) return false;
    const now = Date.now();
    return (now - cacheEntry.timestamp) < OPTIMIZATION_CONFIG.cacheTimeout;
  }, []);

  // Fetch data from API with optimizations
  const fetchFromAPI = useCallback(async (currentFilters) => {
    if (!allFiltersSelected) return null;

    // Check cache first
    const cacheKey = getCacheKey(currentFilters);
    const cachedData = apiCacheRef.current.get(cacheKey);

    if (isCacheValid(cachedData)) {
      console.log('[Faculty Reviews] Using cached API data');
      setDataSource('cache');
      return cachedData.data;
    }

    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      // Simulate API call with timeout for potato devices
      const timeoutPromise = new Promise((_, reject) => {
        fetchTimeoutRef.current = setTimeout(() => {
          reject(new Error('Request timeout'));
        }, OPTIMIZATION_CONFIG.fallbackTimeout);
      });

      const apiPromise = new Promise(resolve => {
        setTimeout(() => {
          // Filter mock reviews by type (guide/panel)
          const filteredReviews = MOCK_REVIEWS.filter(r => r.review_type === currentFilters.type);

          // Adapt backend data to frontend structure
          const adaptedReviews = filteredReviews.map(adaptReviewData);
          resolve(adaptedReviews);
        }, 300); // Simulate network delay
      });

      const result = await Promise.race([apiPromise, timeoutPromise]);

      // Clear timeout
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }

      // Cache the successful result
      apiCacheRef.current.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      // Limit cache size for memory optimization
      if (apiCacheRef.current.size > 20) {
        const oldestKey = apiCacheRef.current.keys().next().value;
        apiCacheRef.current.delete(oldestKey);
      }

      retryCountRef.current = 0;
      setDataSource('api');
      console.log('[Faculty Reviews] Fetched fresh data from API');

      return result;

    } catch (err) {
      console.error('[Faculty Reviews] API fetch failed:', err.message);

      // Try to use expired cache as fallback
      if (cachedData) {
        console.log('[Faculty Reviews] Using expired cache as fallback');
        setDataSource('cache');
        return cachedData.data;
      }

      // Retry logic for potato devices
      if (retryCountRef.current < OPTIMIZATION_CONFIG.maxRetries && err.name !== 'AbortError') {
        retryCountRef.current++;
        console.log(`[Faculty Reviews] Retrying API fetch (${retryCountRef.current}/${OPTIMIZATION_CONFIG.maxRetries})`);

        await new Promise(resolve =>
          setTimeout(resolve, OPTIMIZATION_CONFIG.retryDelay * retryCountRef.current)
        );

        return fetchFromAPI(currentFilters);
      }

      throw err;
    } finally {
      setLoading(false);
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    }
  }, [allFiltersSelected, getCacheKey, isCacheValid]);

  // Handle WebSocket real-time updates
  useEffect(() => {
    if (!realTimeData || !wsConnected) return;

    console.log('[Faculty Reviews] Received WebSocket update');
    setReviews(realTimeData.reviews || []);
    setDataSource('websocket');
    setLastFetchTime(lastUpdate);
    setError(null);
  }, [realTimeData, wsConnected, lastUpdate]);

  // Initial data fetch and filter changes
  useEffect(() => {
    if (!allFiltersSelected) {
      setReviews([]);
      setError(null);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // If WebSocket is connected, request data through it first
        if (wsConnected && !wsLoading) {
          console.log('[Faculty Reviews] Requesting data via WebSocket');
          requestData();
          setDataSource('websocket');
          return;
        }

        // Fallback to API
        console.log('[Faculty Reviews] Fetching data via API');
        const data = await fetchFromAPI(filters);
        if (data) {
          setReviews(data);
          setLastFetchTime(Date.now());
        }
      } catch (err) {
        console.error('[Faculty Reviews] Data fetch failed:', err.message);
        setError(err.message);

        // Try to show any available cached data
        const cacheKey = getCacheKey(filters);
        const cachedData = apiCacheRef.current.get(cacheKey);
        if (cachedData) {
          console.log('[Faculty Reviews] Showing cached data despite error');
          setReviews(cachedData.data);
          setDataSource('cache');
        }
      }
    };

    fetchData();
  }, [allFiltersSelected, filters, wsConnected, wsLoading, requestData, fetchFromAPI, getCacheKey]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Refetch when coming back online
      if (allFiltersSelected) {
        fetchFromAPI(filters);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [allFiltersSelected, filters, fetchFromAPI]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // Helper to check if all teams in a review are marked
  const isAllTeamsMarked = useCallback((review) => {
    if (!review.teams || review.teams.length === 0) return false;
    return review.teams.every(team => team.isMarked);
  }, []);

  // Categorize reviews with memoization for performance
  const categorizedReviews = useMemo(() => {
    return {
      active: reviews.filter(r => isReviewActive(r.startDate, r.endDate) && !isAllTeamsMarked(r)),
      deadlinePassed: reviews.filter(r => isDeadlinePassed(r.endDate) && !isAllTeamsMarked(r)),
      past: reviews.filter(r => isAllTeamsMarked(r))
    };
  }, [reviews, isAllTeamsMarked]);

  // Manual refetch function
  const refetch = useCallback(async () => {
    if (!allFiltersSelected) return;

    try {
      setError(null);

      // Clear cache to force fresh fetch
      const cacheKey = getCacheKey(filters);
      apiCacheRef.current.delete(cacheKey);

      // Try WebSocket first
      if (wsConnected) {
        console.log('[Faculty Reviews] Manual refetch via WebSocket');
        requestData();
      } else {
        // Fallback to API
        console.log('[Faculty Reviews] Manual refetch via API');
        const data = await fetchFromAPI(filters);
        if (data) {
          setReviews(data);
          setLastFetchTime(Date.now());
        }
      }
    } catch (err) {
      console.error('[Faculty Reviews] Manual refetch failed:', err.message);
      setError(err.message);
    }
  }, [allFiltersSelected, filters, wsConnected, requestData, fetchFromAPI, getCacheKey]);

  // Enhanced marks submission with real-time updates
  const submitMarksWithUpdate = useCallback(async (markData) => {
    try {
      // Try WebSocket first for real-time update
      if (wsConnected && submitMarks) {
        const success = submitMarks(markData);
        if (success) {
          console.log('[Faculty Reviews] Marks submitted via WebSocket');
          return true;
        }
      }

      // Fallback to API submission
      console.log('[Faculty Reviews] Submitting marks via API');
      // Here you would integrate with your actual API
      // await api.submitMarks(markData);

      // Trigger a refetch to update data
      setTimeout(refetch, 500); // Small delay to allow server processing

      return true;
    } catch (err) {
      console.error('[Faculty Reviews] Mark submission failed:', err.message);
      throw err;
    }
  }, [wsConnected, submitMarks, refetch]);

  // Performance metrics for debugging
  const getPerformanceMetrics = useCallback(() => {
    return {
      cacheSize: apiCacheRef.current.size,
      retryCount: retryCountRef.current,
      lastFetchTime,
      dataSource,
      isOnline,
      wsConnected,
      wsStats
    };
  }, [lastFetchTime, dataSource, isOnline, wsConnected, wsStats]);

  return {
    // Data
    ...categorizedReviews,
    reviews,

    // State
    loading: loading || wsLoading,
    error,
    isOnline,
    wsConnected,
    lastFetchTime,
    dataSource,

    // Actions
    refetch,
    submitMarks: submitMarksWithUpdate,

    // Performance
    metrics: getPerformanceMetrics(),

    // Status
    allFiltersSelected,
    isReady: !loading && !error && reviews.length >= 0
  };
};

export default useEnhancedFacultyReviews;
