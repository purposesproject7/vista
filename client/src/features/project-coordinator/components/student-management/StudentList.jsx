// src/features/project-coordinator/components/student-management/StudentList.jsx
import React, { useState } from 'react';
import Card from '../../../../shared/components/Card';
import Button from '../../../../shared/components/Button';
import Badge from '../../../../shared/components/Badge';
import EmptyState from '../../../../shared/components/EmptyState';
import LoadingSpinner from '../../../../shared/components/LoadingSpinner';
import StudentDetailsModal from './StudentDetailsModal';
import { 
  UserGroupIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const StudentList = ({ students = [], loading = false, onViewDetails, isPrimary = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.regNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  const handleNavigateToStudent = (student) => {
    // Find the student in the list by regNo or id
    const foundStudent = students.find(s => s.regNo === student.regNo || s.id === student.id);
    if (foundStudent) {
      setSelectedStudent(foundStudent);
    }
  };

  const getPPTStatusBadge = (student) => {
    if (!student.reviewStatuses || student.reviewStatuses.length === 0) {
      return (
        <div className="flex items-center gap-1">
          <ClockIcon className="w-4 h-4" />
          <Badge variant="default">0/6 Approved</Badge>
        </div>
      );
    }

    const approved = student.reviewStatuses.filter(r => r.status === 'approved').length;
    const total = student.reviewStatuses.length;
    const pending = student.reviewStatuses.filter(r => r.status === 'pending' || r.status === 'not-submitted').length;
    
    const allApproved = approved === total;
    const somePending = pending > 0;
    
    const Icon = allApproved ? CheckCircleIcon : somePending ? ClockIcon : XCircleIcon;
    const variant = allApproved ? 'success' : somePending ? 'warning' : 'default';
    
    return (
      <div className="flex items-center gap-1">
        <Icon className="w-4 h-4" />
        <Badge variant={variant}>{approved}/{total} Approved</Badge>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <div className="py-12">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card padding="sm">
        <div className="flex items-center gap-3">
          <UserGroupIcon className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, registration number, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <span className="text-sm font-medium text-gray-600">
            {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
          </span>
        </div>
      </Card>

      {/* Student Cards */}
      {filteredStudents.length === 0 ? (
        <Card>
          <EmptyState
            icon={UserGroupIcon}
            title="No students found"
            description={searchTerm ? "Try adjusting your search criteria" : "No students registered for this academic context"}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredStudents.map((student) => (
            <Card key={student.id} padding="md" className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                {/* Student Info */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Basic Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base mb-1">{student.name}</h3>
                    <p className="text-sm text-gray-600 font-mono">{student.regNo}</p>
                  </div>

                  {/* Contact */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <PhoneIcon className="w-4 h-4 text-gray-400" />
                      <span>{student.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{student.email}</span>
                    </div>
                  </div>

                  {/* PPT & Marks */}
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">PPT Approval</p>
                      {getPPTStatusBadge(student)}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Marks</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {student.totalMarks !== null && student.totalMarks !== undefined 
                          ? `${student.totalMarks}/100` 
                          : 'Not Graded'}
                      </p>
                    </div>
                  </div>

                  {/* Guide & Panel */}
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Guide</p>
                      <p className="text-sm text-gray-700 truncate">{student.guide || 'Not Assigned'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Panel Member</p>
                      <p className="text-sm text-gray-700 truncate">{student.panelMember || 'Not Assigned'}</p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleViewDetails(student)}
                    className="gap-2"
                  >
                    <EyeIcon className="w-4 h-4" />
                    Details
                  </Button>
                </div>
              </div>

              {/* Teammates */}
              {student.teammates && student.teammates.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Team Members</p>
                  <div className="flex flex-wrap gap-2">
                    {student.teammates.map((teammate) => (
                      <button
                        key={teammate.id}
                        onClick={() => handleViewDetails({ id: teammate.id })}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md hover:bg-blue-100 transition-colors border border-blue-200"
                      >
                        {teammate.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Student Details Modal */}
      <StudentDetailsModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        onNavigateToStudent={handleNavigateToStudent}
        students={students}
      />
    </div>
  );
};

export default StudentList;
