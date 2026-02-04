// src/features/admin/utils/panelUtils.js
import * as XLSX from 'xlsx';

/**
 * Download faculty upload template
 */
export const downloadFacultyTemplate = () => {
  const template = [
    ['employeeId'],
    ['EMP001'],
    ['EMP002'],
    ['EMP003'],
    ['EMP004'],
    ['EMP005']
  ];

  const ws = XLSX.utils.aoa_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Faculty Template');

  // Set column widths
  ws['!cols'] = [
    { wch: 15 }
  ];

  XLSX.writeFile(wb, 'faculty_upload_template.xlsx');
};

/**
 * Download panel upload template
 */
export const downloadPanelTemplate = () => {
  const template = [
    ['Panel Name', 'Faculty Employee ID 1', 'Faculty Employee ID 2', 'Faculty Employee ID 3', 'Specializations'], /*'Panel Type'*/
    ['Panel A', 'EMP001', 'EMP002', 'EMP003', 'AI/ML, Web Dev'], /*Regular*/
    ['Panel B', 'EMP004', 'EMP005', '', 'Cloud Computing'], /* Temperory */
    ['Panel C', 'EMP006', '', '', 'Blockchain'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Panel Template');

  // Set column widths
  ws['!cols'] = [
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 25 },
    { wch: 15 }
  ];

  XLSX.writeFile(wb, 'panel_upload_template.xlsx');
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
 * Validate panel Excel file
 */
export const validatePanelFile = (file) => {
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
 * Parse faculty list Excel file - expects single employeeId column
 */
export const parseFacultyListExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          reject(new Error('Excel file is empty'));
          return;
        }

        // Extract employeeId from the data
        const employeeIds = jsonData
          .map((row, index) => {
            // Look for employeeId in various column name formats
            const id = row['employeeId'] || row['Employee ID'] || row['empId'] || row['EmpId'];
            return id ? String(id).trim() : null;
          })
          .filter(Boolean);

        if (employeeIds.length === 0) {
          reject(new Error('No valid employee IDs found in the file. Expected column named "employeeId", "Employee ID", or "empId"'));
          return;
        }

        resolve(employeeIds);
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
 * Parse panel Excel file
 */
export const parsePanelExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          reject(new Error('Excel file is empty'));
          return;
        }

        // Check for at least Panel Name and one Faculty Employee ID
        const firstRow = jsonData[0] || {};
        if (!firstRow['Panel Name']) {
          reject(new Error('Missing required column: Panel Name'));
          return;
        }

        // Transform data - extract faculty employee IDs dynamically
        const panels = jsonData.map((row, index) => {
          const facultyIds = [];

          // Look for Faculty Employee ID columns
          for (let i = 1; i <= 10; i++) {
            const key = `Faculty Employee ID ${i}`;
            if (row[key] && row[key].toString().trim()) {
              facultyIds.push(row[key].toString().trim());
            }
          }

          return {
            panelName: row['Panel Name'] || `Panel ${index + 1}`,
            facultyEmployeeIds: facultyIds,
            specializations: row['Specializations']
              ? row['Specializations'].split(',').map(s => s.trim())
              : [],
            // panelType: row['Panel Type'] || 'regular',
            rowNumber: index + 2
          };
        });

        // Validate each panel has at least one faculty
        const invalidPanels = panels.filter(p => p.facultyEmployeeIds.length === 0);
        if (invalidPanels.length > 0) {
          reject(new Error(
            `Panels must have at least one faculty member. Invalid rows: ${invalidPanels.map(p => p.rowNumber).join(', ')}`
          ));
          return;
        }

        resolve(panels);
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
  // Priority 1: If panel has a custom panelName, use it
  if (panel.panelName && panel.panelName !== panel._id && panel.panelName !== panel.id) {
    return panel.panelName;
  }

  // Priority 2: If panel has members array with populated faculty, join their names
  if (panel.members && Array.isArray(panel.members) && panel.members.length > 0) {
    const facultyNames = panel.members
      .map(m => m.faculty?.name || m.name)
      .filter(Boolean);

    if (facultyNames.length > 0) {
      return facultyNames.join(' & ');
    }
  }

  // Priority 3: If panel has faculty array, join their names with &
  if (panel.faculty && Array.isArray(panel.faculty) && panel.faculty.length > 0) {
    return panel.faculty.map(f => f.name).join(' & ');
  }

  // Fallback: Use Panel with ID suffix (last 4 chars) to avoid "Unknown"
  const suffix = panel.id ? panel.id.substr(-4) : (panel._id ? panel._id.substr(-4) : '');
  return `Panel ${panel.panelNumber || suffix || '?'}`;
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
  return statusLabels[status] || 'Unmarked';
};
