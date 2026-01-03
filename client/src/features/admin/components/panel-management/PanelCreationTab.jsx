// src/features/admin/components/panel-management/PanelCreationTab.jsx
import React, { useState, useCallback } from 'react';
import { ArrowUpTrayIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import AcademicFilterSelector from '../student-management/AcademicFilterSelector';
import Card from '../../../../shared/components/Card';
import Button from '../../../../shared/components/Button';
import PanelBulkUploadModal from './PanelBulkUploadModal';
import { createPanel, autoCreatePanels } from '../../services/adminApi';
import { useToast } from '../../../../shared/hooks/useToast';

const PanelCreationTab = () => {
  const [filters, setFilters] = useState(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isCreatingPanels, setIsCreatingPanels] = useState(false);
  const { showToast } = useToast();

  const handleFilterComplete = useCallback((selectedFilters) => {
    setFilters(selectedFilters);
  }, []);

  const handleAutoCreatePanels = useCallback(async () => {
    if (!filters) {
      showToast('Please select academic context first', 'error');
      return;
    }

    const confirmCreate = window.confirm(
      `This will automatically create panels for ${filters.department} (${filters.school}) in ${filters.academicYear}. Continue?`
    );

    if (!confirmCreate) return;

    try {
      setIsCreatingPanels(true);
      
      const response = await autoCreatePanels(
        [filters.department],
        filters.school,
        filters.academicYear
      );
      
      if (response.success) {
        showToast(response.message || 'Panels created successfully', 'success');
      } else {
        showToast(response.message || 'Failed to create panels', 'error');
      }
    } catch (error) {
      console.error('Error auto-creating panels:', error);
      showToast(error.response?.data?.message || 'Failed to create panels', 'error');
    } finally {
      setIsCreatingPanels(false);
    }
  }, [filters, showToast]);

  const handleManualPanelCreation = useCallback(async (panelData) => {
    try {
      const response = await createPanel({
        ...panelData,
        school: filters.school,
        department: filters.department,
        academicYear: filters.academicYear
      });
      
      if (response.success) {
        showToast('Panel created successfully', 'success');
        return { success: true };
      } else {
        showToast(response.message || 'Failed to create panel', 'error');
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error creating panel:', error);
      throw error;
    }
  }, [filters, showToast]);

  return (
    <div className="space-y-6">
      {/* Academic Context Selector */}
      <AcademicFilterSelector onFilterComplete={handleFilterComplete} />

      {/* Panel Creation Section */}
      {filters && (
        <>
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-4">
            <Button onClick={() => setIsBulkUploadOpen(true)}>
              <UserPlusIcon className="w-4 h-4 mr-2" />
              Create Panel Manually
            </Button>
            <Button 
              onClick={handleAutoCreatePanels} 
              variant="secondary"
              disabled={isCreatingPanels}
            >
              <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
              {isCreatingPanels ? 'Creating...' : 'Auto Create Panels'}
            </Button>
          </div>

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-blue-900">
                Panel Creation Options
              </h3>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li><strong>Create Panel Manually:</strong> Select specific faculty members to form a panel</li>
                <li><strong>Auto Create Panels:</strong> Automatically organize all faculty in the selected department into panels</li>
              </ul>
            </div>
          </Card>
        </>
      )}

      {/* Manual Panel Creation Modal */}
      <PanelBulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onUpload={handleManualPanelCreation}
        filters={filters}
      />
    </div>
  );
};

export default PanelCreationTab;
