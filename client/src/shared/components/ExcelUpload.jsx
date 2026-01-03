// src/shared/components/ExcelUpload.jsx
import React, { useState, useCallback } from 'react';
import { ArrowUpTrayIcon, DocumentArrowDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import Button from './Button';
import Card from './Card';

const ExcelUpload = ({
  onDataParsed,
  templateColumns,
  entityName = 'Data',
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  className = ''
}) => {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const downloadTemplate = useCallback(() => {
    // Create workbook with template headers
    const ws = XLSX.utils.aoa_to_sheet([templateColumns]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    
    // Generate and download file
    XLSX.writeFile(wb, `${entityName}_Template.xlsx`);
  }, [templateColumns, entityName]);

  const validateFile = (file) => {
    // Check file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!validTypes.includes(file.type)) {
      return 'Invalid file type. Please upload .xlsx, .xls, or .csv file.';
    }

    // Check file size
    if (file.size > maxFileSize) {
      return `File size exceeds ${maxFileSize / 1024 / 1024}MB limit.`;
    }

    return null;
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setError('');
    setFile(selectedFile);

    // Validate file
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      setParsedData([]);
      return;
    }

    // Parse file
    try {
      setIsProcessing(true);
      const data = await parseExcelFile(selectedFile);
      setParsedData(data);
      
      if (onDataParsed) {
        onDataParsed(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to parse file');
      setParsedData([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          
          if (jsonData.length === 0) {
            reject(new Error('The Excel file is empty'));
            return;
          }

          // Validate columns
          const fileColumns = Object.keys(jsonData[0]);
          const missingColumns = templateColumns.filter(col => !fileColumns.includes(col));
          
          if (missingColumns.length > 0) {
            reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`));
            return;
          }

          resolve(jsonData);
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

  const handleRemoveFile = () => {
    setFile(null);
    setParsedData([]);
    setError('');
    
    if (onDataParsed) {
      onDataParsed([]);
    }
  };

  return (
    <div className={className}>
      <Card>
        <div className="space-y-4">
          {/* Download Template Button */}
          <div className="flex justify-between items-center pb-4 border-b">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Excel File Upload</h3>
              <p className="text-xs text-gray-600 mt-1">
                Upload an Excel file with {entityName.toLowerCase()} data
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={downloadTemplate}
            >
              <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block">
              <div className={`
                relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                transition-colors duration-200
                ${file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}
                ${error ? 'border-red-300 bg-red-50' : ''}
              `}>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <ArrowUpTrayIcon className={`
                  w-12 h-12 mx-auto mb-3
                  ${file ? 'text-green-500' : error ? 'text-red-500' : 'text-gray-400'}
                `} />
                
                {!file ? (
                  <>
                    <p className="text-sm font-medium text-gray-900">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      .xlsx, .xls, or .csv files (max {maxFileSize / 1024 / 1024}MB)
                    </p>
                  </>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-700 flex items-center justify-center gap-2">
                      <span className="truncate max-w-xs">{file.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile();
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </p>
                    <p className="text-xs text-gray-600">
                      {parsedData.length} rows parsed
                    </p>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600 mt-2">Processing file...</p>
            </div>
          )}

          {/* Preview Data (first 5 rows) */}
          {parsedData.length > 0 && !isProcessing && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Preview (first 5 rows)
              </h4>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {templateColumns.map(col => (
                        <th
                          key={col}
                          className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parsedData.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        {templateColumns.map(col => (
                          <td
                            key={col}
                            className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap"
                          >
                            {row[col]?.toString() || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 5 && (
                <p className="text-xs text-gray-600 mt-2 text-center">
                  ... and {parsedData.length - 5} more rows
                </p>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ExcelUpload;
