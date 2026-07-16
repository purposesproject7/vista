// src/features/auth/components/ChangePasswordModal.jsx
import React, { useState } from 'react';
import Modal from '../../../shared/components/Modal';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import { useToast } from '../../../shared/hooks/useToast';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import PasswordCriteria, { validatePassword } from '../../../shared/components/PasswordCriteria';

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
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });

      showToast('Password changed successfully!', 'success');
      handleClose();
    } catch (error) {
      console.error('Error changing password:', error);

      // Check if error is due to incorrect current password
      if (error.response?.status === 401 || error.response?.data?.message?.toLowerCase().includes('current password')) {
        setCurrentPasswordError(true);
        showToast('Current password is incorrect', 'error');
      } else {
        showToast(error.response?.data?.message || 'Failed to change password. Please try again.', 'error');
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

        <PasswordCriteria password={newPassword} />

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
