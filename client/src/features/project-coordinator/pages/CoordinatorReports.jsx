// src/features/project-coordinator/pages/CoordinatorReports.jsx
import React, { useState, useEffect } from 'react';
import Navbar from '../../../shared/components/Navbar';
import CoordinatorTabs from '../components/shared/CoordinatorTabs';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import {
    DocumentArrowDownIcon,
    ChartBarIcon,
    AcademicCapIcon,
    UserGroupIcon,
    ClipboardDocumentCheckIcon,
    TableCellsIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useToast } from '../../../shared/hooks/useToast';
import * as XLSX from 'xlsx';
import coordinatorApi from '../services/coordinatorApi';
import { useCoordinatorContext } from '../context/CoordinatorContext';

const CoordinatorReports = () => {
    const [selectedReport, setSelectedReport] = useState(null);
    const { academicContext } = useCoordinatorContext();
    const { showToast } = useToast();

    const [filters, setFilters] = useState({
        minMarks: '',
        maxMarks: '',
        guideId: '',
        panelId: '',
        status: ''
    });

    /*
     * State for dynamic data
     */
    const [facultyList, setFacultyList] = useState([]);
    const [panelList, setPanelList] = useState([]);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [profile, setProfile] = useState(null);

    // Fetch configuration data on mount
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const [profileRes, facultyRes, panelsRes] = await Promise.all([
                    coordinatorApi.fetchProfile(),
                    coordinatorApi.fetchFaculty(),
                    coordinatorApi.fetchPanels()
                ]);

                if (profileRes.success) {
                    setProfile(profileRes.data);
                }

                if (facultyRes.success) {
                    setFacultyList(facultyRes.faculty || []);
                }

                if (panelsRes.success) {
                    setPanelList(panelsRes.panels || []);
                }
            } catch (error) {
                console.error("Error fetching report config:", error);
                showToast("Failed to load filter options", "error");
            } finally {
                setLoadingConfig(false);
            }
        };

        fetchConfig();
    }, []);

    const reportTypes = [
        {
            id: 'master-report',
            name: 'Master Report (All Data)',
            description: 'Export complete database - all students, faculty, projects, and marks (TO BE COMPLETED)',
            icon: TableCellsIcon,
            filters: [],
            color: 'indigo',
            isMaster: true
        },
        {
            id: 'student-marks-range',
            name: 'Students by Marks Range',
            description: 'Generate report of students with marks in customizable ranges',
            icon: ChartBarIcon,
            filters: ['minMarks', 'maxMarks'],
            color: 'blue'
        },
        {
            id: 'panel-marks-entry',
            name: 'Panel Marks Entry Status',
            description: 'Report on panels and how many students they have entered marks for',
            icon: ClipboardDocumentCheckIcon,
            filters: ['panelId'],
            color: 'green'
        },
        {
            id: 'guide-student-list',
            name: 'Guide-wise Student List',
            description: 'List of students under each guide with their marks',
            icon: AcademicCapIcon,
            filters: ['guideId'],
            color: 'purple'
        },
        {
            id: 'comprehensive-marks',
            name: 'Comprehensive Marks Report',
            description: 'Complete marks report with guide and panel marks for all students',
            icon: TableCellsIcon,
            filters: [],
            color: 'indigo'
        },
        {
            id: 'faculty-workload',
            name: 'Faculty Workload Report',
            description: 'Report on faculty members and their project assignments',
            icon: UserGroupIcon,
            filters: [],
            color: 'orange'
        },
        {
            id: 'pending-marks',
            name: 'Pending Marks Report',
            description: 'Students with incomplete marks from guide or panel',
            icon: ClipboardDocumentCheckIcon,
            filters: ['status'],
            color: 'red'
        },
        {
            id: 'marks-distribution',
            name: 'Marks Distribution Analysis',
            description: 'Statistical analysis of marks distribution across ranges',
            icon: ChartBarIcon,
            filters: [],
            color: 'teal'
        },
        {
            id: 'student-complete-details',
            name: 'Student Complete Details',
            description: 'Comprehensive student report with project, guide, panel, and marks',
            icon: UserGroupIcon,
            filters: [],
            color: 'pink'
        }
    ];

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const validateFilters = () => {
        if (!selectedReport) return false;
        // No mandatory filters for PC yet, unless we add some.
        return true;
    };

    /* 
     * Helper to format current date for filenames
     */
    const getFormattedDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    const handleGenerateReport = async () => {
        try {
            const report = reportTypes.find(r => r.id === selectedReport);

            // Warning for master report due to size
            if (report.isMaster) {
                if (!window.confirm('Master Report will export ALL data from your program. This may take several minutes. Continue?')) {
                    return;
                }
            }

            showToast(`Generating ${report.name}...`, 'loading');

            // Fetch data from backend
            const response = await coordinatorApi.fetchReportData(selectedReport, filters);

            if (!response.success || !response.data) {
                throw new Error(response.message || 'No data received');
            }

            const reportData = response.data;

            // Handle Excel Generation
            const wb = XLSX.utils.book_new();

            if (report.isMaster) {
                // Master Report: Multiple Sheets
                if (reportData.students) {
                    // Flatten or adapt if necessary, but ReportService usually returns nice JSON
                    const wsStudents = XLSX.utils.json_to_sheet(reportData.students);
                    XLSX.utils.book_append_sheet(wb, wsStudents, "Students");
                }
                if (reportData.faculty) {
                    const wsFaculty = XLSX.utils.json_to_sheet(reportData.faculty);
                    XLSX.utils.book_append_sheet(wb, wsFaculty, "Faculty");
                }
                if (reportData.projects) {
                    const wsProjects = XLSX.utils.json_to_sheet(reportData.projects);
                    XLSX.utils.book_append_sheet(wb, wsProjects, "Projects");
                }
                if (reportData.marks) {
                    const wsMarks = XLSX.utils.json_to_sheet(reportData.marks);
                    XLSX.utils.book_append_sheet(wb, wsMarks, "Marks");
                }
                if (reportData.panels) {
                    const wsPanels = XLSX.utils.json_to_sheet(reportData.panels);
                    XLSX.utils.book_append_sheet(wb, wsPanels, "Panels");
                }
            } else {
                // Standard Report: Single Sheet
                if (Array.isArray(reportData)) {
                    const ws = XLSX.utils.json_to_sheet(reportData);
                    XLSX.utils.book_append_sheet(wb, ws, "Report Data");
                } else {
                    const ws = XLSX.utils.json_to_sheet([reportData]); // Fallback
                    XLSX.utils.book_append_sheet(wb, ws, "Data");
                }
            }

            // Download File
            const fileName = `${selectedReport}_${profile?.program || 'SUT'}_${getFormattedDate()}.xlsx`;
            XLSX.writeFile(wb, fileName);

            showToast('Report generated successfully!', 'success');
            console.log('Report generated:', fileName);
        } catch (error) {
            console.error("Report Generation Error:", error);
            showToast(error.message || 'Error generating report', 'error');
        }
    };

    const selectedReportData = reportTypes.find(r => r.id === selectedReport);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <CoordinatorTabs />

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                        <p className='text-sm text-gray-500'>
                            {profile ? `${profile.school} • ${profile.program} • ${profile.academicYear}` : 'Loading context...'}
                        </p>
                    </div>
                </div>

                {/* Report Types */}
                <div className="mb-6 bg-white rounded-lg shadow-sm p-2">
                    {!loadingConfig ? (
                        <div className="flex flex-wrap gap-2">
                            {reportTypes.map((report) => {
                                const Icon = report.icon;
                                const isActive = selectedReport === report.id;

                                return (
                                    <button
                                        key={report.id}
                                        onClick={() => setSelectedReport(report.id)}
                                        className={`
                    flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap
                    ${isActive
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                            }
                  `}
                                        title={report.description}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{report.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-gray-500">Loading configuration...</div>
                    )}
                </div>

                {/* Filters and Preview */}
                <div>
                    {!selectedReport ? (
                        <Card className="p-12 text-center">
                            <DocumentArrowDownIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Select a Report Type
                            </h3>
                            <p className="text-sm text-gray-600">
                                Choose a report type from above to configure filters and generate Excel export
                            </p>
                        </Card>
                    ) : (
                        <Card className="p-6">
                            <div className="mb-6">
                                <p className="text-sm text-gray-600">
                                    {selectedReportData?.description}
                                </p>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Configure Filters
                            </h3>

                            <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-yellow-700">
                                            Reports are automatically filtered for <strong>{profile?.program} ({profile?.school}) - {profile?.academicYear}</strong>.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {selectedReportData?.isMaster ? (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <TableCellsIcon className="h-6 w-6 text-blue-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-blue-900 mb-2">Master Report - Complete Database Export</h4>
                                            <p className="text-sm text-blue-800 mb-3">
                                                This report will export ALL data for your program into a comprehensive Excel file with multiple sheets.
                                            </p>
                                            <div className="text-sm text-blue-700 space-y-1">
                                                <p className="font-medium">Included Data:</p>
                                                <ul className="list-disc list-inside ml-2 space-y-1">
                                                    <li>Students - Profile, contact, and academic info</li>
                                                    <li>Faculty - Guide assignments, workload (within program)</li>
                                                    <li>Projects - Titles, descriptions, status, deadlines</li>
                                                    <li>Marks - Guide marks, panel marks, rubrics</li>
                                                    <li>Panels - Panel compositions and assignments</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                School (Locked)
                                            </label>
                                            <Input
                                                type="text"
                                                value={profile?.school || "Loading..."}
                                                disabled
                                                className="bg-gray-100 text-gray-500 cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Program (Locked)
                                            </label>
                                            <Input
                                                type="text"
                                                value={profile?.program || "Loading..."}
                                                disabled
                                                className="bg-gray-100 text-gray-500 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    {/* Marks Range Filters */}
                                    {selectedReportData?.filters.includes('minMarks') && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Minimum Marks
                                            </label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={filters.minMarks}
                                                onChange={(e) => handleFilterChange('minMarks', e.target.value)}
                                                placeholder="e.g., 0"
                                            />
                                        </div>
                                    )}

                                    {selectedReportData?.filters.includes('maxMarks') && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Maximum Marks
                                            </label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={filters.maxMarks}
                                                onChange={(e) => handleFilterChange('maxMarks', e.target.value)}
                                                placeholder="e.g., 100"
                                            />
                                        </div>
                                    )}

                                    {/* Faculty Filters */}
                                    {selectedReportData?.filters.includes('guideId') && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Guide (Optional)
                                            </label>
                                            <select
                                                value={filters.guideId}
                                                onChange={(e) => handleFilterChange('guideId', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">All Guides</option>
                                                {facultyList.map(f => (
                                                    <option key={f._id} value={f._id}>{f.name} ({f.employeeId})</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {selectedReportData?.filters.includes('panelId') && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Panel (Optional)
                                            </label>
                                            <select
                                                value={filters.panelId}
                                                onChange={(e) => handleFilterChange('panelId', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">All Panels</option>
                                                {panelList.map(p => (
                                                    <option key={p._id} value={p._id}>{p.panelName || `Panel ${p._id.substr(-6)}`}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Status Filter */}
                                    {selectedReportData?.filters.includes('status') && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Marks Status
                                            </label>
                                            <select
                                                value={filters.status}
                                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">All</option>
                                                <option value="complete">Complete</option>
                                                <option value="guide-pending">Guide Marks Pending</option>
                                                <option value="panel-pending">Panel Marks Pending</option>
                                                <option value="both-pending">Both Pending</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <Button
                                    onClick={handleGenerateReport}
                                    disabled={!validateFilters()}
                                    className="w-full md:w-auto"
                                >
                                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                                    Generate Excel Report
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CoordinatorReports;
