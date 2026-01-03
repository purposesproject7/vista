// src/features/admin/utils/panelUtils.js
import * as XLSX from 'xlsx';

/**
 * Download faculty upload template
 */
export const downloadFacultyTemplate = () => {
  const template = [
    ['Employee ID', 'Name', 'Email', 'Department'],
    ['EMP001', 'Dr. John Doe', 'john.doe@vit.ac.in', 'CSE'],
    ['EMP002', 'Dr. Jane Smith', 'jane.smith@vit.ac.in', 'IT'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Faculty Template');
  
  // Set column widths
  ws['!cols'] = [
    { wch: 15 },
    { wch: 25 },
    { wch: 30 },
    { wch: 15 }
  ];

  XLSX.writeFile(wb, 'faculty_upload_template.xlsx');
};

/**
 * Validate uploaded Excel file
 */
export const validateFacultyFile = (file) => {
  const errors = [];

  if (!file) {
    errors.push('No file selected');
    return { isValid: false, errors };
  }

  // Check file type
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];
  
  if (!validTypes.includes(file.type)) {
    errors.push('Invalid file type. Please upload an Excel file (.xlsx or .xls)');
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push('File size exceeds 5MB limit');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Parse faculty Excel file
 */
export const parseFacultyExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate required columns
        const requiredColumns = ['Employee ID', 'Name', 'Email', 'Department'];
        const firstRow = jsonData[0] || {};
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));

        if (missingColumns.length > 0) {
          reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`));
          return;
        }

        // Transform data
        const faculty = jsonData.map((row, index) => ({
          employeeId: row['Employee ID'],
          name: row['Name'],
          email: row['Email'],
          department: row['Department'],
          rowNumber: index + 2 // Excel row number (accounting for header)
        }));

        // Validate data
        const invalidRows = faculty.filter(f => 
          !f.employeeId || !f.name || !f.email || !f.department
        );

        if (invalidRows.length > 0) {
          reject(new Error(
            `Invalid data in rows: ${invalidRows.map(r => r.rowNumber).join(', ')}`
          ));
          return;
        }

        resolve(faculty);
      } catch (error) {
        reject(new Error('Failed to parse Excel file: ' + error.message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Calculate panel statistics
 */
export const calculatePanelStats = (panels) => {
  if (!Array.isArray(panels) || panels.length === 0) {
    return {
      totalPanels: 0,
      totalFaculty: 0,
      totalProjects: 0,
      avgProjectsPerPanel: 0,
      avgFacultyPerPanel: 0
    };
  }

  const totalPanels = panels.length;
  const totalFaculty = panels.reduce((sum, panel) => 
    sum + (panel.faculty?.length || 0), 0
  );
  const totalProjects = panels.reduce((sum, panel) => 
    sum + (panel.teams?.length || 0), 0
  );

  return {
    totalPanels,
    totalFaculty,
    totalProjects,
    avgProjectsPerPanel: (totalProjects / totalPanels).toFixed(1),
    avgFacultyPerPanel: (totalFaculty / totalPanels).toFixed(1)
  };
};

/**
 * Format panel display name using faculty names joined with &
 */
export const formatPanelName = (panel) => {
  // If panel has faculty, join their names with &
  if (panel.faculty && Array.isArray(panel.faculty) && panel.faculty.length > 0) {
    return panel.faculty.map(f => f.name).join(' & ');
  }
  
  // Fallback to panelName or Panel number
  if (panel.panelName) return panel.panelName;
  return `Panel ${panel.panelNumber || panel.id}`;
};

/**
 * Get marking status color
 */
export const getMarkingStatusColor = (status) => {
  const statusColors = {
    full: 'bg-green-100 text-green-800',
    partial: 'bg-yellow-100 text-yellow-800',
    none: 'bg-gray-100 text-gray-800',
    unmarked: 'bg-red-100 text-red-800'
  };
  return statusColors[status] || statusColors.none;
};

/**
 * Get marking status label
 */
export const getMarkingStatusLabel = (status) => {
  const statusLabels = {
    full: 'Fully Marked',
    partial: 'Partially Marked',
    none: 'Not Marked',
    unmarked: 'Unmarked'
  };
  return statusLabels[status] || 'Unknown';
};
