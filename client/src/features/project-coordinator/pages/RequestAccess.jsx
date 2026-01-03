// src/features/project-coordinator/pages/RequestAccess.jsx
import React, { useState } from 'react';
import { 
  PaperAirplaneIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';
import Navbar from '../../../shared/components/Navbar';
import CoordinatorTabs from '../components/shared/CoordinatorTabs';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Select from '../../../shared/components/Select';
import { useToast } from '../../../shared/hooks/useToast';

const RequestAccess = () => {

const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Please provide a reason for access");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/coordinator/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        toast.success("Access request sent successfully! Admin will review it.");
        setReason("");
      } else {
        toast.error("Failed to send request");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar/>
      <CoordinatorTabs/>
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Request Feature Access</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-700 mb-6">
          Use this form to request temporary or permanent access to restricted features
          (Student, Faculty, Project, and Panel Management).
        </p>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for requesting access <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows="6"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Explain why you need access to management features and for how long..."
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-6 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Submit Request"}
          </button>
        </form>

        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> Once approved, access will be granted until the deadline set by the admin.
            You will be able to use all management features until that date.
          </p>
        </div>
      </div>
    </div>
    </div>
  );
};

export default RequestAccess;
