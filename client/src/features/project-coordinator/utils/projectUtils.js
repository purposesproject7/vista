// src/features/project-coordinator/utils/projectUtils.js
import * as XLSX from 'xlsx';

/**
 * Download project template Excel file
 */
export const downloadProjectTemplate = () => {
  const templateData = [
    {
      'Project Title': 'Example Project Title',
      'Guide Employee ID': 'EMP001',
      'Team Members (comma-separated)': 'Registration No: 21BCE1001, 21BCE1002'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  worksheet['!cols'] = [
    { wch: 30 },
    { wch: 20 },
    { wch: 50 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');

  XLSX.writeFile(workbook, 'project_template.xlsx');
};

/**
 * Validate project Excel file
 * @param {File} file - The Excel file to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateProjectFile = (file) => {
  const errors = [];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  // Check file type
  if (!['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'].includes(file.type)) {
    errors.push('File must be an Excel file (.xlsx or .xls)');
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size exceeds 5MB limit (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Parse project Excel file
 * @param {File} file - The Excel file to parse
 * @returns {Promise<Array>} - Array of project objects
 */
export const parseProjectExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          reject(new Error('Excel file is empty'));
          return;
        }

        // Validate required columns
        const requiredColumns = [
          'Project Title',
          'Guide Employee ID',
          'Team Members (comma-separated)'
        ];

        const firstRow = jsonData[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));

        if (missingColumns.length > 0) {
          reject(
            new Error(
              `Missing required columns: ${missingColumns.join(', ')}`
            )
          );
          return;
        }

        // Process and validate data
        const projects = jsonData.map((row, index) => {
          const projectTitle = row['Project Title']?.toString().trim();
          const guideEmployeeID = row['Guide Employee ID']?.toString().trim();
          const teamMembersStr = row['Team Members (comma-separated)']?.toString().trim();

          // Validate required fields
          const errors = [];
          if (!projectTitle) errors.push(`Row ${index + 2}: Project Title is required`);
          if (!guideEmployeeID) errors.push(`Row ${index + 2}: Guide Employee ID is required`);
          if (!teamMembersStr) errors.push(`Row ${index + 2}: Team Members are required`);

          if (errors.length > 0) {
            reject(new Error(errors.join('; ')));
            return null;
          }

          // Parse team members - just registration numbers
          let teamMembers = [];
          if (teamMembersStr) {
            try {
              // Support both ';' and ',' as separators
              const memberStrings = teamMembersStr.split(/[;,]/).map(m => m.trim()).filter(m => m);
              teamMembers = memberStrings.map(regNo => {
                if (!regNo) {
                  throw new Error(`Invalid format in row ${index + 2}: empty registration number`);
                }
                return { registrationNumber: regNo };
              });
            } catch (error) {
              reject(error);
              return null;
            }
          }

          return {
            projectTitle,
            guideEmployeeID,
            teamMembers,
            rowNumber: index + 2
          };
        }).filter(p => p !== null);

        resolve(projects);
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

/**
 * Validate parsed project data
 * @param {Object} project - Project object to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateProjectData = (project) => {
  const errors = [];

  if (!project.projectTitle || project.projectTitle.length === 0) {
    errors.push('Project title is required');
  } else if (project.projectTitle.length > 200) {
    errors.push('Project title must be less than 200 characters');
  }

  if (!project.guideEmployeeID || project.guideEmployeeID.length === 0) {
    errors.push('Guide employee ID is required');
  }

  if (!project.teamMembers || project.teamMembers.length === 0) {
    errors.push('At least one team member is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
