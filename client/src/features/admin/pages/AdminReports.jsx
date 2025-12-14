// src/features/admin/pages/AdminReports.jsx
import React, { useState } from 'react';
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
  TableCellsIcon
} from '@heroicons/react/24/outline';
import { SCHOOLS, PROGRAMMES_BY_SCHOOL, YEARS, SEMESTERS } from '../../../shared/constants/config';
import { useToast } from '../../../shared/hooks/useToast';

const AdminReports = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [filters, setFilters] = useState({
    school: '',
    programme: '',
    year: '',
    semester: '',
    minMarks: '',
    maxMarks: '',
    guideId: '',
    panelId: '',
    status: ''
  });
  const { showToast } = useToast();

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
      filters: ['school', 'programme', 'year', 'semester', 'minMarks', 'maxMarks'],
      color: 'blue'
    },
    {
      id: 'panel-marks-entry',
      name: 'Panel Marks Entry Status',
      description: 'Report on panels and how many students they have entered marks for',
      icon: ClipboardDocumentCheckIcon,
      filters: ['school', 'programme', 'year', 'semester', 'panelId'],
      color: 'green'
    },
    {
      id: 'guide-student-list',
      name: 'Guide-wise Student List',
      description: 'List of students under each guide with their marks',
      icon: AcademicCapIcon,
      filters: ['school', 'programme', 'year', 'semester', 'guideId'],
      color: 'purple'
    },
    {
      id: 'comprehensive-marks',
      name: 'Comprehensive Marks Report',
      description: 'Complete marks report with guide and panel marks for all students',
      icon: TableCellsIcon,
      filters: ['school', 'programme', 'year', 'semester'],
      color: 'indigo'
    },
    {
      id: 'faculty-workload',
      name: 'Faculty Workload Report',
      description: 'Report on faculty members and their project assignments',
      icon: UserGroupIcon,
      filters: ['school', 'programme', 'year', 'semester'],
      color: 'orange'
    },
    {
      id: 'pending-marks',
      name: 'Pending Marks Report',
      description: 'Students with incomplete marks from guide or panel',
      icon: ClipboardDocumentCheckIcon,
      filters: ['school', 'programme', 'year', 'semester', 'status'],
      color: 'red'
    },
    {
      id: 'marks-distribution',
      name: 'Marks Distribution Analysis',
      description: 'Statistical analysis of marks distribution across ranges',
      icon: ChartBarIcon,
      filters: ['school', 'programme', 'year', 'semester'],
      color: 'teal'
    },
    {
      id: 'student-complete-details',
      name: 'Student Complete Details',
      description: 'Comprehensive student report with project, guide, panel, and marks',
      icon: UserGroupIcon,
      filters: ['school', 'programme', 'year', 'semester'],
      color: 'pink'
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
  };

  const getProgrammes = () => {
    if (!filters.school) return [];
    return PROGRAMMES_BY_SCHOOL[filters.school] || [];
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
    if (report.filters.includes('semester') && !filters.semester) return false;

    return true;
  };

  const handleGenerateReport = async () => {
    if (!validateFilters()) {
      showToast('Please select all required filters', 'error');
      return;
    }

    try {
      const report = reportTypes.find(r => r.id === selectedReport);
      
      // Special handling for master report
      if (report.isMaster) {
        // Show warning about large data export
        if (!window.confirm('Master Report will export ALL data from the database. This may take several minutes. Continue?')) {
          return;
        }
        
        // Simulate longer API call for master report
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        showToast('Master Report generation queued. You will be notified when ready for download.', 'success');
        
        // In production, this would:
        // 1. Trigger backend job to compile all data
        // 2. Generate comprehensive Excel with multiple sheets:
        //    - Students (all fields from students table)
        //    - Faculty (all fields from faculty table)
        //    - Projects (all fields from projects table)
        //    - Marks (guide marks, panel marks, combined)
        //    - Assignments (guide-student, panel-student mappings)
        //    - Academic Context (schools, programmes, years, semesters)
        //    - Reviews & Comments
        //    - Requests & Status
        // 3. Email download link or show in notifications
        console.log('Master report queued - will compile all database tables');
        return;
      }
      
      // Regular report generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      showToast(`${report.name} generated successfully!`, 'success');
      
      // In production, this would trigger Excel download
      console.log('Generating report:', selectedReport, 'with filters:', filters);
    } catch (error) {
      showToast('Error generating report', 'error');
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
          <p className="text-sm text-gray-600 mt-1">
            Generate customizable Excel reports for students, faculty, and marks
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Types */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Report Type</h3>
              <div className="space-y-2">
                {reportTypes.map((report) => {
                  const Icon = report.icon;
                  return (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report.id)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedReport === report.id
                          ? `border-${report.color}-500 bg-${report.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 mt-0.5 ${
                          selectedReport === report.id 
                            ? `text-${report.color}-600` 
                            : 'text-gray-400'
                        }`} />
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${
                            selectedReport === report.id 
                              ? `text-${report.color}-900` 
                              : 'text-gray-900'
                          }`}>
                            {report.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {report.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Filters and Preview */}
          <div className="lg:col-span-2">
            {!selectedReport ? (
              <Card className="p-12 text-center">
                <DocumentArrowDownIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select a Report Type
                </h3>
                <p className="text-sm text-gray-600">
                  Choose a report type from the left to configure filters and generate Excel export
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Report Header */}
                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    {selectedReportData && (
                      <>
                        <div className={`p-3 rounded-lg bg-${selectedReportData.color}-100`}>
                          {React.createElement(selectedReportData.icon, {
                            className: `h-8 w-8 text-${selectedReportData.color}-600`
                          })}
                        </div>
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-gray-900">
                            {selectedReportData.name}
                          </h2>
                          <p className="text-sm text-gray-600 mt-1">
                            {selectedReportData.description}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </Card>

                {/* Filters */}
                <Card className="p-6">
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
                          {SCHOOLS.map((school) => (
                            <option key={school.id} value={school.id}>
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
                          {getProgrammes().map((programme) => (
                            <option key={programme.id} value={programme.id}>
                              {programme.name}
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
                          {YEARS.map((year) => (
                            <option key={year.id} value={year.id}>
                              {year.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedReportData?.filters.includes('semester') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Semester <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={filters.semester}
                          onChange={(e) => handleFilterChange('semester', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Semester</option>
                          {SEMESTERS.map((semester) => (
                            <option key={semester.id} value={semester.id}>
                              {semester.name}
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
                        <Input
                          type="text"
                          value={filters.guideId}
                          onChange={(e) => handleFilterChange('guideId', e.target.value)}
                          placeholder="Enter guide ID or leave empty for all"
                        />
                      </div>
                    )}

                    {selectedReportData?.filters.includes('panelId') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Panel (Optional)
                        </label>
                        <Input
                          type="text"
                          value={filters.panelId}
                          onChange={(e) => handleFilterChange('panelId', e.target.value)}
                          placeholder="Enter panel ID or leave empty for all"
                        />
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
