// src/features/admin/pages/AdminManagement.jsx
import React, { useState, useEffect } from "react";
import { EyeIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../shared/components/Navbar";
import AdminTabs from "../components/shared/AdminTabs";
import AdminViewTab from "../components/admin-management/AdminViewTab";
import AdminUploadTab from "../components/admin-management/AdminUploadTab";
import { fetchAdmins } from "../services/adminApi";
import { useAuth } from "../../../shared/hooks/useAuth";

const AdminManagement = () => {
    const [activeTab, setActiveTab] = useState("view");
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        filtered: 0,
    });
    const { isSudoAdmin } = useAuth();
    const navigate = useNavigate();

    // Redirect if not ADMIN001
    useEffect(() => {
        if (!isSudoAdmin()) {
            navigate("/admin/students");
        }
    }, [isSudoAdmin, navigate]);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const response = await fetchAdmins({});
                if (response.success) {
                    const allAdmins = response.admins || [];
                    setStats({
                        total: response.count || 0,
                        active: allAdmins.filter((a) => a.isActive !== false).length,
                        filtered: response.count || 0,
                    });
                }
            } catch (error) {
                console.error("Failed to load stats", error);
            }
        };
        loadStats();
    }, []);

    const adminTabs = [
        {
            id: "view",
            label: "Admin View",
            icon: EyeIcon,
            description: "View and manage existing admins",
        },
        {
            id: "upload",
            label: "Admin Upload",
            icon: ArrowUpTrayIcon,
            description: "Add admins via Excel or single entry",
        },
    ];

    // Don't render if not sudo admin
    if (!isSudoAdmin()) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <AdminTabs />

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Admin Management
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Manage admin users (ADMIN001 only)
                    </p>
                </div>

                {/* Admin Tabs */}
                <div className="mb-6 bg-white rounded-lg shadow-sm p-2">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex gap-2 w-full sm:w-auto">
                            {adminTabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                    flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all
                    ${isActive
                                                ? "bg-blue-600 text-white shadow-md"
                                                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                                            }
                  `}
                                        title={tab.description}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="px-4 flex items-center gap-4 text-xs text-gray-600">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">Total:</span>
                                <span className="bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full font-bold">
                                    {stats.total}
                                </span>
                            </div>
                            <div className="items-center gap-2 hidden md:flex">
                                <span className="font-medium">Active:</span>
                                <span className="bg-green-100 text-green-800 py-0.5 px-2 rounded-full font-bold">
                                    {stats.active}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === "view" && <AdminViewTab />}
                    {activeTab === "upload" && <AdminUploadTab />}
                </div>
            </div>
        </div>
    );
};

export default AdminManagement;
