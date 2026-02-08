import React, { useState } from 'react';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import RequestEditModal from './RequestEditModal';
import { MapPinIcon, CheckCircleIcon, UserGroupIcon, LockClosedIcon, LockOpenIcon, ClockIcon } from '@heroicons/react/24/outline';
import { isDeadlinePassed } from '../../../shared/utils/dateHelpers';
import Toast from '../../../shared/components/Toast';

const TeamsModal = ({ isOpen, onClose, review, onEnterMarks }) => {
  const [requestTeam, setRequestTeam] = useState(null);
  const [toast, setToast] = useState(null);

  if (!isOpen || !review) return null;

  const completedTeams = review.teams?.filter(t => t.marksEntered).length || 0;
  const totalTeams = review.teams?.length || 0;
  const isExpired = isDeadlinePassed(review.endDate);

  const handleRequestConfirm = (reason) => {
    // In a real app, this would send an API request
    setToast({ type: 'success', message: `Request sent for ${requestTeam.name}` });

    // Optimistically update local state for demo purposes (if parent doesn't update)
    requestTeam.requestStatus = 'pending';

    setRequestTeam(null);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        title={review.name}
      >
        <div className="p-6">
          {/* Header Info */}
          <div className="mb-6 pb-4 border-b">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Deadline: <span className={`font-semibold ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>{new Date(review.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></span>
              <span>Progress: <span className="font-semibold text-gray-900">{completedTeams}/{totalTeams} teams completed</span></span>
            </div>
            {isExpired && (
              <div className="mt-2 bg-orange-50 text-orange-800 text-xs px-3 py-2 rounded-md border border-orange-200 flex items-center gap-2">
                <LockClosedIcon className="w-4 h-4" />
                Grading is locked. Request edit access for changes.
              </div>
            )}
          </div>

          {/* Teams List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {review.teams?.map((team) => {
              const isLocked = isExpired && !team.isUnlocked;
              const isPending = team.requestStatus === 'pending';

              // PPT Approval Logic
              const isPanelRole = team.role === 'panel' || (team.roleLabel && team.roleLabel.toLowerCase().includes('panel'));
              // review.id maps to reviewType in backend
              const pptApproval = team.pptApprovals?.find(a => a.reviewType === review.id);
              const isPPTApproved = pptApproval && pptApproval.isApproved;
              const isBlockedByPPT = isPanelRole && !isPPTApproved;

              return (
                <div
                  key={team.id}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-all 
                        ${isLocked || isBlockedByPPT ? 'bg-slate-50 border-slate-200' : 'bg-white hover:border-blue-400 hover:shadow-sm'}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                      {team.marksEntered ? (
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center border border-green-200">
                          <CheckCircleIcon className="w-6 h-6 text-green-600" />
                        </div>
                      ) : isPending ? (
                        <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-200">
                          <ClockIcon className="w-6 h-6 text-yellow-600" />
                        </div>
                      ) : isBlockedByPPT ? (
                        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center border border-orange-200">
                          <LockClosedIcon className="w-5 h-5 text-orange-400" />
                        </div>
                      ) : isLocked ? (
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                          <LockClosedIcon className="w-5 h-5 text-slate-400" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-200">
                          <UserGroupIcon className="w-6 h-6 text-blue-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={`font-semibold ${isLocked && !isPending ? 'text-slate-500' : 'text-gray-900'}`}>{team.name}</div>
                        {(team.roleLabel || team.role) && (
                          <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded border ${team.role === 'guide'
                            ? 'bg-purple-100 text-purple-700 border-purple-200'
                            : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}>
                            {team.roleLabel || team.role}
                          </span>
                        )}
                        {team.isUnlocked && isExpired && (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wide rounded border border-green-200 flex items-center gap-1">
                            <LockOpenIcon className="w-3 h-3" /> Unlocked
                          </span>
                        )}
                        {isBlockedByPPT && (
                          <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-wide rounded border border-orange-200">
                            PPT Approval Pending
                          </span>
                        )}
                      </div>
                      {team.projectTitle && (
                        <div className="text-sm text-gray-500 truncate">{team.projectTitle}</div>
                      )}

                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <div className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-medium">
                          Panel: {team.panelName}
                        </div>
                        {team.venue && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPinIcon className="w-3 h-3" /> {team.venue}
                          </div>
                        )}
                        <div className="text-[11px] text-gray-400">
                          {team.students?.length} member{team.students?.length !== 1 ? 's' : ''}
                        </div>
                      </div>

                      {/* Display marks if entered */}
                      {/* Display students list (Always show members) */}
                      {team.students && (
                        <div className="mt-3 grid grid-cols-1 gap-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {team.students.map(s => (
                            <div key={s.student_id} className="flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-600 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                {s.student_name}
                              </span>
                              {team.marksEntered ? (
                                <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100 font-bold">
                                  {s.totalMarks} / {s.maxTotalMarks}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[10px]">No marks</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={
                      isPending ? 'secondary' :
                        isBlockedByPPT ? 'secondary' :
                          isLocked ? 'secondary' :
                            (team.marksEntered ? 'secondary' : 'primary')
                    }
                    className={
                      isPending ? 'text-yellow-700 border-yellow-200 bg-yellow-50 opacity-100 cursor-not-allowed' :
                        isBlockedByPPT ? 'text-orange-700 border-orange-200 bg-orange-50 opacity-100 cursor-not-allowed' :
                          isLocked ? 'text-orange-600 border-orange-200 hover:bg-orange-50' : ''
                    }
                    disabled={isPending || isBlockedByPPT}
                    title={isBlockedByPPT ? 'Guide must approve PPT first' : ''}
                    onClick={() => {
                      if (!isPending && !isBlockedByPPT) {
                        isLocked ? setRequestTeam(team) : onEnterMarks(team);
                      }
                    }}
                  >
                    {isPending ? 'Request Pending' :
                      isBlockedByPPT ? 'PPT Pending' :
                        (isLocked ? 'Request Edit' : (team.marksEntered ? 'Edit Marks' : 'Enter Marks'))}
                  </Button>
                </div>
              );
            })}
          </div>
        </div >
      </Modal >

      {requestTeam && (
        <RequestEditModal
          isOpen={true}
          onClose={() => setRequestTeam(null)}
          teamName={requestTeam.name}
          onConfirm={handleRequestConfirm}
        />
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </>
  );
};

export default TeamsModal;
