// src/features/admin/components/broadcasts/AudienceSelector.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDownIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const AudienceSelector = ({ label, options, selected, onToggle, onReset }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Normalize options to always have key and label
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "string") {
      return { key: opt, label: opt };
    }
    return opt;
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCount = selected.length;
  const isAllSelected = selectedCount === 0;

  const handleToggle = (optionKey) => {
    onToggle(optionKey);
  };

  // Get label for a selected key
  const getLabel = (key) => {
    const option = normalizedOptions.find((opt) => opt.key === key);
    return option ? option.label : key;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
          isOpen ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-300"
        }`}
      >
        <div className="flex flex-wrap gap-1 pr-8">
          {isAllSelected ? (
            <span className="text-gray-500">
              All {label.toLowerCase().replace("target ", "")}
            </span>
          ) : (
            selected.map((item) => (
              <span
                key={item}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
              >
                {getLabel(item)}
                <span
                  className="ml-1 cursor-pointer hover:text-blue-900"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(item);
                  }}
                >
                  &times;
                </span>
              </span>
            ))
          )}
        </div>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <ChevronDownIcon
            className={`h-5 w-5 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {/* Header Actions */}
          <div className="sticky top-0 bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center">
            <span className="text-xs text-gray-500 font-medium">
              {normalizedOptions.length} options
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReset(); // Should clear all (which implies ALL) logic depends on parent
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Target All
              </button>
            </div>
          </div>

          {/* Options List */}
          <div className="py-1">
            {normalizedOptions.map((option) => {
              const isSelected = selected.includes(option.key);
              return (
                <div
                  key={option.key}
                  onClick={() => handleToggle(option.key)}
                  className={`px-4 py-2 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors ${
                    isSelected ? "bg-blue-50/50" : ""
                  }`}
                >
                  <span
                    className={`text-sm ${
                      isSelected ? "text-blue-700 font-medium" : "text-gray-700"
                    }`}
                  >
                    {option.label}
                  </span>
                  {isSelected && (
                    <CheckIcon className="h-4 w-4 text-blue-600" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-2 text-xs text-gray-500">
        Leave empty to reach every {label.toLowerCase().replace("target ", "")}.
      </p>
    </div>
  );
};

export default AudienceSelector;
