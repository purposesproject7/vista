// src/shared/components/Accordion.jsx - REPLACE ENTIRE FILE
import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Accordion = ({ 
  title, 
  children, 
  defaultOpen = false,
  badge = null,
  subtitle = null,
  actions = null,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className={`border border-slate-700 rounded-xl overflow-hidden bg-slate-800 ${className}`}>
      <div 
        className="flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isOpen ? (
            <ChevronDownIcon className="w-5 h-5 text-blue-400 shrink-0" />
          ) : (
            <ChevronRightIcon className="w-5 h-5 text-blue-400 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-white">{title}</h3>
              {badge}
            </div>
            {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
          </div>
        </div>
        {actions && (
          <div onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
      
      {isOpen && (
        <div className="p-4 bg-slate-900 border-t border-slate-700">
          {children}
        </div>
      )}
    </div>
  );
};

export default Accordion;
