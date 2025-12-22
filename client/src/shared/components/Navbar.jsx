// src/shared/components/Navbar.jsx - Light mode
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from './Button';
import UserMenu from './UserMenu';
import ChangePasswordModal from '../../features/auth/components/ChangePasswordModal';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="vista-brand text-2xl font-bold text-blue-600">
              VISTA
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {user.role === 'faculty' ? 'Faculty Dashboard' : user.role === 'project_coordinator' ? 'Project Coordinator Dashboard' : 'Admin Dashboard'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              {user.role === 'project_coordinator' && (
                <p className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                  {user.isPrimary ? 'Primary Coordinator' : 'Co-Coordinator'}
                </p>
              )}
            </div>
            <UserMenu 
              user={user} 
              onChangePassword={() => setIsChangePasswordOpen(true)}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
};

export default Navbar;
