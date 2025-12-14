// src/features/admin/pages/AdminBroadcasts.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MegaphoneIcon } from '@heroicons/react/24/outline';
import Navbar from '../../../shared/components/Navbar';
import AdminTabs from '../components/shared/AdminTabs';
import BroadcastForm from '../components/broadcasts/BroadcastForm';
import BroadcastHistory from '../components/broadcasts/BroadcastHistory';
import { useToast } from '../../../shared/hooks/useToast';
import {
  toDatetimeLocalValue,
  fromDatetimeLocalValue,
  schoolOptions,
  departmentOptions,
  generateMockBroadcasts
} from '../components/broadcasts/broadcastUtils';

const DEFAULT_HISTORY_LIMIT = 25;

const AdminBroadcasts = () => {
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetSchools: [],
    targetDepartments: [],
    expiresAt: '',
    action: 'notice',
    isActive: true,
  });
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [includeExpired, setIncludeExpired] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(DEFAULT_HISTORY_LIMIT);
  const [editingBroadcastId, setEditingBroadcastId] = useState(null);

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      message: '',
      targetSchools: [],
      targetDepartments: [],
      expiresAt: '',
      action: 'notice',
      isActive: true,
    });
    setEditingBroadcastId(null);
  }, []);

  const toggleAudienceValue = (key, value) => {
    setFormData((prev) => {
      const list = prev[key];
      const exists = list.includes(value);
      const nextValues = exists
        ? list.filter((item) => item !== value)
        : [...list, value];
      return {
        ...prev,
        [key]: nextValues,
      };
    });
  };

  const resetAudience = (key) => {
    setFormData((prev) => ({
      ...prev,
      [key]: [],
    }));
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    if (name === 'isActive') {
      setFormData((prev) => ({
        ...prev,
        isActive: event.target.checked,
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      // TODO: Replace with actual API call
      // const response = await api.get('/broadcasts', {
      //   params: { limit: historyLimit, includeExpired }
      // });
      
      // Mock data for now
      setTimeout(() => {
        const mockData = generateMockBroadcasts();
        const filtered = includeExpired 
          ? mockData 
          : mockData.filter(b => new Date(b.expiresAt) >= new Date());
        setHistory(filtered.slice(0, historyLimit));
        setHistoryLoading(false);
      }, 500);
    } catch (err) {
      console.error('Failed to load broadcast history:', err);
      showToast('Unable to load broadcast history', 'error');
      setHistoryLoading(false);
    }
  }, [historyLimit, includeExpired, showToast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!formData.message.trim()) {
      showToast('Message required', 'error');
      return;
    }

    if (!formData.expiresAt) {
      showToast('Expiry required', 'error');
      return;
    }

    const expiryIso = fromDatetimeLocalValue(formData.expiresAt);
    if (!expiryIso || new Date(expiryIso) <= new Date()) {
      showToast('Expiry must be in the future', 'error');
      return;
    }

    setSending(true);
    try {
      const payload = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        targetSchools: formData.targetSchools,
        targetDepartments: formData.targetDepartments,
        expiresAt: expiryIso,
        action: formData.action || 'notice',
        isActive: formData.isActive,
      };

      // TODO: Replace with actual API calls
      // if (editingBroadcastId) {
      //   await api.put(`/broadcasts/${editingBroadcastId}`, payload);
      // } else {
      //   await api.post('/broadcasts', payload);
      // }

      showToast(
        editingBroadcastId ? 'Broadcast updated successfully' : 'Broadcast sent successfully',
        'success'
      );

      resetForm();
      fetchHistory();
    } catch (err) {
      console.error('Failed to submit broadcast:', err);
      showToast('Unable to save broadcast', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleEditBroadcast = useCallback((broadcast) => {
    setEditingBroadcastId(broadcast._id);
    setFormData({
      title: broadcast.title || '',
      message: broadcast.message || '',
      targetSchools: broadcast.targetSchools || [],
      targetDepartments: broadcast.targetDepartments || [],
      expiresAt: toDatetimeLocalValue(broadcast.expiresAt),
      action: broadcast.action || 'notice',
      isActive: broadcast.isActive ?? true,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCancelEdit = useCallback(() => {
    resetForm();
  }, [resetForm]);

  const handleDeleteBroadcast = useCallback(async (broadcastId) => {
    if (!window.confirm('Delete this broadcast permanently?')) return;

    try {
      // TODO: Replace with actual API call
      // await api.delete(`/broadcasts/${broadcastId}`);
      
      showToast('Broadcast deleted', 'success');
      if (editingBroadcastId === broadcastId) {
        resetForm();
      }
      fetchHistory();
    } catch (err) {
      console.error('Failed to delete broadcast:', err);
      showToast('Unable to delete broadcast', 'error');
    }
  }, [editingBroadcastId, fetchHistory, resetForm, showToast]);

  const activeAudienceDescription = useMemo(() => {
    const schoolLabel = formData.targetSchools.length === 0
      ? 'All schools'
      : `${formData.targetSchools.length} selected`;
    const departmentLabel = formData.targetDepartments.length === 0
      ? 'All departments'
      : `${formData.targetDepartments.length} selected`;
    return `${schoolLabel} • ${departmentLabel}`;
  }, [formData.targetSchools, formData.targetDepartments]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
        {/* Admin Tabs */}
        <AdminTabs />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <MegaphoneIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Broadcast Center</h1>
              <p className="text-sm text-gray-600">
                
              </p>
            </div>
          </div>
          <p className="text-sm text-blue-600 mt-2">{activeAudienceDescription}</p>
        </div>


        {/* Broadcast Form */}
        <BroadcastForm
          formData={formData}
          editingBroadcastId={editingBroadcastId}
          sending={sending}
          onSubmit={handleSubmit}
          onInputChange={handleInputChange}
          onToggleAudience={toggleAudienceValue}
          onResetAudience={resetAudience}
          onCancelEdit={handleCancelEdit}
          onRefreshHistory={fetchHistory}
          historyLoading={historyLoading}
          schoolOptions={schoolOptions}
          departmentOptions={departmentOptions}
        />

        {/* Broadcast History */}
        <BroadcastHistory
          history={history}
          loading={historyLoading}
          includeExpired={includeExpired}
          historyLimit={historyLimit}
          onIncludeExpiredChange={setIncludeExpired}
          onLimitChange={setHistoryLimit}
          onEdit={handleEditBroadcast}
          onDelete={handleDeleteBroadcast}
        />
      </div>
    </div>
  );
};

export default AdminBroadcasts;
