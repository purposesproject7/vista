// src/shared/components/SliderInput.jsx - CREATE NEW FILE
import React from 'react';

const SliderInput = ({ 
  label, 
  value, 
  onChange, 
  max = 100,
  min = 0,
  error = null,
  className = ''
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="flex items-center gap-4">
        {/* Slider */}
        <div className="flex-1 relative">
          <input
            type="range"
            value={value || 0}
            onChange={(e) => onChange(e.target.value)}
            min={min}
            max={max}
            step="0.5"
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #334155 ${percentage}%, #334155 100%)`
            }}
          />
        </div>

        {/* Number Input */}
        <input
          type="number"
          value={value || ''}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (val >= min && val <= max) {
              onChange(e.target.value);
            } else if (e.target.value === '') {
              onChange('');
            }
          }}
          min={min}
          max={max}
          step="0.5"
          className={`w-20 px-3 py-2 bg-slate-800 border rounded-lg text-center font-bold ${
            error ? 'border-red-500' : 'border-slate-600'
          } focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none`}
        />

        {/* Max indicator */}
        <span className="text-sm text-gray-400 font-medium w-12">/ {max}</span>
      </div>

      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default SliderInput;
