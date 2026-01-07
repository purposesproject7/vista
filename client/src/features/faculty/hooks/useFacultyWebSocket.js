// src/features/faculty/hooks/useFacultyWebSocket.js
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../../../shared/stores/authStore';

const SOCKET_CONFIG = {
  transports: ['websocket', 'polling'],
  upgrade: true,
  rememberUpgrade: true,
  timeout: 20000,
  forceNew: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  maxReconnectionAttempts: 5,
  randomizationFactor: 0.5,
};

// Optimized for potato devices
const POTATO_CONFIG = {
  maxUpdateFrequency: 2000, // Max one update every 2 seconds
  debounceDelay: 500,
  compressionThreshold: 1024,
  maxCacheSize: 50,
  heartbeatInterval: 30000,
  cleanupInterval: 300000, // 5 minutes
};

export const useFacultyWebSocket = (filters, options = {}) => {
  const { user, token } = useAuthStore();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [realTimeData, setRealTimeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Refs for optimization
  const lastUpdateTimeRef = useRef(0);
  const updateQueueRef = useRef([]);
  const debounceTimerRef = useRef(null);
  const cacheRef = useRef(new Map());
  const roomKeyRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const cleanupTimerRef = useRef(null);

  // Memoized server URL
  const serverUrl = useMemo(() => {
    return import.meta.env.VITE_SOCKET_URL ||
           import.meta.env.VITE_API_URL?.replace('/api', '') ||
           'http://localhost:5000';
  }, []);

  // Generate room key for faculty data
  const generateRoomKey = useCallback((facultyId, currentFilters) => {
    const filterString = JSON.stringify(currentFilters);
    return `faculty_${facultyId}_${btoa(filterString).slice(0, 10)}`;
  }, []);

  // Debounced update handler for potato optimization
  const debouncedUpdateHandler = useCallback((updateData) => {
    const now = Date.now();

    // Rate limiting - don't update too frequently
    if (now - lastUpdateTimeRef.current < POTATO_CONFIG.maxUpdateFrequency) {
      updateQueueRef.current.push(updateData);
      return;
    }

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      processQueuedUpdates();
      lastUpdateTimeRef.current = now;
    }, POTATO_CONFIG.debounceDelay);
  }, []);

  // Process queued updates efficiently
  const processQueuedUpdates = useCallback(() => {
    if (updateQueueRef.current.length === 0) return;

    // Merge all queued updates efficiently
    const mergedUpdate = updateQueueRef.current.reduce((acc, update) => {
      return { ...acc, ...update };
    }, {});

    setRealTimeData(prevData => {
      if (!prevData) return mergedUpdate;
      return mergeDataEfficiently(prevData, mergedUpdate);
    });

    setLastUpdate(Date.now());
    updateQueueRef.current = [];
  }, []);

  // Efficient data merging for potato devices
  const mergeDataEfficiently = useCallback((prevData, newData) => {
    // Use shallow merging for performance on low-end devices
    const merged = { ...prevData };

    if (newData.active) {
      merged.active = mergeArraysById(merged.active || [], newData.active);
    }
    if (newData.deadlinePassed) {
      merged.deadlinePassed = mergeArraysById(merged.deadlinePassed || [], newData.deadlinePassed);
    }
    if (newData.past) {
      merged.past = mergeArraysById(merged.past || [], newData.past);
    }
    if (newData.statistics) {
      merged.statistics = { ...merged.statistics, ...newData.statistics };
    }

    return merged;
  }, []);

  // Efficient array merging by ID
  const mergeArraysById = useCallback((existing, incoming) => {
    const existingMap = new Map(existing.map(item => [item.id, item]));

    incoming.forEach(item => {
      existingMap.set(item.id, { ...existingMap.get(item.id), ...item });
    });

    return Array.from(existingMap.values());
  }, []);

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (!user || !token) return;

    const socketInstance = io(serverUrl, {
      ...SOCKET_CONFIG,
      auth: { token },
      query: { facultyId: user._id }
    });

    setSocket(socketInstance);
    setConnectionError(null);

    return socketInstance;
  }, [serverUrl, user, token]);

  // Setup socket event handlers
  const setupSocketHandlers = useCallback((socketInstance) => {
    if (!socketInstance) return;

    socketInstance.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttemptsRef.current = 0;

      console.log('[WebSocket] Connected to faculty service');
    });

    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('[WebSocket] Disconnected:', reason);

      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        socketInstance.connect();
      }
    });

    socketInstance.on('connect_error', (error) => {
      setConnectionError(error.message);
      reconnectAttemptsRef.current++;

      console.error('[WebSocket] Connection error:', error.message);
    });

    socketInstance.on('connection_established', (data) => {
      console.log('[WebSocket] Connection established:', data);
    });

    socketInstance.on('real_time_update', (data) => {
      debouncedUpdateHandler(data);
    });

    socketInstance.on('data_response', (response) => {
      if (response.success) {
        setRealTimeData(response.data);
        setLastUpdate(response.timestamp);
        setLoading(false);

        // Cache the response for offline capability
        if (roomKeyRef.current) {
          cacheRef.current.set(roomKeyRef.current, {
            data: response.data,
            timestamp: response.timestamp,
            cached: response.cached
          });
        }
      } else {
        console.error('[WebSocket] Data request failed:', response.error);
        setLoading(false);
      }
    });

    socketInstance.on('room_joined', (data) => {
      console.log('[WebSocket] Joined room:', data.roomKey);
    });

    socketInstance.on('room_join_error', (error) => {
      console.error('[WebSocket] Failed to join room:', error.message);
    });

    // Heartbeat
    const heartbeatInterval = setInterval(() => {
      if (socketInstance.connected) {
        socketInstance.emit('ping');
      }
    }, POTATO_CONFIG.heartbeatInterval);

    return () => clearInterval(heartbeatInterval);
  }, [debouncedUpdateHandler]);

  // Join faculty room
  const joinRoom = useCallback((currentFilters) => {
    if (!socket || !socket.connected || !user) return;

    const roomKey = generateRoomKey(user._id, currentFilters);
    roomKeyRef.current = roomKey;

    // Check cache first for potato optimization
    const cached = cacheRef.current.get(roomKey);
    if (cached && Date.now() - cached.timestamp < 30000) { // 30 seconds cache
      setRealTimeData(cached.data);
      setLastUpdate(cached.timestamp);
    }

    socket.emit('join_faculty_room', { filters: currentFilters });
  }, [socket, user, generateRoomKey]);

  // Leave current room
  const leaveRoom = useCallback(() => {
    if (!socket || !roomKeyRef.current) return;

    socket.emit('leave_faculty_room', { roomKey: roomKeyRef.current });
    roomKeyRef.current = null;
  }, [socket]);

  // Request fresh data
  const requestData = useCallback(() => {
    if (!socket || !socket.connected || !roomKeyRef.current) {
      return;
    }

    setLoading(true);

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    socket.emit('request_faculty_data', {
      roomKey: roomKeyRef.current,
      requestId
    });
  }, [socket]);

  // Submit marks with real-time broadcast
  const submitMarks = useCallback((markData) => {
    if (!socket || !socket.connected) {
      console.error('[WebSocket] Cannot submit marks - not connected');
      return false;
    }

    socket.emit('mark_submission', markData);
    return true;
  }, [socket]);

  // Memory cleanup for potato devices
  const performCleanup = useCallback(() => {
    const now = Date.now();
    const maxAge = 600000; // 10 minutes

    // Clean old cache entries
    for (const [key, value] of cacheRef.current.entries()) {
      if (now - value.timestamp > maxAge) {
        cacheRef.current.delete(key);
      }
    }

    // Limit cache size
    if (cacheRef.current.size > POTATO_CONFIG.maxCacheSize) {
      const entries = Array.from(cacheRef.current.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);

      cacheRef.current.clear();
      entries.slice(0, POTATO_CONFIG.maxCacheSize).forEach(([key, value]) => {
        cacheRef.current.set(key, value);
      });
    }
  }, []);

  // Initialize connection
  useEffect(() => {
    if (!user || !token) return;

    const socketInstance = initializeSocket();
    if (!socketInstance) return;

    const cleanup = setupSocketHandlers(socketInstance);

    return () => {
      cleanup?.();
      socketInstance?.disconnect();
    };
  }, [user, token, initializeSocket, setupSocketHandlers]);

  // Handle filter changes
  useEffect(() => {
    if (!socket || !isConnected) return;

    const allFiltersSet = filters &&
      filters.year &&
      filters.school &&
      filters.programme &&
      filters.type;

    if (allFiltersSet) {
      leaveRoom();
      joinRoom(filters);
    }

    return leaveRoom;
  }, [socket, isConnected, filters, joinRoom, leaveRoom]);

  // Setup cleanup timer
  useEffect(() => {
    cleanupTimerRef.current = setInterval(performCleanup, POTATO_CONFIG.cleanupInterval);

    return () => {
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current);
      }
    };
  }, [performCleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current);
      }
      leaveRoom();
      socket?.disconnect();
    };
  }, [socket, leaveRoom]);

  return {
    socket,
    isConnected,
    connectionError,
    realTimeData,
    loading,
    lastUpdate,
    reconnectAttempts: reconnectAttemptsRef.current,

    // Actions
    requestData,
    submitMarks,

    // Status
    isReady: isConnected && realTimeData !== null,

    // Stats for debugging
    stats: {
      cacheSize: cacheRef.current.size,
      queueSize: updateQueueRef.current.length,
      lastUpdateTime: lastUpdateTimeRef.current
    }
  };
};

export default useFacultyWebSocket;
