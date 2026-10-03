import React from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const PasswordCriteria = ({ password }) => {
  const criteria = [
    { id: 'length', label: 'At least 8 characters long', test: (pwd) => pwd.length >= 8 },
    { id: 'uppercase', label: 'Contains uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
    { id: 'lowercase', label: 'Contains lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
    { id: 'number', label: 'Contains at least one number', test: (pwd) => /[0-9]/.test(pwd) },
    { id: 'special', label: 'Contains special character (!@#$%^&*)', test: (pwd) => /[!@#$%^&*]/.test(pwd) },
  ];

  if (typeof password !== 'string') return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
      <p className="text-xs font-semibold text-blue-900 mb-2">Password Requirements:</p>
      <ul className="text-xs space-y-1.5">
        {criteria.map((c) => {
          const isValid = c.test(password);
          return (
            <li key={c.id} className={`flex items-center gap-2 transition-colors ${isValid ? 'text-green-700 font-medium' : 'text-slate-500'}`}>
              {isValid ? (
                <CheckCircleIcon className="w-4 h-4 text-green-600 shrink-0" />
              ) : (
                <XCircleIcon className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              {c.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*]/.test(password)) return 'Password must contain at least one special character (!@#$%^&*)';
    return null;
};

export default PasswordCriteria;
