// src/features/admin/components/admin-management/AdminList.jsx
import React from 'react';
import { PencilIcon, TrashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const AdminList = ({ admins, onEdit, onDelete }) => {
    if (!admins || admins.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No admins found</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Get started by creating a new admin user.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Employee ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            School
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Phone
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {admins.map((admin) => (
                        <tr key={admin._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                                        {admin.employeeId === 'ADMIN001' && (
                                            <div className="text-xs text-blue-600 font-semibold">SUDO ADMIN</div>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {admin.employeeId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {admin.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {admin.school}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {admin.phoneNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    onClick={() => onEdit(admin)}
                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                    title="Edit admin"
                                >
                                    <PencilIcon className="h-5 w-5" />
                                </button>
                                {admin.employeeId !== 'ADMIN001' && (
                                    <button
                                        onClick={() => onDelete(admin)}
                                        className="text-red-600 hover:text-red-900"
                                        title="Delete admin"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminList;
