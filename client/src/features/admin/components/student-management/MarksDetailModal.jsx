// src/features/admin/components/student-management/MarksDetailModal.jsx
import React from 'react';
import Modal from '../../../../shared/components/Modal';
import Card from '../../../../shared/components/Card';
import Badge from '../../../../shared/components/Badge';
import { 
  ChartBarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const MarksDetailModal = ({ isOpen, onClose, student }) => {
  if (!student) return null;

  const guideReviews = student.reviewStatuses?.filter(r => r.type === 'guide') || [];
  const panelReviews = student.reviewStatuses?.filter(r => r.type === 'panel') || [];
  
  const calculateTotal = (reviews) => {
    return reviews.reduce((sum, review) => {
      if (review.marks) {
        return sum + (review.marks.actionTaken || 0) + 
               (review.marks.moduleProgress || 0) + 
               (review.marks.quality || 0) + 
               (review.marks.documentation || 0);
      }
      return sum;
    }, 0);
  };

  const guideTotal = calculateTotal(guideReviews);
  const panelTotal = calculateTotal(panelReviews);
  const totalMarks = guideTotal + panelTotal;

  const ReviewMarksCard = ({ review }) => {
    const hasMarks = review.marks && review.status === 'approved';
    const reviewTotal = hasMarks ? 
      (review.marks.actionTaken || 0) + 
      (review.marks.moduleProgress || 0) + 
      (review.marks.quality || 0) + 
      (review.marks.documentation || 0) : 0;

    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-gray-900">{review.name}</h4>
            {review.status === 'approved' ? (
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
            ) : (
              <ClockIcon className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold text-gray-900">{reviewTotal}</p>
          </div>
        </div>

        {hasMarks ? (
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
              <span className="text-xs text-gray-600">Action Taken on Review 2 Comments</span>
              <span className="text-sm font-semibold text-gray-900">{review.marks.actionTaken || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
              <span className="text-xs text-gray-600">Module-wise Implementation Progress</span>
              <span className="text-sm font-semibold text-gray-900">{review.marks.moduleProgress || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
              <span className="text-xs text-gray-600">Quality of Implementation</span>
              <span className="text-sm font-semibold text-gray-900">{review.marks.quality || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
              <span className="text-xs text-gray-600">Documentation Update</span>
              <span className="text-sm font-semibold text-gray-900">{review.marks.documentation || 0}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-gray-500">
            {review.status === 'pending' ? 'Pending approval' : 'Not submitted'}
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Marks Breakdown"
      size="xl"
    >
      <div className="space-y-4">
        {/* Total Summary */}
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total Marks</p>
            <p className="text-4xl font-bold text-gray-900">{totalMarks}/100</p>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div>
                <p className="text-xs text-gray-600">Guide Marks</p>
                <p className="text-xl font-semibold text-blue-700">{guideTotal}</p>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div>
                <p className="text-xs text-gray-600">Panel Marks</p>
                <p className="text-xl font-semibold text-purple-700">{panelTotal}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Guide Reviews */}
        {guideReviews.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AcademicCapIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Guide Reviews</h3>
              <Badge variant="info" size="sm">Total: {guideTotal}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {guideReviews.map((review, index) => (
                <ReviewMarksCard key={index} review={review} />
              ))}
            </div>
          </div>
        )}

        {/* Panel Reviews */}
        {panelReviews.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <UserGroupIcon className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-900">Panel Reviews</h3>
              <Badge variant="default" size="sm">Total: {panelTotal}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {panelReviews.map((review, index) => (
                <ReviewMarksCard key={index} review={review} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MarksDetailModal;
