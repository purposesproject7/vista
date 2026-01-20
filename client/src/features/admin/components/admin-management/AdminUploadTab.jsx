// src/features/admin/components/admin-management/AdminUploadTab.jsx
import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import AdminModal from './AdminModal';
import { useToast } from '../../../../shared/hooks/useToast';
import { createAdmin } from '../../services/adminApi';

const AdminUploadTab = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { showToast } = useToast();

    const handleCreateAdmin = async (adminData) => {
        try {
            const response = await createAdmin(adminData);

            if (response.success) {
                showToast('Admin created successfully', 'success');
                setIsModalOpen(false);
                // Optionally reload the page or emit an event to refresh the list
                window.location.reload();
            } else {
                showToast(response.message || 'Failed to create admin', 'error');
            }
        } catch (error) {
            console.error('Error creating admin:', error);
            showToast(error.response?.data?.message || 'Error creating admin', 'error');
        }
    };

    return (
        <div className="space-y-6">
            {/* Single Admin Creation */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Create New Admin
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Add a new admin user to the system. Only ADMIN001 can perform this action.
                </p>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span>Add New Admin</span>
                </button>
            </div>

            {/* Bulk Upload Section - Placeholder */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Bulk Upload Admins
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Bulk upload functionality for admins can be added here if needed.
                </p>
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <p className="text-gray-500">Bulk upload feature coming soon</p>
                </div>
            </div>

            {/* Create Admin Modal */}
            <AdminModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleCreateAdmin}
                admin={null}
            />
        </div>
    );
};

export default AdminUploadTab;
