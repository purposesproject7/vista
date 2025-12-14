// src/features/faculty/components/RubricComponent.jsx - REPLACE ENTIRE FILE
import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import RadioMarkInput from '../../../shared/components/RadioMarkInput';

const RubricComponent = ({ 
  rubric, 
  studentId, 
  marks, 
  errors, 
  onMarkChange, 
  depth = 0 
}) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  
  const hasChildren = rubric.children && rubric.children.length > 0;
  const indentClass = depth === 0 ? '' : `ml-${Math.min(depth * 4, 8)}`;
  
  const calculateSubtotal = () => {
    if (!hasChildren) {
      return parseFloat(marks[rubric.id]) || 0;
    }
    
    return rubric.children.reduce((sum, child) => {
      const childValue = marks[child.id];
      if (child.children && child.children.length > 0) {
        return sum + calculateChildrenTotal(child);
      }
      return sum + (parseFloat(childValue) || 0);
    }, 0);
  };

  const calculateChildrenTotal = (node) => {
    if (!node.children || node.children.length === 0) {
      return parseFloat(marks[node.id]) || 0;
    }
    return node.children.reduce((sum, child) => sum + calculateChildrenTotal(child), 0);
  };

  const subtotal = calculateSubtotal();
  const errorKey = `${studentId}-${rubric.id}`;
  const isOverLimit = subtotal > rubric.maxMarks;

  return (
    <div className={`${indentClass} mb-3`}>
      <div className={`border rounded-xl overflow-hidden ${
        depth === 0 
          ? 'border-blue-500/30 bg-gradient-to-r from-slate-800 to-slate-750' 
          : 'border-slate-700 bg-slate-800'
      }`}>
        {/* Header */}
        <div 
          className={`flex items-start justify-between p-4 ${
            hasChildren ? 'cursor-pointer hover:bg-slate-700/50' : ''
          } transition-colors`}
          onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {hasChildren && (
              isExpanded ? (
                <ChevronDownIcon className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              )
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h4 className={`${
                  depth === 0 ? 'font-bold text-base text-blue-300' : 'font-semibold text-sm text-gray-200'
                }`}>
                  {rubric.component}
                </h4>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  depth === 0 
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                    : 'bg-slate-700 text-gray-300 border border-slate-600'
                }`}>
                  Max: {rubric.maxMarks}
                </span>
              </div>
              
              {rubric.description && (
                <p className="text-xs text-gray-400 mb-3">{rubric.description}</p>
              )}

              {/* Radio Input for leaf nodes */}
              {!hasChildren && (
                <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                  <RadioMarkInput
                    value={marks[rubric.id] || ''}
                    onChange={(value) => onMarkChange(studentId, rubric.id, value)}
                    max={rubric.maxMarks}
                    error={errors[errorKey]}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Subtotal for parent nodes */}
          {hasChildren && (
            <div className="ml-3 text-right flex-shrink-0">
              <div className="text-xs text-gray-400 mb-1">Subtotal</div>
              <div className={`text-xl font-bold px-3 py-1 rounded-lg ${
                isOverLimit 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                  : subtotal === rubric.maxMarks 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-slate-700 text-gray-300 border border-slate-600'
              }`}>
                {subtotal.toFixed(1)}<span className="text-sm text-gray-500">/{rubric.maxMarks}</span>
              </div>
            </div>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="px-4 pb-4 pt-2 space-y-3 bg-slate-900/80 border-t border-slate-700">
            {rubric.children.map(child => (
              <RubricComponent
                key={child.id}
                rubric={child}
                studentId={studentId}
                marks={marks}
                errors={errors}
                onMarkChange={onMarkChange}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RubricComponent;
