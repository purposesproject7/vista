// src/features/faculty/components/tutorial/TutorialHighlight.jsx
import React from 'react';
import {
  CursorArrowRaysIcon,
  HandRaisedIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const TutorialHighlight = ({
  children,
  title,
  description,
  position = 'right', // right, left, top, bottom
  showPointer = true,
  variant = 'default', // default, interactive, important
  className = ''
}) => {
  const variantStyles = {
    default: {
      highlight: 'ring-4 ring-blue-300 ring-opacity-75 bg-blue-50',
      tooltip: 'bg-blue-600 text-white border-blue-700'
    },
    interactive: {
      highlight: 'ring-4 ring-green-300 ring-opacity-75 bg-green-50 cursor-pointer hover:bg-green-100',
      tooltip: 'bg-green-600 text-white border-green-700'
    },
    important: {
      highlight: 'ring-4 ring-orange-300 ring-opacity-75 bg-orange-50 animate-pulse',
      tooltip: 'bg-orange-600 text-white border-orange-700'
    }
  };

  const positionStyles = {
    right: {
      tooltip: 'left-full ml-4 top-1/2 -translate-y-1/2',
      arrow: 'right-full top-1/2 -translate-y-1/2 border-r-transparent border-t-transparent border-b-transparent'
    },
    left: {
      tooltip: 'right-full mr-4 top-1/2 -translate-y-1/2',
      arrow: 'left-full top-1/2 -translate-y-1/2 border-l-transparent border-t-transparent border-b-transparent'
    },
    top: {
      tooltip: 'bottom-full mb-4 left-1/2 -translate-x-1/2',
      arrow: 'top-full left-1/2 -translate-x-1/2 border-t-transparent border-l-transparent border-r-transparent'
    },
    bottom: {
      tooltip: 'top-full mt-4 left-1/2 -translate-x-1/2',
      arrow: 'bottom-full left-1/2 -translate-x-1/2 border-b-transparent border-l-transparent border-r-transparent'
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'interactive':
        return <CursorArrowRaysIcon className="w-4 h-4" />;
      case 'important':
        return <HandRaisedIcon className="w-4 h-4" />;
      default:
        return <EyeIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Highlighted Element */}
      <div className={`
        relative rounded-lg transition-all duration-300
        ${variantStyles[variant].highlight}
      `}>
        {children}

        {/* Tooltip */}
        <div className={`
          absolute z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200
          ${positionStyles[position].tooltip}
        `}>
          <div className={`
            px-4 py-3 rounded-lg shadow-lg border-2 max-w-xs min-w-48
            ${variantStyles[variant].tooltip}
          `}>
            {/* Header */}
            {title && (
              <div className="flex items-center gap-2 mb-2">
                {getIcon()}
                <span className="font-semibold text-sm">{title}</span>
              </div>
            )}

            {/* Description */}
            <p className="text-sm leading-relaxed">{description}</p>

            {/* Interaction hint */}
            {variant === 'interactive' && (
              <p className="text-xs opacity-75 mt-2 italic">
                Click to interact with this element
              </p>
            )}
          </div>

          {/* Arrow */}
          {showPointer && (
            <div className={`
              absolute w-0 h-0 border-8
              ${positionStyles[position].arrow}
              ${variant === 'default' ? 'border-blue-600' :
                variant === 'interactive' ? 'border-green-600' : 'border-orange-600'}
            `} />
          )}
        </div>
      </div>

      {/* Pulse animation for important elements */}
      {variant === 'important' && (
        <div className="absolute inset-0 rounded-lg ring-4 ring-orange-400 ring-opacity-50 animate-ping pointer-events-none" />
      )}
    </div>
  );
};

export default TutorialHighlight;
