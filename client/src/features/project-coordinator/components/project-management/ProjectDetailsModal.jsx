// src/features/project-coordinator/components/project-management/ProjectDetailsModal.jsx
import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../../../../shared/components/Modal';
import Card from '../../../../shared/components/Card';
import LoadingSpinner from '../../../../shared/components/LoadingSpinner';
import { AcademicCapIcon, UserGroupIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { fetchProjectMarks } from '../../services/coordinatorApi';
import { useToast } from '../../../../shared/hooks/useToast';

const ProjectDetailsModal = ({ isOpen, onClose, project }) => {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [marksByStudent, setMarksByStudent] = useState({});
  const [loadingMarks, setLoadingMarks] = useState(false);
  const { showToast } = useToast();

  // Set first student as default when modal opens
  useEffect(() => {
    if (isOpen && project?.teamMembers?.length > 0) {
      setSelectedStudent(project.teamMembers[0].regNo);
    }
  }, [isOpen, project]);

  // Fetch marks when modal opens
  useEffect(() => {
    const loadMarks = async () => {
      if (isOpen && project?._id) {
        setLoadingMarks(true);
        try {
          // Debugging log
          console.log('Fetching marks for project:', project._id);
          const response = await fetchProjectMarks(project._id);
          console.log('Marks response:', response);

          if (response.success) {
            console.log('Setting marks:', response.marksByStudent);
            setMarksByStudent(response.marksByStudent);
          } else {
            console.warn('Failed to fetch marks, using fallback');
            // Use mock data or empty object if no marks available
            setMarksByStudent(project.marksByStudent || {});
          }
        } catch (error) {
          console.error('Error loading marks:', error);
          setMarksByStudent(project.marksByStudent || {});
        } finally {
          setLoadingMarks(false);
        }
      }
    };

    loadMarks();
  }, [isOpen, project]);

  const selectedStudentMarks = useMemo(() => {
    if (!selectedStudent || !marksByStudent) return null;
    return marksByStudent[selectedStudent] || null;
  }, [selectedStudent, marksByStudent]);

  const calculateTotalMarks = (reviews) => {
    if (!reviews) return 0;
    return reviews.reduce((total, review) => {
      if (review.components) {
        return total + review.components.reduce((sum, comp) => sum + (comp.score || 0), 0);
      }
      return total;
    }, 0);
  };

  const calculateMaxMarks = (reviews) => {
    if (!reviews) return 0;
    return reviews.reduce((total, review) => {
      if (review.components) {
        return total + review.components.reduce((sum, comp) => sum + (comp.max || comp.maxMarks || 0), 0);
      }
      return total;
    }, 0);
  };

  if (!project) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Project Details" size="xl">
      <div className="space-y-6">
        {/* Project Info */}
        <div>
          <div className="text-xs font-semibold text-blue-600 mb-1">{project._id}</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{project.name}</h3>
          <p className="text-sm text-gray-600">{project.description || project.type || 'Capstone Project'}</p>
        </div>

        {/* Guide, Panel & Team Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card padding="sm">
            <div className="flex items-start gap-3">
              <AcademicCapIcon className="w-6 h-6 text-blue-600 shrink-0" />
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Project Guide</div>
                <div className="text-base font-bold text-gray-900">{project.guide?.name || 'Not Assigned'}</div>
                <div className="text-xs text-gray-500">{project.guide?.employeeId || ''}</div>
              </div>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-start gap-3">
              <UserGroupIcon className="w-6 h-6 text-purple-600 shrink-0" />
              <div className="w-full">
                <div className="text-xs font-medium text-gray-500 mb-1">Panel Faculty</div>

                {/* Main Panel */}
                {project.panel?.members && project.panel.members.length > 0 ? (
                  <div className="mb-2">
                    <div className="text-xs font-medium text-purple-600 mb-1">Main Panel</div>
                    <div className="space-y-1">
                      {project.panel.members.map((member, idx) => (
                        <div key={idx}>
                          <div className="text-sm font-semibold text-gray-900">{member.name || member.faculty?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{member.employeeId || member.faculty?.employeeId || ''}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Review Panels */}
                {project.reviewPanels && project.reviewPanels.length > 0 ? (
                  <div className="space-y-2">
                    {project.reviewPanels.map((reviewPanel, rpIdx) => (
                      reviewPanel.panel?.members && reviewPanel.panel.members.length > 0 ? (
                        <div key={rpIdx}>
                          <div className="text-xs font-medium text-purple-600 mb-1">
                            {reviewPanel.reviewType} Panel
                          </div>
                          <div className="space-y-1">
                            {reviewPanel.panel.members.map((member, idx) => (
                              <div key={idx}>
                                <div className="text-sm font-semibold text-gray-900">{member.name || member.faculty?.name || 'Unknown'}</div>
                                <div className="text-xs text-gray-500">{member.employeeId || member.faculty?.employeeId || ''}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null
                    ))}
                  </div>
                ) : null}

                {/* No panels assigned */}
                {(!project.panel?.members || project.panel.members.length === 0) &&
                  (!project.reviewPanels || project.reviewPanels.length === 0) && (
                    <div className="text-base font-bold text-gray-900">Not Assigned</div>
                  )}
              </div>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-start gap-3">
              <UserGroupIcon className="w-6 h-6 text-green-600 shrink-0" />
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Team Size</div>
                <div className="text-base font-bold text-gray-900">{project.teamMembers?.length || 0} Members</div>
                <div className="text-xs text-gray-500">
                  {project.teamMembers?.map(m => m.name).join(', ')}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Student Selector */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Student to View Marks
          </label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {project.teamMembers?.map(member => (
              <option key={member.regNo} value={member.regNo}>
                {member.name} ({member.regNo})
              </option>
            ))}
          </select>
        </div>

        {/* Marks Breakdown */}
        {loadingMarks ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : selectedStudentMarks && selectedStudentMarks.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-900">Review Component Marks</h4>
              <div className="flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-gray-600">
                  Total: {calculateTotalMarks(selectedStudentMarks)}/{calculateMaxMarks(selectedStudentMarks)}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {selectedStudentMarks.map((review, reviewIdx) => (
                <Card key={reviewIdx} padding="sm" className="bg-gray-50">
                  <div className="mb-3">
                    <h5 className="text-base font-bold text-gray-900">{review.reviewName}</h5>
                    {review.facultyType && (
                      <span className="text-xs text-gray-500">by {review.facultyType}</span>
                    )}
                  </div>

                  {review.components && review.components.length > 0 ? (
                    <div className="space-y-2">
                      {review.components.map((component, compIdx) => {
                        const maxScore = component.max || component.maxMarks || 0;
                        const score = component.score || component.marks || 0;
                        const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
                        const colorClass =
                          percentage >= 80
                            ? 'bg-green-500'
                            : percentage >= 60
                              ? 'bg-blue-500'
                              : percentage >= 40
                                ? 'bg-yellow-500'
                                : 'bg-red-500';

                        return (
                          <div key={compIdx} className="bg-white rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-gray-700">
                                {component.name || component.componentName || `Component ${compIdx + 1}`}
                              </span>
                              <span className="text-sm font-bold text-gray-900">
                                {score}/{maxScore}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`${colorClass} h-2 rounded-full transition-all duration-300`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No component marks available</p>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-300 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Review Total</span>
                    <span className="text-base font-bold text-blue-600">
                      {review.totalMarks || 0}/{review.maxTotalMarks || 0}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : selectedStudent ? (
          <Card padding="sm" className="bg-gray-50">
            <p className="text-sm text-gray-500 text-center py-4">
              No marks available for this student yet.
            </p>
          </Card>
        ) : null}
      </div>
    </Modal>
  );
};

export default ProjectDetailsModal;
