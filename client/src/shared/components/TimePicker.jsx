// src/shared/components/TimePicker.jsx
import React, { useState, useEffect, useRef } from 'react';
import { ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';

const TimePicker = ({
  value = '',
  onChange,
  placeholder = 'Select time',
  disabled = false,
  className = '',
  format = '12', // '12' or '24'
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('AM');
  const [mode, setMode] = useState('hour'); // 'hour' or 'minute'

  const pickerRef = useRef(null);
  const inputRef = useRef(null);

  // Parse existing value
  useEffect(() => {
    if (value) {
      const [hourStr, minuteStr] = value.split(':');
      let hour = parseInt(hourStr);
      const minute = parseInt(minuteStr);

      if (format === '12') {
        if (hour === 0) {
          setSelectedHour(12);
          setSelectedPeriod('AM');
        } else if (hour <= 12) {
          setSelectedHour(hour);
          setSelectedPeriod(hour === 12 ? 'PM' : 'AM');
        } else {
          setSelectedHour(hour - 12);
          setSelectedPeriod('PM');
        }
      } else {
        setSelectedHour(hour);
      }

      setSelectedMinute(minute);
    }
  }, [value, format]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target) &&
        inputRef.current && !inputRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate time display
  const getTimeDisplay = () => {
    if (!value) return '';

    const hourDisplay = selectedHour.toString().padStart(2, '0');
    const minuteDisplay = selectedMinute.toString().padStart(2, '0');

    if (format === '12') {
      return `${hourDisplay}:${minuteDisplay} ${selectedPeriod}`;
    } else {
      return `${hourDisplay}:${minuteDisplay}`;
    }
  };

  // Convert to 24-hour format for output
  const getTimeValue = () => {
    let hour = selectedHour;

    if (format === '12') {
      if (selectedPeriod === 'AM' && hour === 12) {
        hour = 0;
      } else if (selectedPeriod === 'PM' && hour !== 12) {
        hour += 12;
      }
    }

    return `${hour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
  };

  // Handle hour selection
  const handleHourClick = (hour) => {
    setSelectedHour(hour);
    setMode('minute');
  };

  // Handle minute selection
  const handleMinuteClick = (minute) => {
    setSelectedMinute(minute);
    const timeValue = getTimeValue();
    onChange?.(timeValue);
    setIsOpen(false);
    setMode('hour');
  };

  // Handle period change (AM/PM)
  const handlePeriodClick = (period) => {
    setSelectedPeriod(period);
  };

  // Generate hour numbers for clock
  const generateHours = () => {
    const hours = [];
    const maxHour = format === '12' ? 12 : 23;
    const startHour = format === '12' ? 1 : 0;

    for (let i = startHour; i <= maxHour; i++) {
      const displayHour = format === '12' ? i : i;
      hours.push(displayHour);
    }
    return hours;
  };

  // Generate minutes
  const generateMinutes = () => {
    const minutes = [];
    for (let i = 0; i < 60; i += 5) {
      minutes.push(i);
    }
    return minutes;
  };

  // Calculate position on clock
  const getClockPosition = (value, total, radius = 80) => {
    const angle = (value * 360) / total - 90; // -90 to start at top
    const radian = (angle * Math.PI) / 180;
    const x = Math.cos(radian) * radius;
    const y = Math.sin(radian) * radius;
    return { x, y };
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setMode('hour');
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.('');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Input Field */}
      <div
        ref={inputRef}
        onClick={handleInputClick}
        className={`
          relative w-full px-3 py-2 border border-gray-300 rounded-lg
          focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-gray-400'}
          ${className}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-gray-400" />
            <span className={`${getTimeDisplay() ? 'text-gray-900' : 'text-gray-500'}`}>
              {getTimeDisplay() || placeholder}
            </span>
          </div>
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Time Picker Dropdown */}
      {isOpen && (
        <div
          ref={pickerRef}
          className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-6 min-w-[320px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Select time</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Time Display */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-2 text-3xl font-bold">
              <div
                className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${mode === 'hour' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                onClick={() => setMode('hour')}
              >
                {selectedHour.toString().padStart(2, '0')}
              </div>
              <span className="text-gray-600">:</span>
              <div
                className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${mode === 'minute' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                onClick={() => setMode('minute')}
              >
                {selectedMinute.toString().padStart(2, '0')}
              </div>
              {format === '12' && (
                <div className="ml-3 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handlePeriodClick('AM')}
                    className={`px-3 py-1 text-sm font-semibold rounded transition-all ${selectedPeriod === 'AM'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePeriodClick('PM')}
                    className={`px-3 py-1 text-sm font-semibold rounded transition-all ${selectedPeriod === 'PM'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    PM
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Clock Interface */}
          <div className="relative flex justify-center">
            <div className="relative w-48 h-48 bg-gray-50 rounded-full border-2 border-gray-200">
              {/* Clock Numbers */}
              {mode === 'hour' ? (
                generateHours().map((hour) => {
                  const total = format === '12' ? 12 : 24;
                  const adjustedHour = format === '12' ? hour : (hour === 0 ? 24 : hour);
                  const position = getClockPosition(adjustedHour, total, 70);

                  return (
                    <button
                      type="button"
                      key={hour}
                      onClick={() => handleHourClick(hour)}
                      className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all transform -translate-x-1/2 -translate-y-1/2 ${selectedHour === hour
                          ? 'bg-blue-600 text-white shadow-lg scale-110'
                          : 'bg-white text-gray-700 hover:bg-blue-100 hover:scale-105 border border-gray-200'
                        }`}
                      style={{
                        left: `calc(50% + ${position.x}px)`,
                        top: `calc(50% + ${position.y}px)`
                      }}
                    >
                      {hour}
                    </button>
                  );
                })
              ) : (
                generateMinutes().map((minute) => {
                  const position = getClockPosition(minute, 60, 70);

                  return (
                    <button
                      type="button"
                      key={minute}
                      onClick={() => handleMinuteClick(minute)}
                      className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all transform -translate-x-1/2 -translate-y-1/2 ${selectedMinute === minute
                          ? 'bg-blue-600 text-white shadow-lg scale-110'
                          : 'bg-white text-gray-700 hover:bg-blue-100 hover:scale-105 border border-gray-200'
                        }`}
                      style={{
                        left: `calc(50% + ${position.x}px)`,
                        top: `calc(50% + ${position.y}px)`
                      }}
                    >
                      {minute.toString().padStart(2, '0')}
                    </button>
                  );
                })
              )}

              {/* Center Dot */}
              <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-blue-600 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>

              {/* Clock Hand */}
              {mode === 'hour' ? (
                <div
                  className="absolute top-1/2 left-1/2 origin-bottom bg-blue-600 rounded-full"
                  style={{
                    width: '3px',
                    height: '50px',
                    transform: `translate(-50%, -100%) rotate(${(selectedHour * 30) - 90}deg)`,
                    transformOrigin: 'bottom center'
                  }}
                />
              ) : (
                <div
                  className="absolute top-1/2 left-1/2 origin-bottom bg-blue-600 rounded-full"
                  style={{
                    width: '2px',
                    height: '60px',
                    transform: `translate(-50%, -100%) rotate(${(selectedMinute * 6) - 90}deg)`,
                    transformOrigin: 'bottom center'
                  }}
                />
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const timeValue = getTimeValue();
                onChange?.(timeValue);
                setIsOpen(false);
                setMode('hour');
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              OK
            </button>
          </div>

          {/* Mode Instructions */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              {mode === 'hour' ? 'Select hour, then minutes' : 'Select minutes'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimePicker;
