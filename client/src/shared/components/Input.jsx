import React from "react";

const Input = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  error = null,
  max = null,
  min = null,
  className = "",
  disabled = false,
  name,
  endIcon = null,
  onEndIconClick,
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          max={max}
          min={min}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? "border-red-500" : "border-gray-300"
            } ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""} ${endIcon ? "pr-10" : ""
            }`}
        />
        {endIcon && (
          <button
            type="button"
            onClick={onEndIconClick}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer focus:outline-none"
          >
            {endIcon}
          </button>
        )}
      </div>
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default Input;
