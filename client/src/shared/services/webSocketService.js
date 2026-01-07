// src/shared/services/webSocketService.js
import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.connectionCallbacks = new Set();
    this.disconnectionCallbacks = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.heartbeatInterval = null;
    this.compressionEnabled = true;

    // Potato device optimizations
    this.config = {
      maxEventListeners: 50,
      bufferSize: 1024,
      compressionThreshold: 512,
      heartbeatFrequency: 30000,
      connectionTimeout: 10000,
      maxConcurrentEvents: 3,
      enableBatching: true,
      batchDelay: 100
    };

    this.eventQueue = [];
    this.batchTimer = null;
    this.eventListenerCount = 0;
  }

  /**
   * Initialize WebSocket connection with optimizations
   */
  async connect(serverUrl, authToken, options = {}) {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return this.socket;
    }

    const socketConfig = {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: this.config.connectionTimeout,
      forceNew: false,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      auth: { token: authToken },
      compression: this.compressionEnabled,
      ...options
    };

    try {
      this.socket = io(serverUrl, socketConfig);
      this.setupEventHandlers();
      this.startHeartbeat();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, this.config.connectionTimeout);

        this.socket.once('connect', () => {
          clearTimeout(timeout);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('[WebSocket] Connected successfully');
          resolve(this.socket);
        });

        this.socket.once('connect_error', (error) => {
          clearTimeout(timeout);
          console.error('[WebSocket] Connection failed:', error.message);
          reject(error);
        });
      });

    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      throw error;
    }
  }

  /**
   * Setup optimized event handlers
   */
  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionCallbacks(true);
      console.log('[WebSocket] Connected to server');
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this.notifyConnectionCallbacks(false);
      console.log('[WebSocket] Disconnected:', reason);

      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.attemptReconnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
      this.attemptReconnection();
    });

    this.socket.on('pong', (data) => {
      // Handle heartbeat response
      this.lastPongTime = Date.now();
    });

    // Compression and batching for potato devices
    this.socket.on('compressed_data', (data) => {
      try {
        const decompressed = this.decompressData(data);
        this.processReceivedData(decompressed);
      } catch (error) {
        console.error('[WebSocket] Decompression failed:', error);
      }
    });
  }

  /**
   * Optimized event emission with batching
   */
  emit(eventName, data, options = {}) {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot emit - not connected');
      return false;
    }

    const eventData = {
      name: eventName,
      data: this.compressIfNeeded(data),
      timestamp: Date.now(),
      ...options
    };

    if (this.config.enableBatching && !options.immediate) {
      this.addToEventQueue(eventData);
    } else {
      this.socket.emit(eventName, eventData.data);
    }

    return true;
  }

  /**
   * Optimized event listener registration
   */
  on(eventName, callback, options = {}) {
    if (!this.socket) {
      console.warn('[WebSocket] Cannot add listener - socket not initialized');
      return;
    }

    if (this.eventListenerCount >= this.config.maxEventListeners) {
      console.warn('[WebSocket] Maximum event listeners reached');
      return;
    }

    const wrappedCallback = this.wrapCallbackForOptimization(callback, options);
    this.socket.on(eventName, wrappedCallback);
    this.eventListenerCount++;

    return () => {
      this.socket?.off(eventName, wrappedCallback);
      this.eventListenerCount--;
    };
  }

  /**
   * Remove event listener
   */
  off(eventName, callback) {
    if (this.socket) {
      this.socket.off(eventName, callback);
      this.eventListenerCount--;
    }
  }

  /**
   * Add event to queue for batching
   */
  addToEventQueue(eventData) {
    this.eventQueue.push(eventData);

    if (this.eventQueue.length >= this.config.maxConcurrentEvents || !this.batchTimer) {
      this.processBatchedEvents();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatchedEvents();
      }, this.config.batchDelay);
    }
  }

  /**
   * Process batched events for potato optimization
   */
  processBatchedEvents() {
    if (this.eventQueue.length === 0) return;

    const events = this.eventQueue.splice(0);

    if (events.length === 1) {
      // Single event
      const event = events[0];
      this.socket.emit(event.name, event.data);
    } else {
      // Batch multiple events
      this.socket.emit('batched_events', {
        events: events.map(e => ({ name: e.name, data: e.data })),
        timestamp: Date.now()
      });
    }

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * Wrap callback with optimization features
   */
  wrapCallbackForOptimization(callback, options = {}) {
    let lastCallTime = 0;
    const debounceDelay = options.debounce || 0;
    const throttleDelay = options.throttle || 0;

    return (data) => {
      const now = Date.now();

      // Throttling
      if (throttleDelay > 0 && (now - lastCallTime) < throttleDelay) {
        return;
      }

      // Debouncing
      if (debounceDelay > 0) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          callback(data);
          lastCallTime = now;
        }, debounceDelay);
        return;
      }

      callback(data);
      lastCallTime = now;
    };
  }

  /**
   * Compression for large data payloads
   */
  compressIfNeeded(data) {
    if (!this.compressionEnabled) return data;

    const dataString = JSON.stringify(data);
    if (dataString.length > this.config.compressionThreshold) {
      try {
        // Simple compression using JSON.stringify optimizations
        return {
          compressed: true,
          data: this.simpleCompress(dataString)
        };
      } catch (error) {
        console.warn('[WebSocket] Compression failed, sending raw data');
        return data;
      }
    }

    return data;
  }

  /**
   * Simple compression implementation
   */
  simpleCompress(str) {
    // Remove unnecessary whitespace and optimize JSON
    return JSON.stringify(JSON.parse(str));
  }

  /**
   * Decompression for received data
   */
  decompressData(data) {
    if (data?.compressed) {
      try {
        return JSON.parse(data.data);
      } catch (error) {
        console.error('[WebSocket] Failed to decompress data:', error);
        return null;
      }
    }
    return data;
  }

  /**
   * Process received data with optimization
   */
  processReceivedData(data) {
    // Add any data processing logic here
    return data;
  }

  /**
   * Start heartbeat for connection monitoring
   */
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping', { timestamp: Date.now() });
      }
    }, this.config.heartbeatFrequency);
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Attempt reconnection with exponential backoff
   */
  async attemptReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      10000
    );

    console.log(`[WebSocket] Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    }, delay);
  }

  /**
   * Register connection status callback
   */
  onConnectionChange(callback) {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  /**
   * Notify connection callbacks
   */
  notifyConnectionCallbacks(isConnected) {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(isConnected);
      } catch (error) {
        console.error('[WebSocket] Connection callback error:', error);
      }
    });
  }

  /**
   * Join a room with optimization
   */
  joinRoom(roomName, data = {}) {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot join room - not connected');
      return false;
    }

    this.emit('join_room', { room: roomName, ...data }, { immediate: true });
    return true;
  }

  /**
   * Leave a room
   */
  leaveRoom(roomName, data = {}) {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot leave room - not connected');
      return false;
    }

    this.emit('leave_room', { room: roomName, ...data }, { immediate: true });
    return true;
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      eventListenerCount: this.eventListenerCount,
      queueSize: this.eventQueue.length,
      compressionEnabled: this.compressionEnabled,
      lastPongTime: this.lastPongTime || null
    };
  }

  /**
   * Optimize for potato devices
   */
  enablePotatoMode() {
    this.config.maxEventListeners = 25;
    this.config.bufferSize = 512;
    this.config.compressionThreshold = 256;
    this.config.heartbeatFrequency = 45000;
    this.config.connectionTimeout = 15000;
    this.config.maxConcurrentEvents = 2;
    this.config.batchDelay = 200;
    this.compressionEnabled = true;

    console.log('[WebSocket] Potato mode enabled - optimized for low-end devices');
  }

  /**
   * Disable potato mode optimizations
   */
  disablePotatoMode() {
    this.config.maxEventListeners = 100;
    this.config.bufferSize = 2048;
    this.config.compressionThreshold = 1024;
    this.config.heartbeatFrequency = 20000;
    this.config.connectionTimeout = 5000;
    this.config.maxConcurrentEvents = 5;
    this.config.batchDelay = 50;

    console.log('[WebSocket] Potato mode disabled - using standard optimizations');
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    if (this.socket) {
      this.stopHeartbeat();
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
    this.eventQueue = [];
    this.connectionCallbacks.clear();
    this.disconnectionCallbacks.clear();

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    console.log('[WebSocket] Disconnected and cleaned up');
  }

  /**
   * Check if WebSocket is ready
   */
  isReady() {
    return this.socket?.connected === true;
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService();

// Auto-enable potato mode based on device capabilities
if (typeof navigator !== 'undefined') {
  const isPotatoDevice =
    navigator.hardwareConcurrency <= 2 ||
    navigator.deviceMemory <= 2 ||
    navigator.connection?.effectiveType === 'slow-2g' ||
    navigator.connection?.effectiveType === '2g' ||
    /Android 4|iPhone [3-5]|iPad [1-2]/.test(navigator.userAgent);

  if (isPotatoDevice) {
    webSocketService.enablePotatoMode();
  }
}

export default webSocketService;
