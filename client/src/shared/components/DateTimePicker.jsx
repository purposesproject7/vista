// src/shared/components/DateTimePicker.jsx
import React, { useState, useEffect } from "react";
import TimePicker from "./TimePicker";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";

const DateTimePicker = ({
  value = "",
  onChange,
  label,
  placeholder = "Select date and time",
  disabled = false,
  className = "",
  timeFormat = "12", // '12' or '24'
  id,
  required = false,
}) => {
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("");

  // Parse datetime-local value into separate date and time
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        // Format date for date input (YYYY-MM-DD)
        const formattedDate = date.toISOString().split("T")[0];
        setDateValue(formattedDate);

        // Format time for time picker (HH:MM)
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        setTimeValue(`${hours}:${minutes}`);
      }
    } else {
      setDateValue("");
      setTimeValue("");
    }
  }, [value]);

  // Combine date and time into datetime-local format
  const combineDateTime = (date, time) => {
    if (!date || !time) return "";

    const [hours, minutes] = time.split(":");
    const dateObj = new Date(date);
    dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    return dateObj.toISOString();
  };

  // Handle date change
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDateValue(newDate);

    if (newDate && timeValue) {
      const combined = combineDateTime(newDate, timeValue);
      onChange?.(combined);
    } else if (!newDate) {
      onChange?.("");
    }
  };

  // Handle time change
  const handleTimeChange = (newTime) => {
    setTimeValue(newTime);

    if (dateValue && newTime) {
      const combined = combineDateTime(dateValue, newTime);
      onChange?.(combined);
    }
  };

  // Get display value for the combined picker
  const getDisplayValue = () => {
    if (!dateValue && !timeValue) return "";

    let displayText = "";

    if (dateValue) {
      const date = new Date(dateValue);
      displayText += date.toLocaleDateString();
    }

    if (timeValue) {
      const [hours, minutes] = timeValue.split(":");
      let hour = parseInt(hours);
      let period = "";

      if (timeFormat === "12") {
        period = hour >= 12 ? "PM" : "AM";
        if (hour === 0) hour = 12;
        else if (hour > 12) hour -= 12;
        displayText += ` ${hour}:${minutes} ${period}`;
      } else {
        displayText += ` ${hours}:${minutes}`;
      }
    }

    return displayText.trim();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Combined Display (Read-only) */}
      <div className="relative">
        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
            <span
              className={getDisplayValue() ? "text-gray-900" : "text-gray-500"}
            >
              {getDisplayValue() || placeholder}
            </span>
          </div>
        </div>
      </div>

      {/* Date and Time Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Date Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            type="date"
            value={dateValue}
            onChange={handleDateChange}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            id={id ? `${id}-date` : undefined}
          />
        </div>

        {/* Time Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time
          </label>
          <TimePicker
            value={timeValue}
            onChange={handleTimeChange}
            placeholder="Select time"
            disabled={disabled || !dateValue}
            format={timeFormat}
            id={id ? `${id}-time` : undefined}
          />
        </div>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-gray-500">
        Select a date first, then choose the time
      </p>
    </div>
  );
};

export default DateTimePicker;
