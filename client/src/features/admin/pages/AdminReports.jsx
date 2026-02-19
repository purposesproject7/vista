// src/features/admin/pages/AdminReports.jsx
import React, { useState, useEffect } from 'react';
import Navbar from '../../../shared/components/Navbar';
import AdminTabs from '../components/shared/AdminTabs';
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
  ClockIcon
} from '@heroicons/react/24/outline';
import { processTimeSheetData } from '../utils/reportHelpers';
import { YEARS } from '../../../shared/constants/config';
import { useToast } from '../../../shared/hooks/useToast';
import * as XLSX from 'xlsx';
import * as adminApi from '../services/adminApi';
import { useAdminContext } from '../context/AdminContext';

const AdminReports = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const { academicContext, updateAcademicContext } = useAdminContext();
  const { showToast } = useToast();

  const [filters, setFilters] = useState({
    school: academicContext.school || '',
    programme: academicContext.program || '',
    year: academicContext.year || '',
    semester: '',
    minMarks: '',
    maxMarks: '',
    guideId: '',
    panelId: '',
    status: ''
  });

  /*
   * State for dynamic data
   */
  const [masterData, setMasterData] = useState({ schools: [], programs: [], academicYears: [] });
  const [facultyList, setFacultyList] = useState([]);
  const [panelList, setPanelList] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Sync filters with academicContext when context changes (optional, or just on mount)
  // Decided: Sync one-way on mount is handled by useState initializer.
  // Two-way sync: if user changes filter here, should it update global context?
  // "Throughout the admin page... persistent" implies yes.
  useEffect(() => {
    // If context has values and filters are empty, update filters?
    // Or just let the user change them.
    // If the user changes them here, we should update the context so it persists to other pages.
  }, []);

  // Fetch configuration data on mount
  React.useEffect(() => {
    const fetchConfig = async () => {
      try {
        const [masterRes, facultyRes, panelsRes] = await Promise.all([
          adminApi.fetchMasterData(),
          adminApi.fetchFaculty(),
          adminApi.fetchPanels()
        ]);

        if (masterRes.success) {
          setMasterData({
            schools: masterRes.data.schools || [],
            programs: masterRes.data.programs || [],
            academicYears: masterRes.data.academicYears || []
          });
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
      filters: ['school', 'programme', 'year', 'minMarks', 'maxMarks'],
      color: 'blue'
    },
    {
      id: 'panel-marks-entry',
      name: 'Panel Marks Entry Status',
      description: 'Report on panels and how many students they have entered marks for',
      icon: ClipboardDocumentCheckIcon,
      filters: ['school', 'programme', 'year', 'panelId'],
      color: 'green'
    },
    {
      id: 'guide-student-list',
      name: 'Guide-wise Student List',
      description: 'List of students under each guide with their marks',
      icon: AcademicCapIcon,
      filters: ['school', 'programme', 'year', 'guideId'],
      color: 'purple'
    },
    {
      id: 'comprehensive-marks',
      name: 'Comprehensive Marks Report',
      description: 'Complete marks report with guide and panel marks for all students',
      icon: TableCellsIcon,
      filters: ['school', 'programme', 'year'],
      color: 'indigo'
    },
    {
      id: 'faculty-workload',
      name: 'Faculty Workload Report',
      description: 'Report on faculty members and their project assignments',
      icon: UserGroupIcon,
      filters: ['school', 'programme', 'year'],
      color: 'orange'
    },
    {
      id: 'pending-marks',
      name: 'Pending Marks Report',
      description: 'Students with incomplete marks from guide or panel',
      icon: ClipboardDocumentCheckIcon,
      filters: ['school', 'programme', 'year', 'status'],
      color: 'red'
    },
    {
      id: 'marks-distribution',
      name: 'Marks Distribution Analysis',
      description: 'Statistical analysis of marks distribution across ranges',
      icon: ChartBarIcon,
      filters: ['school', 'programme', 'year'],
      color: 'teal'
    },
    {
      id: 'student-complete-details',
      name: 'Student Complete Details',
      description: 'Comprehensive student report with project, guide, panel, and marks',
      icon: UserGroupIcon,
      filters: ['school', 'programme', 'year'],
      color: 'pink'
    },
    {
      id: 'faculty-time-sheet',
      name: 'Faculty Time Sheet (Activity Log)',
      description: 'Log of faculty activities including logins, marks entry, and approvals',
      icon: ChartBarIcon, // Debug: ClockIcon might be missing?
      filters: ['year', 'school', 'programme'], // Programme optional, but useful context
      color: 'cyan'
    },
    {
      id: 'team-details',
      name: 'Team Details Report',
      description: 'Detailed list of project teams, students, guides, and panels',
      icon: UserGroupIcon,
      filters: ['school', 'programme', 'year'],
      color: 'indigo'
    }
  ];

  const handleFilterChange = (field, value) => {
    setFilters(prev => {
      const updated = { ...prev, [field]: value };

      // Reset dependent filters
      if (field === 'school') {
        updated.programme = '';
      }

      return updated;
    });

    // Update global context for relevant fields to maintain persistence
    if (field === 'school') {
      updateAcademicContext({ school: value, program: '' });
    } else if (field === 'programme') {
      updateAcademicContext({ program: value });
    } else if (field === 'year') {
      updateAcademicContext({ year: value });
    }
  };

  const getProgrammes = () => {
    if (!filters.school) return [];
    return masterData.programs.filter(p => p.school === filters.school);
  };

  const validateFilters = () => {
    if (!selectedReport) return false;

    const report = reportTypes.find(r => r.id === selectedReport);
    if (!report) return false;

    // Master report has no required filters
    if (report.isMaster) return true;

    // Check required filters
    if (report.filters.includes('school') && !filters.school) return false;
    if (report.filters.includes('programme') && !filters.programme) return false;
    if (report.filters.includes('year') && !filters.year) return false;

    return true;
  };

  /* 
   * Helper to format current date for filenames
   */
  const getFormattedDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const handleGenerateReport = async () => {
    if (!validateFilters()) {
      showToast('Please select all required filters', 'error');
      return;
    }

    try {
      const report = reportTypes.find(r => r.id === selectedReport);

      // Warning for master report due to size
      if (report.isMaster) {
        if (!window.confirm('Master Report will export ALL data from the database. This may take several minutes. Continue?')) {
          return;
        }
      }

      showToast(`Generating ${report.name}...`, 'loading');

      // Fetch data from backend
      const response = await adminApi.fetchReportData(selectedReport, filters);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'No data received');
      }

      const reportData = response.data;

      // Handle Excel Generation
      const wb = XLSX.utils.book_new();

      if (report.isMaster) {
        // Master Report: Multiple Sheets
        if (reportData.students) {
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
      } else if (selectedReport === 'faculty-time-sheet') {
        processTimeSheetData(reportData, wb, XLSX.utils);
      } else {
        // Standard Report: Single Sheet
        // Flatten data if needed? Backend sends flat JSON usually.
        // If data is array
        if (Array.isArray(reportData)) {
          const ws = XLSX.utils.json_to_sheet(reportData);
          XLSX.utils.book_append_sheet(wb, ws, "Report Data");
        } else {
          // If object (e.g. { summary: ..., details: ... }) - complex handling
          // For now assuming backend returns array for specific reports
          const ws = XLSX.utils.json_to_sheet([reportData]); // Fallback
          XLSX.utils.book_append_sheet(wb, ws, "Data");
        }
      }

      // Download File
      const fileName = `${selectedReport}_${getFormattedDate()}.xlsx`;
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
      <AdminTabs />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>

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

              {selectedReportData?.isMaster ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <TableCellsIcon className="h-6 w-6 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">Master Report - Complete Database Export</h4>
                      <p className="text-sm text-blue-800 mb-3">
                        This report will export ALL data from the database into a comprehensive Excel file with multiple sheets.
                      </p>
                      <div className="text-sm text-blue-700 space-y-1">
                        <p className="font-medium">Included Data (To be finalized based on DB schema):</p>
                        <ul className="list-disc list-inside ml-2 space-y-1">
                          <li>All Students - Complete profile, contact, and academic info</li>
                          <li>All Faculty - Guide and panel assignments, workload</li>
                          <li>All Projects - Titles, descriptions, status, deadlines</li>
                          <li>All Marks - Guide marks, panel marks, rubrics, breakdowns</li>
                          <li>Reviews & Comments - All feedback and review history</li>
                          <li>Assignments - Guide-student and panel-student mappings</li>
                          <li>Academic Structure - Schools, programmes, years, semesters</li>
                          <li>Requests - All change requests and their status</li>
                          <li>Team Configurations - Team size settings per context</li>
                          <li>Rubrics - All rubric templates and mark levels</li>
                        </ul>
                      </div>
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-xs text-yellow-800 font-medium">
                          ⚠️ Note: This is a heavy operation. Large datasets may take several minutes to compile.
                          You will receive a notification when the report is ready for download.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Academic Context Filters */}
                  {selectedReportData?.filters.includes('school') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        School <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={filters.school}
                        onChange={(e) => handleFilterChange('school', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select School</option>
                        {masterData.schools.map((school) => (
                          <option key={school._id || school.code} value={school.code}>
                            {school.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedReportData?.filters.includes('programme') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Programme <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={filters.programme}
                        onChange={(e) => handleFilterChange('programme', e.target.value)}
                        disabled={!filters.school}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Select Programme</option>
                        {getProgrammes().map((prog) => (
                          <option key={prog._id || prog.code} value={prog.code}>
                            {prog.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedReportData?.filters.includes('year') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={filters.year}
                        onChange={(e) => handleFilterChange('year', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Year</option>
                        {masterData.academicYears.map((year) => (
                          <option key={year._id || year.year} value={year.year}>
                            {year.year}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

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

export default AdminReports;
