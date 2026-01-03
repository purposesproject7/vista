// src/features/project-coordinator/utils/studentUtils.js
import * as XLSX from 'xlsx';

/**
 * Download student upload template
 */
export const downloadStudentTemplate = () => {
  const template = [
    ['Registration Number', 'Name', 'Email ID'],
    ['21BCE1001', 'John Doe', 'john.doe@vitstudent.ac.in'],
    ['21BCE1002', 'Jane Smith', 'jane.smith@vitstudent.ac.in'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Student Template');
  
  // Set column widths
  ws['!cols'] = [
    { wch: 20 },
    { wch: 25 },
    { wch: 30 }
  ];

  XLSX.writeFile(wb, 'student_upload_template.xlsx');
};

/**
 * Validate uploaded Excel file
 */
export const validateStudentFile = (file) => {
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
 * Parse student Excel file
 */
export const parseStudentExcel = async (file) => {
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
        const requiredColumns = ['Registration Number', 'Name', 'Email ID'];
        const firstRow = jsonData[0] || {};
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));

        if (missingColumns.length > 0) {
          reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`));
          return;
        }

        // Transform data
        const students = jsonData.map((row, index) => ({
          regNo: row['Registration Number'],
          name: row['Name'],
          emailId: row['Email ID'],
          rowNumber: index + 2 // Excel row number (accounting for header)
        }));

        // Validate data
        const invalidRows = students.filter(s => 
          !s.regNo || !s.name || !s.emailId
        );

        if (invalidRows.length > 0) {
          const rowNumbers = invalidRows.map(r => r.rowNumber).join(', ');
          reject(new Error(`Invalid data in rows: ${rowNumbers}. Ensure all fields are filled.`));
          return;
        }

        resolve(students);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
};
