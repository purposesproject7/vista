// src/features/admin/pages/AdminBroadcasts.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '../../../shared/components/Navbar';
import AdminTabs from '../components/shared/AdminTabs';
import BroadcastForm from '../components/broadcasts/BroadcastForm';
import BroadcastHistory from '../components/broadcasts/BroadcastHistory';
import { useToast } from '../../../shared/hooks/useToast';
import api from '../../../services/api';
import {
  toDatetimeLocalValue,
  fromDatetimeLocalValue
} from '../components/broadcasts/broadcastUtils';
import {
  fetchBroadcasts as apiFetchBroadcasts,
  createBroadcast as apiCreateBroadcast,
  updateBroadcast as apiUpdateBroadcast,
  deleteBroadcast as apiDeleteBroadcast,
  fetchMasterData
} from '../services/adminApi';

const DEFAULT_HISTORY_LIMIT = 25;

const AdminBroadcasts = () => {
  const { showToast } = useToast();
  
  // Options from database
  const [schoolOptions, setSchoolOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);
  const [semesterOptions, setSemesterOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  
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

  // Fetch schools, departments, years, and semesters from database
  const fetchOptions = useCallback(async () => {
    try {
      setOptionsLoading(true);
      
      const masterData = await fetchMasterData();
      
      if (masterData.success) {
        setSchoolOptions(masterData.schools?.map(s => s.name) || []);
        setDepartmentOptions(masterData.departments?.map(d => d.name) || []);
        setYearOptions(masterData.academicYears?.map(y => y.year) || []);
        setSemesterOptions(['Fall Semester', 'Winter Semester', 'Summer Semester']);
      } else {
        showToast(masterData.message || 'Failed to load options', 'error');
      }
    } catch (err) {
      console.error('Failed to load options:', err);
      showToast('Unable to load dropdown options', 'error');
    } finally {
      setOptionsLoading(false);
    }
  }, [showToast]);

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
      
      const response = await apiFetchBroadcasts({
        limit: historyLimit,
        includeExpired
      });
      
      if (response.success) {
        setHistory(response.data || []);
      } else {
        showToast(response.message || 'Failed to load broadcast history', 'error');
      }
    } catch (err) {
      console.error('Failed to load broadcast history:', err);
      showToast('Unable to load broadcast history', 'error');
    } finally {
      setHistoryLoading(false);
    }
  }, [historyLimit, includeExpired, showToast]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

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

      let response;
      if (editingBroadcastId) {
        response = await apiUpdateBroadcast(editingBroadcastId, payload);
      } else {
        response = await apiCreateBroadcast(
          payload.message,
          payload.expiresAt,
          payload.targetSchools,
          payload.targetDepartments
        );
      }

      if (response.success) {
        showToast(
          editingBroadcastId ? 'Broadcast updated successfully' : 'Broadcast sent successfully',
          'success'
        );
        resetForm();
        fetchHistory();
      } else {
        showToast(response.message || 'Failed to save broadcast', 'error');
      }
    } catch (err) {
      console.error('Failed to submit broadcast:', err);
      showToast(err.response?.data?.message || 'Unable to save broadcast', 'error');
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
      const response = await apiDeleteBroadcast(broadcastId);
      
      if (response.success) {
        showToast('Broadcast deleted', 'success');
        if (editingBroadcastId === broadcastId) {
          resetForm();
        }
        fetchHistory();
      } else {
        showToast(response.message || 'Failed to delete broadcast', 'error');
      }
    } catch (err) {
      console.error('Failed to delete broadcast:', err);
      showToast(err.response?.data?.message || 'Unable to delete broadcast', 'error');
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
