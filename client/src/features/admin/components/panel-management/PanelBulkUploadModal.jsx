// src/features/admin/components/panel-management/PanelBulkUploadModal.jsx
import React, { useState } from "react";
import Modal from "../../../../shared/components/Modal";
import ExcelUpload from "../../../../shared/components/ExcelUpload";
import { bulkCreatePanels } from "../../../../services/adminApi";

const PanelBulkUploadModal = ({ isOpen, onClose, filters }) => {
  const [parsedData, setParsedData] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploading, setUploading] = useState(false);

  // ...

  const handleUpload = async () => {
    if (!parsedData || parsedData.length === 0) {
      setUploadStatus({ type: "error", message: "No data to upload" });
      return;
    }

    setUploading(true);
    setUploadStatus({ type: "info", message: "Uploading..." });

    try {
      const response = await bulkCreatePanels(parsedData);

      setUploadStatus({
        type: "success",
        message: `Successfully created ${response.data.created} panels`,
      });

      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      setUploadStatus({
        type: "error",
        message: error.message || "Failed to upload panel data",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setParsedData(null);
    setUploadStatus(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Upload Panels"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            Instructions:
          </h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Download the template and fill in panel details</li>
            <li>Required field: memberEmployeeIds</li>
            <li>
              memberEmployeeIds: Enter comma-separated faculty employee IDs
            </li>
            <li>Minimum 2 members required per panel</li>
            <li>panelType: Review, Final, Viva, etc.</li>
            {filters && (
              <li>
                Panels will be added to: {filters.school} - {filters.department}{" "}
                ({filters.academicYear})
              </li>
            )}
          </ul>
        </div>

        {/* Excel Upload Component */}
        <ExcelUpload
          onDataParsed={handleDataParsed}
          templateColumns={PANEL_TEMPLATE_COLUMNS}
          entityName="Panels"
          maxFileSize={5 * 1024 * 1024}
        />

        {/* Preview */}
        {parsedData && parsedData.length > 0 && (
          <div className="border border-gray-200 rounded-lg">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900">
                Preview ({parsedData.length} records)
              </h4>
            </div>
            <div className="max-h-64 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      Panel #
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      Members
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {parsedData.slice(0, 5).map((panel, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        Panel {index + 1}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {panel.memberEmployeeIds.join(", ")}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {panel.panelType || "Review"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 5 && (
                <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 text-center">
                  ... and {parsedData.length - 5} more records
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Message */}
        {uploadStatus && (
          <div
            className={`flex items-center space-x-2 p-3 rounded-lg ${
              uploadStatus.type === "success"
                ? "bg-green-50 border border-green-200"
                : uploadStatus.type === "error"
                ? "bg-red-50 border border-red-200"
                : "bg-blue-50 border border-blue-200"
            }`}
          >
            {uploadStatus.type === "success" ? (
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            ) : uploadStatus.type === "error" ? (
              <XCircleIcon className="w-5 h-5 text-red-600" />
            ) : null}
            <p
              className={`text-sm ${
                uploadStatus.type === "success"
                  ? "text-green-800"
                  : uploadStatus.type === "error"
                  ? "text-red-800"
                  : "text-blue-800"
              }`}
            >
              {uploadStatus.message}
            </p>
          </div>
        )}

        {/* Actions */}
        {parsedData && parsedData.length > 0 && (
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading
                ? "Uploading..."
                : `Create ${parsedData.length} Panels`}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PanelBulkUploadModal;
