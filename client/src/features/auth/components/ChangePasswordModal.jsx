// src/features/auth/components/ChangePasswordModal.jsx
import React, { useState } from 'react';
import Modal from '../../../shared/components/Modal';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import { useToast } from '../../../shared/hooks/useToast';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setCurrentPasswordError(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleForgotPassword = () => {
    handleClose();
    navigate('/forgot-password');
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return 'Password must contain at least one special character (!@#$%^&*)';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCurrentPasswordError(false);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      showToast(passwordError, 'error');
      return;
    }

    if (currentPassword === newPassword) {
      showToast('New password must be different from current password', 'error');
      return;
    }

    setLoading(true);

    try {
      // TODO: Replace with actual API call
      // Mock API call for development
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate checking current password (50% chance of failure for demo)
      const isCurrentPasswordCorrect = Math.random() > 0.3; // 70% success rate for demo
      
      if (!isCurrentPasswordCorrect) {
        setCurrentPasswordError(true);
        showToast('Current password is incorrect', 'error');
        return;
      }

      // Actual API call would be:
      // await api.post('/auth/change-password', {
      //   currentPassword,
      //   newPassword
      // });

      showToast('Password changed successfully!', 'success');
      handleClose();
    } catch (error) {
      console.error('Error changing password:', error);
      
      // Check if error is due to incorrect current password
      if (error.response?.status === 401 || error.response?.data?.message?.includes('current password')) {
        setCurrentPasswordError(true);
        showToast('Current password is incorrect', 'error');
      } else {
        showToast('Failed to change password. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change Password"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Current Password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Enter current password"
          required
        />

        {currentPasswordError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 mb-3">
              The current password you entered is incorrect.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleForgotPassword}
              className="w-full"
            >
              Forgot Password? Click here
            </Button>
          </div>
        )}

        <Input
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
          required
        />

        <Input
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          required
        />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-900 mb-2">Password Requirements:</p>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• At least 8 characters long</li>
            <li>• Contains uppercase and lowercase letters</li>
            <li>• Contains at least one number</li>
            <li>• Contains at least one special character (!@#$%^&*)</li>
          </ul>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;
