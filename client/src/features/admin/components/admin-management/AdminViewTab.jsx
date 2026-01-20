// src/features/admin/components/admin-management/AdminViewTab.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Input from '../../../../shared/components/Input';
import AdminList from './AdminList';
import AdminModal from './AdminModal';
import LoadingSpinner from '../../../../shared/components/LoadingSpinner';
import { useToast } from '../../../../shared/hooks/useToast';
import { fetchAdmins, updateAdmin, deleteAdmin } from '../../services/adminApi';

const AdminViewTab = () => {
    const [allAdmins, setAllAdmins] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const { showToast } = useToast();

    // Load admins on mount
    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        setLoading(true);
        try {
            const response = await fetchAdmins({});

            if (response.success) {
                setAllAdmins(response.admins || []);
            } else {
                showToast(response.message || 'Failed to load admins', 'error');
            }
        } catch (error) {
            console.error('Error fetching admins:', error);
            showToast(error.response?.data?.message || 'Error fetching admin data', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Filter admins based on search query
    const filteredAdmins = useMemo(() => {
        if (!searchQuery.trim()) return allAdmins;

        const query = searchQuery.toLowerCase();
        return allAdmins.filter(admin => {
            if (admin.name?.toLowerCase().includes(query)) return true;
            if (admin.employeeId?.toLowerCase().includes(query)) return true;
            if (admin.email?.toLowerCase().includes(query)) return true;
            if (admin.school?.toLowerCase().includes(query)) return true;

            return false;
        });
    }, [allAdmins, searchQuery]);

    const handleEditAdmin = async (adminData) => {
        try {
            const response = await updateAdmin(selectedAdmin.employeeId, adminData);

            if (response.success) {
                await loadAdmins();
                showToast('Admin updated successfully', 'success');
                setIsModalOpen(false);
                setSelectedAdmin(null);
            } else {
                showToast(response.message || 'Failed to update admin', 'error');
            }
        } catch (error) {
            console.error('Error updating admin:', error);
            showToast(error.response?.data?.message || 'Error updating admin', 'error');
        }
    };

    const handleDeleteAdmin = async (admin) => {
        // Prevent deleting ADMIN001
        if (admin.employeeId === 'ADMIN001') {
            showToast('Cannot delete ADMIN001', 'error');
            return;
        }

        const confirmDelete = window.confirm(
            `Are you sure you want to delete ${admin.name}? This action cannot be undone.`
        );

        if (confirmDelete) {
            try {
                const response = await deleteAdmin(admin.employeeId);

                if (response.success) {
                    const updatedAdmins = allAdmins.filter(a => a._id !== admin._id);
                    setAllAdmins(updatedAdmins);
                    showToast('Admin deleted successfully', 'success');
                } else {
                    showToast(response.message || 'Failed to delete admin', 'error');
                }
            } catch (error) {
                console.error('Error deleting admin:', error);
                showToast(error.response?.data?.message || 'Error deleting admin', 'error');
            }
        }
    };

    const openEditModal = (admin) => {
        setSelectedAdmin(admin);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            {allAdmins.length > 0 && !loading && (
                <div className="mb-6">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search by name, employee ID, school..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-full"
                        />
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Showing {filteredAdmins.length} of {allAdmins.length} admins
                    </p>
                </div>
            )}

            {/* Admin List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <LoadingSpinner />
                </div>
            ) : (
                <AdminList
                    admins={filteredAdmins}
                    onEdit={openEditModal}
                    onDelete={handleDeleteAdmin}
                />
            )}

            {/* Edit Modal */}
            <AdminModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedAdmin(null);
                }}
                onSave={handleEditAdmin}
                admin={selectedAdmin}
            />
        </div>
    );
};

export default AdminViewTab;
