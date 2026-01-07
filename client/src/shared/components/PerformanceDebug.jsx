// src/shared/components/PerformanceDebug.jsx
import React, { useState, useEffect, useRef, memo } from 'react';
import {
  ChartBarIcon,
  CpuChipIcon,
  SignalIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const PerformanceDebug = ({
  wsStats = null,
  isVisible = false,
  onClose = null,
  position = 'bottom-right',
  enableAutoHide = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [performanceData, setPerformanceData] = useState({});
  const [networkInfo, setNetworkInfo] = useState({});
  const [memoryStats, setMemoryStats] = useState({});
  const intervalRef = useRef(null);

  // Collect performance metrics
  useEffect(() => {
    const collectMetrics = () => {
      // Performance metrics
      const performance = window.performance || {};
      const navigation = performance.navigation || {};
      const timing = performance.timing || {};
      const memory = performance.memory || {};

      // Network information
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};

      // Calculate page load metrics
      const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
      const domContentLoadedTime = timing.domContentLoadedEventEnd - timing.navigationStart;
      const firstPaintTime = performance.getEntriesByName('first-paint')[0]?.startTime || 0;
      const firstContentfulPaintTime = performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0;

      setPerformanceData({
        pageLoadTime: pageLoadTime > 0 ? pageLoadTime : 0,
        domContentLoadedTime: domContentLoadedTime > 0 ? domContentLoadedTime : 0,
        firstPaintTime: Math.round(firstPaintTime),
        firstContentfulPaintTime: Math.round(firstContentfulPaintTime),
        navigationEntries: performance.getEntriesByType('navigation').length,
        resourceEntries: performance.getEntriesByType('resource').length
      });

      setNetworkInfo({
        effectiveType: connection.effectiveType || 'unknown',
        rtt: connection.rtt || 0,
        downlink: connection.downlink || 0,
        saveData: connection.saveData || false
      });

      setMemoryStats({
        usedJSHeapSize: memory.usedJSHeapSize || 0,
        totalJSHeapSize: memory.totalJSHeapSize || 0,
        jsHeapSizeLimit: memory.jsHeapSizeLimit || 0
      });
    };

    if (isVisible) {
      collectMetrics();
      intervalRef.current = setInterval(collectMetrics, 2000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isVisible]);

  // Auto-hide after 5 seconds if enabled
  useEffect(() => {
    if (enableAutoHide && isVisible && !isExpanded) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, isExpanded, enableAutoHide, onClose]);

  if (!isVisible) return null;

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTime = (ms) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getNetworkQuality = () => {
    const { effectiveType, rtt } = networkInfo;
    if (effectiveType === 'slow-2g' || effectiveType === '2g' || rtt > 1000) {
      return { label: 'Poor', color: 'text-red-500', bgColor: 'bg-red-50' };
    } else if (effectiveType === '3g' || rtt > 500) {
      return { label: 'Fair', color: 'text-yellow-500', bgColor: 'bg-yellow-50' };
    } else if (effectiveType === '4g') {
      return { label: 'Good', color: 'text-green-500', bgColor: 'bg-green-50' };
    }
    return { label: 'Unknown', color: 'text-slate-500', bgColor: 'bg-slate-50' };
  };

  const getMemoryStatus = () => {
    const { usedJSHeapSize, jsHeapSizeLimit } = memoryStats;
    if (!usedJSHeapSize || !jsHeapSizeLimit) return { label: 'Unknown', color: 'text-slate-500' };

    const usage = (usedJSHeapSize / jsHeapSizeLimit) * 100;
    if (usage > 80) {
      return { label: 'High', color: 'text-red-500', bgColor: 'bg-red-50' };
    } else if (usage > 60) {
      return { label: 'Medium', color: 'text-yellow-500', bgColor: 'bg-yellow-50' };
    }
    return { label: 'Low', color: 'text-green-500', bgColor: 'bg-green-50' };
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4';
    }
  };

  const networkQuality = getNetworkQuality();
  const memoryStatus = getMemoryStatus();

  if (!isExpanded) {
    return (
      <div className={`fixed ${getPositionClasses()} z-50`}>
        <div
          className="bg-slate-800 text-white rounded-lg p-2 shadow-lg cursor-pointer hover:bg-slate-700 transition-colors"
          onClick={() => setIsExpanded(true)}
        >
          <div className="flex items-center gap-2 text-xs">
            <ChartBarIcon className="w-4 h-4" />
            <span>Performance</span>
            {wsStats?.isConnected && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-50 w-80`}>
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800 text-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5" />
            <span className="font-medium">Performance Debug</span>
          </div>
          <div className="flex items-center gap-2">
            {wsStats?.isConnected && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="WebSocket Connected" />
            )}
            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-300 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
          {/* WebSocket Stats */}
          {wsStats && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                <SignalIcon className="w-4 h-4" />
                WebSocket
              </h3>
              <div className="bg-slate-50 rounded-lg p-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Status:</span>
                  <span className={wsStats.isConnected ? 'text-green-600' : 'text-red-600'}>
                    {wsStats.isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                {wsStats.cacheSize !== undefined && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Cache Size:</span>
                    <span className="text-slate-800">{wsStats.cacheSize}</span>
                  </div>
                )}
                {wsStats.queueSize !== undefined && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Queue Size:</span>
                    <span className="text-slate-800">{wsStats.queueSize}</span>
                  </div>
                )}
                {wsStats.reconnectAttempts !== undefined && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Reconnect Attempts:</span>
                    <span className="text-slate-800">{wsStats.reconnectAttempts}</span>
                  </div>
                )}
                {wsStats.lastUpdateTime && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Last Update:</span>
                    <span className="text-slate-800">
                      {new Date(wsStats.lastUpdateTime).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
              <ClockIcon className="w-4 h-4" />
              Page Performance
            </h3>
            <div className="bg-slate-50 rounded-lg p-2 space-y-1">
              {performanceData.pageLoadTime > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Page Load:</span>
                  <span className="text-slate-800">
                    {formatTime(performanceData.pageLoadTime)}
                  </span>
                </div>
              )}
              {performanceData.domContentLoadedTime > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">DOM Ready:</span>
                  <span className="text-slate-800">
                    {formatTime(performanceData.domContentLoadedTime)}
                  </span>
                </div>
              )}
              {performanceData.firstContentfulPaintTime > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">First Paint:</span>
                  <span className="text-slate-800">
                    {formatTime(performanceData.firstContentfulPaintTime)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Resources:</span>
                <span className="text-slate-800">{performanceData.resourceEntries || 0}</span>
              </div>
            </div>
          </div>

          {/* Network Information */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
              <SignalIcon className="w-4 h-4" />
              Network
            </h3>
            <div className="bg-slate-50 rounded-lg p-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Quality:</span>
                <span className={`${networkQuality.color} font-medium`}>
                  {networkQuality.label}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Type:</span>
                <span className="text-slate-800 uppercase">
                  {networkInfo.effectiveType || 'Unknown'}
                </span>
              </div>
              {networkInfo.rtt > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">RTT:</span>
                  <span className="text-slate-800">{networkInfo.rtt}ms</span>
                </div>
              )}
              {networkInfo.downlink > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Downlink:</span>
                  <span className="text-slate-800">{networkInfo.downlink} Mbps</span>
                </div>
              )}
              {networkInfo.saveData && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Data Saver:</span>
                  <span className="text-orange-600">Enabled</span>
                </div>
              )}
            </div>
          </div>

          {/* Memory Usage */}
          {memoryStats.usedJSHeapSize > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                <CpuChipIcon className="w-4 h-4" />
                Memory Usage
              </h3>
              <div className="bg-slate-50 rounded-lg p-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Status:</span>
                  <span className={`${memoryStatus.color} font-medium`}>
                    {memoryStatus.label}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Used:</span>
                  <span className="text-slate-800">
                    {formatBytes(memoryStats.usedJSHeapSize)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Total:</span>
                  <span className="text-slate-800">
                    {formatBytes(memoryStats.totalJSHeapSize)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Limit:</span>
                  <span className="text-slate-800">
                    {formatBytes(memoryStats.jsHeapSizeLimit)}
                  </span>
                </div>

                {/* Memory usage bar */}
                <div className="mt-2">
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        (memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit) * 100 > 80
                          ? 'bg-red-500'
                          : (memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit) * 100 > 60
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          ((memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit) * 100),
                          100
                        )}%`
                      }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {((memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Tips */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
              <InformationCircleIcon className="w-4 h-4" />
              Optimization Status
            </h3>
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="space-y-1">
                {networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g' ? (
                  <div className="flex items-center gap-1 text-xs text-orange-600">
                    <ExclamationTriangleIcon className="w-3 h-3" />
                    <span>Potato mode recommended</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <InformationCircleIcon className="w-3 h-3" />
                    <span>Network quality is good</span>
                  </div>
                )}

                {memoryStats.usedJSHeapSize && (memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit) * 100 > 80 ? (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <ExclamationTriangleIcon className="w-3 h-3" />
                    <span>High memory usage detected</span>
                  </div>
                ) : null}

                {performanceData.pageLoadTime > 3000 ? (
                  <div className="flex items-center gap-1 text-xs text-yellow-600">
                    <ExclamationTriangleIcon className="w-3 h-3" />
                    <span>Slow page load detected</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Close button for mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setIsExpanded(false)}
              className="w-full py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              Close Debug Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Lightweight performance monitor for production
export const ProductionPerformanceMonitor = memo(() => {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const checkPerformance = () => {
      const memory = performance.memory;
      const connection = navigator.connection;

      // Show warning for very poor conditions
      if (
        (memory && (memory.usedJSHeapSize / memory.jsHeapSizeLimit) > 0.9) ||
        (connection && (connection.effectiveType === 'slow-2g' || connection.rtt > 2000))
      ) {
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
      }
    };

    const interval = setInterval(checkPerformance, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-orange-100 border border-orange-200 rounded-lg p-3 shadow-lg max-w-sm">
      <div className="flex items-start gap-2">
        <ExclamationTriangleIcon className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-orange-800">
            Performance Notice
          </p>
          <p className="text-xs text-orange-700">
            Your device may be experiencing performance issues. Consider closing other tabs or applications.
          </p>
        </div>
        <button
          onClick={() => setShowWarning(false)}
          className="text-orange-500 hover:text-orange-700 transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

ProductionPerformanceMonitor.displayName = 'ProductionPerformanceMonitor';

export default memo(PerformanceDebug);
