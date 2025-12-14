// src/features/admin/components/request-management/RequestList.jsx
import React, { useState, useMemo } from 'react';
import Card from '../../../../shared/components/Card';
import Button from '../../../../shared/components/Button';
import Modal from '../../../../shared/components/Modal';
import { useToast } from '../../../../shared/hooks/useToast';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import RequestFilters from './requests/RequestFilters';
import FacultyRequestCard from './requests/FacultyRequestCard';
import { 
  generateMockRequests, 
  groupRequestsByFaculty, 
  applyFilters 
} from './requests/requestUtils';

const RequestList = () => {
  const { showToast } = useToast();
  const [requests, setRequests] = useState(generateMockRequests());
  const [filters, setFilters] = useState({
    school: '',
    program: '',
    category: '',
    status: ''
  });
  
  const [showApproveAllModal, setShowApproveAllModal] = useState(false);
  const [selectedFacultyId, setSelectedFacultyId] = useState(null);
  const [approvalReason, setApprovalReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Apply filters and group by faculty
  const filteredRequests = useMemo(() => {
    return applyFilters(requests, filters);
  }, [requests, filters]);

  const facultyGroups = useMemo(() => {
    return groupRequestsByFaculty(filteredRequests);
  }, [filteredRequests]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      school: '',
      program: '',
      category: '',
      status: ''
    });
  };

  const handleApproveRequest = (requestId) => {
    setRequests(prevRequests =>
      prevRequests.map(request =>
        request.id === requestId
          ? { ...request, status: 'approved', approvalReason: 'Approved by admin' }
          : request
      )
    );
    showToast('Request approved successfully', 'success');
  };

  const handleRejectRequest = (requestId) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setRequests(prevRequests =>
      prevRequests.map(request =>
        request.id === requestId
          ? { ...request, status: 'rejected', rejectionReason: reason }
          : request
      )
    );
    showToast('Request rejected', 'success');
  };

  const handleOpenApproveAllModal = (facultyId) => {
    setSelectedFacultyId(facultyId);
    setShowApproveAllModal(true);
  };

  const handleApproveAllForFaculty = async () => {
    if (!approvalReason.trim()) {
      showToast('Please provide a reason for approval', 'error');
      return;
    }

    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      setRequests(prevRequests =>
        prevRequests.map(request =>
          request.facultyId === selectedFacultyId && request.status === 'pending'
            ? { ...request, status: 'approved', approvalReason }
            : request
        )
      );
      
      const faculty = facultyGroups.find(f => f.id === selectedFacultyId);
      const pendingCount = requests.filter(
        r => r.facultyId === selectedFacultyId && r.status === 'pending'
      ).length;
      
      showToast(
        `Successfully approved ${pendingCount} request${pendingCount !== 1 ? 's' : ''} for ${faculty?.name}`,
        'success'
      );
      
      setShowApproveAllModal(false);
      setSelectedFacultyId(null);
      setApprovalReason('');
      setIsProcessing(false);
    }, 1000);
  };

  const selectedFaculty = facultyGroups.find(f => f.id === selectedFacultyId);
  const pendingRequestsForFaculty = selectedFaculty?.requests.filter(r => r.status === 'pending') || [];

  return (
    <>
      {/* Filters */}
      <RequestFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Faculty Request Cards */}
      <div className="space-y-4">
        {facultyGroups.length === 0 ? (
          <Card>
            <div className="p-8 text-center text-gray-500">
              <p>No requests found matching the selected filters</p>
            </div>
          </Card>
        ) : (
          facultyGroups.map((faculty) => (
            <FacultyRequestCard
              key={faculty.id}
              faculty={faculty}
              requests={faculty.requests}
              onApproveRequest={handleApproveRequest}
              onRejectRequest={handleRejectRequest}
              onApproveAll={handleOpenApproveAllModal}
            />
          ))
        )}
      </div>

      {/* Approve All Modal */}
      <Modal
        isOpen={showApproveAllModal}
        onClose={() => {
          setShowApproveAllModal(false);
          setSelectedFacultyId(null);
          setApprovalReason('');
        }}
        title={`Approve All Requests for ${selectedFaculty?.name}`}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              You are about to approve <strong>{pendingRequestsForFaculty.length}</strong> pending request{pendingRequestsForFaculty.length !== 1 ? 's' : ''} for <strong>{selectedFaculty?.name}</strong>:
            </p>
            <ul className="mt-3 space-y-1 text-sm text-blue-700">
              {pendingRequestsForFaculty.map(req => (
                <li key={req.id} className="flex items-start gap-2">
                  <CheckCircleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{req.studentName} - {req.category === 'guide' ? 'Guide' : 'Panel'} ({req.projectTitle})</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Approval Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={approvalReason}
              onChange={(e) => setApprovalReason(e.target.value)}
              rows={4}
              placeholder="Please provide a reason for approving all these requests (e.g., 'All requests reviewed and found valid', 'Emergency approval for upcoming deadlines', etc.)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="mt-2 text-xs text-gray-500">
              This reason will be recorded and visible to faculty members.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={() => {
                setShowApproveAllModal(false);
                setSelectedFacultyId(null);
                setApprovalReason('');
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleApproveAllForFaculty}
              disabled={isProcessing || !approvalReason.trim()}
            >
              {isProcessing ? 'Processing...' : `Approve All ${pendingRequestsForFaculty.length} Requests`}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default RequestList;
