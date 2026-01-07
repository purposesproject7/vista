// src/shared/components/RealTimeStatus.jsx
import React, { useState, useEffect } from 'react';
import {
  WifiIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const RealTimeStatus = ({
  isConnected = false,
  isOnline = true,
  lastUpdate = null,
  dataSource = 'initial',
  reconnectAttempts = 0,
  maxReconnectAttempts = 5,
  showDetails = false,
  className = '',
  size = 'sm'
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [timeAgo, setTimeAgo] = useState('');

  // Update time ago display
  useEffect(() => {
    if (!lastUpdate) {
      setTimeAgo('');
      return;
    }

    const updateTimeAgo = () => {
      const now = Date.now();
      const diff = now - lastUpdate;

      if (diff < 60000) { // Less than 1 minute
        setTimeAgo('Just now');
      } else if (diff < 3600000) { // Less than 1 hour
        const minutes = Math.floor(diff / 60000);
        setTimeAgo(`${minutes}m ago`);
      } else if (diff < 86400000) { // Less than 1 day
        const hours = Math.floor(diff / 3600000);
        setTimeAgo(`${hours}h ago`);
      } else {
        const days = Math.floor(diff / 86400000);
        setTimeAgo(`${days}d ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [lastUpdate]);

  // Get status configuration
  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        status: 'offline',
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: ExclamationTriangleIcon,
        label: 'Offline',
        description: 'No internet connection'
      };
    }

    if (!isConnected) {
      if (reconnectAttempts > 0) {
        return {
          status: 'reconnecting',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: ClockIcon,
          label: 'Reconnecting',
          description: `Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})`
        };
      }
      return {
        status: 'disconnected',
        color: 'text-orange-500',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        icon: SignalIcon,
        label: 'API Only',
        description: 'Using API fallback'
      };
    }

    return {
      status: 'connected',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: WifiIcon,
      label: 'Real-time',
      description: 'Live updates active'
    };
  };

  const getDataSourceConfig = () => {
    switch (dataSource) {
      case 'websocket':
        return {
          indicator: '🔴',
          label: 'Live',
          description: 'Real-time data via WebSocket'
        };
      case 'api':
        return {
          indicator: '🟡',
          label: 'Fresh',
          description: 'Fresh data from API'
        };
      case 'cache':
        return {
          indicator: '🟢',
          label: 'Cached',
          description: 'Cached data'
        };
      default:
        return {
          indicator: '⚪',
          label: 'Loading',
          description: 'Initializing...'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const dataSourceConfig = getDataSourceConfig();
  const IconComponent = statusConfig.icon;

  // Size configurations
  const sizeClasses = {
    xs: {
      container: 'text-xs px-1.5 py-0.5',
      icon: 'w-3 h-3',
      gap: 'gap-1'
    },
    sm: {
      container: 'text-xs px-2 py-1',
      icon: 'w-3 h-3',
      gap: 'gap-1'
    },
    md: {
      container: 'text-sm px-3 py-1.5',
      icon: 'w-4 h-4',
      gap: 'gap-2'
    },
    lg: {
      container: 'text-base px-4 py-2',
      icon: 'w-5 h-5',
      gap: 'gap-2'
    }
  };

  const currentSize = sizeClasses[size] || sizeClasses.sm;

  if (showDetails) {
    return (
      <div className={`relative ${className}`}>
        <div className={`
          flex items-center ${currentSize.gap} ${currentSize.container}
          ${statusConfig.bgColor} ${statusConfig.borderColor} border
          rounded-lg font-medium transition-colors
        `}>
          <IconComponent className={`${currentSize.icon} ${statusConfig.color}`} />
          <span className={statusConfig.color}>
            {statusConfig.label}
          </span>

          {dataSource !== 'initial' && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">
                {dataSourceConfig.indicator} {dataSourceConfig.label}
              </span>
            </>
          )}

          {timeAgo && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 text-xs">
                {timeAgo}
              </span>
            </>
          )}
        </div>
      </div>
    );
  }

  // Compact version with tooltip
  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`
        flex items-center ${currentSize.gap} ${currentSize.container}
        ${statusConfig.color} font-medium cursor-pointer
        hover:${statusConfig.bgColor} transition-colors rounded
      `}>
        <IconComponent className={currentSize.icon} />
        <span>{statusConfig.label}</span>

        {dataSource !== 'initial' && (
          <span className="ml-1">
            {dataSourceConfig.indicator}
          </span>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="
          absolute top-full left-0 mt-1 z-50
          bg-slate-800 text-white text-xs px-2 py-1 rounded
          whitespace-nowrap shadow-lg
        ">
          <div className="font-medium">{statusConfig.description}</div>
          <div className="text-slate-300">{dataSourceConfig.description}</div>
          {timeAgo && (
            <div className="text-slate-400">Last update: {timeAgo}</div>
          )}

          {/* Connection details */}
          {reconnectAttempts > 0 && (
            <div className="text-yellow-300 text-xs mt-1">
              Reconnect attempts: {reconnectAttempts}/{maxReconnectAttempts}
            </div>
          )}

          {/* Arrow */}
          <div className="
            absolute bottom-full left-2 w-0 h-0
            border-l-2 border-r-2 border-b-2
            border-transparent border-b-slate-800
          " />
        </div>
      )}
    </div>
  );
};

// Pulse animation component for loading states
export const RealTimeStatusPulse = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75" />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150" />
      </div>
      <span className="text-xs text-slate-600">Connecting...</span>
    </div>
  );
};

// Network quality indicator
export const NetworkQuality = ({
  effectiveType = '4g',
  rtt = null,
  downlink = null,
  className = ''
}) => {
  const getQualityConfig = () => {
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return {
        color: 'text-red-500',
        label: 'Poor',
        bars: 1
      };
    } else if (effectiveType === '3g') {
      return {
        color: 'text-yellow-500',
        label: 'Fair',
        bars: 2
      };
    } else if (effectiveType === '4g') {
      return {
        color: 'text-green-500',
        label: 'Good',
        bars: 3
      };
    }
    return {
      color: 'text-slate-400',
      label: 'Unknown',
      bars: 0
    };
  };

  const quality = getQualityConfig();

  return (
    <div className={`flex items-center gap-1 text-xs ${className}`}>
      <div className="flex items-end gap-0.5">
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={`
              w-1 bg-current transition-opacity
              ${bar <= quality.bars ? 'opacity-100' : 'opacity-20'}
              ${bar === 1 ? 'h-1' : bar === 2 ? 'h-2' : 'h-3'}
              ${quality.color}
            `}
          />
        ))}
      </div>
      <span className={quality.color}>
        {quality.label}
      </span>

      {(rtt || downlink) && (
        <span className="text-slate-500 text-xs">
          {rtt && `${rtt}ms`}
          {rtt && downlink && ' • '}
          {downlink && `${downlink}MB/s`}
        </span>
      )}
    </div>
  );
};

export default RealTimeStatus;
