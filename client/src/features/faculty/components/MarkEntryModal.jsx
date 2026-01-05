import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import Toast from '../../../shared/components/Toast';
import { InformationCircleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

/* Immutable default meta */
const DEFAULT_META = Object.freeze({
  attendance: 'present',
  pat: false,
  comment: ''
});

const MarkEntryModal = ({ isOpen, onClose, review, team, onSuccess }) => {
  const [marks, setMarks] = useState({});
  const [meta, setMeta] = useState({});
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeStudent, setActiveStudent] = useState(null);

  const rubrics = review?.rubric_structure || [];

  /* ---------- Init on open ---------- */
  useEffect(() => {
    if (!isOpen || !team) return;

    const initMarks = {};
    const initMeta = {};

    team.students.forEach(s => {
      initMarks[s.student_id] = {};
      initMeta[s.student_id] = { ...DEFAULT_META };
    });

    setMarks(initMarks);
    setMeta(initMeta);
    setActiveStudent(team.students[0]?.student_id || null);
  }, [isOpen, team]);

  if (!isOpen || !team || !review) return null;

  /* ---------- Helpers ---------- */
  const isBlocked = sid => {
    const m = meta[sid];
    return m?.pat === true || m?.attendance === 'absent';
  };

  const updateMeta = (sid, patch) => {
    setMeta(prev => ({
      ...prev,
      [sid]: {
        ...prev[sid],
        ...patch
      }
    }));
  };

  const setComponentLevel = (sid, rid, score) => {
    if (isBlocked(sid)) return;
    setMarks(prev => ({
      ...prev,
      [sid]: {
        ...prev[sid],
        [rid]: score
      }
    }));
  };

  const getComponentTotal = (sid, rubric) => {
    const level = marks[sid]?.[rubric.rubric_id];
    if (level === undefined) return 0;
    
    // Calculate based on level percentage
    const maxLevel = Math.max(...rubric.levels.map(l => l.score));
    return ((level / maxLevel) * rubric.max_marks).toFixed(1);
  };

  const studentGrandTotal = sid => {
    return rubrics.reduce((sum, r) => {
      return sum + parseFloat(getComponentTotal(sid, r) || 0);
    }, 0);
  };

  const maxTotal = rubrics.reduce((s, r) => s + r.max_marks, 0);

  const allValid = () =>
    team.students.every(s => {
      const m = meta[s.student_id];
      if (!m || m.comment.trim().length < 5) return false;

      if (m.pat || m.attendance === 'absent') return true;

      // Check if all components have level selected
      return rubrics.every(
        r => marks[s.student_id]?.[r.rubric_id] !== undefined
      );
    });

  const handleSave = async () => {
    if (!allValid()) {
      setToast({
        type: 'error',
        message:
          'For every student: add a comment (min 5 chars) and select level for all components or mark Absent/PAT.'
      });
      return;
    }

    setSaving(true);
    await new Promise(r => setTimeout(r, 800));

    onSuccess?.({ marks, meta });

    setSaving(false);
    setToast({ type: 'success', message: 'Marks saved successfully!' });
    setTimeout(() => onClose(), 1000);
  };

  /* Color helper for score buttons */
  const getScoreColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'bg-green-500 hover:bg-green-600 border-green-600';
    if (percentage >= 60) return 'bg-blue-500 hover:bg-blue-600 border-blue-600';
    if (percentage >= 40) return 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600';
    return 'bg-red-500 hover:bg-red-600 border-red-600';
  };

  const activeStudentData = team.students.find(s => s.student_id === activeStudent);
  if (!activeStudentData) return null;

  const blocked = isBlocked(activeStudent);
  const currentMeta = meta[activeStudent] || DEFAULT_META;

  /* ================= UI ================= */
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        title={`${review.review_name} - ${team.team_name}`}
      >
        <div className="flex h-[85vh] bg-gray-50">
          {/* Left Sidebar - Student List */}
          <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-3 border-b border-gray-200 bg-blue-600">
              <h3 className="text-sm font-bold text-white">Team Members</h3>
              <p className="text-xs text-blue-100">{team.students.length} student{team.students.length !== 1 ? 's' : ''}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {team.students.map(student => {
                const total = studentGrandTotal(student.student_id);
                const progress = (total / maxTotal) * 100;
                const m = meta[student.student_id] || DEFAULT_META;
                const isActive = activeStudent === student.student_id;
                const isComplete = m.comment.trim().length >= 5 && 
                  (m.pat || m.attendance === 'absent' || rubrics.every(r => marks[student.student_id]?.[r.rubric_id] !== undefined));

                return (
                  <button
                    key={student.student_id}
                    onClick={() => setActiveStudent(student.student_id)}
                    className={`
                      w-full text-left p-3 rounded-lg transition-all
                      ${isActive 
                        ? 'bg-blue-500 text-white shadow-md' 
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-full overflow-hidden border flex-shrink-0 ${isActive ? 'border-white' : 'border-gray-300'}`}>
                        <img
                          src={student.profile_image || 'https://via.placeholder.com/32'}
                          alt={student.student_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{student.student_name}</div>
                        <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-600'}`}>
                          {student.roll_no}
                        </div>
                      </div>
                      {isComplete && (
                        <CheckCircleIcon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-green-500'}`} />
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isActive ? 'bg-blue-700' : 'bg-gray-200'}`}>
                      <div
                        className={`h-full transition-all duration-500 ${isActive ? 'bg-white' : 'bg-blue-600'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className={`text-xs mt-1 font-medium ${isActive ? 'text-white' : 'text-gray-700'}`}>
                      {Math.round(total)} / {maxTotal}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Student Header */}
            <div className="bg-blue-600 text-white p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow">
                  <img
                    src={activeStudentData.profile_image || 'https://via.placeholder.com/48'}
                    alt={activeStudentData.student_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold">{activeStudentData.student_name}</h2>
                  <p className="text-sm text-blue-100">{activeStudentData.roll_no}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-blue-100">Total</div>
                  <div className="text-2xl font-bold">{blocked ? '—' : Math.round(studentGrandTotal(activeStudent))}/{maxTotal}</div>
                </div>
              </div>

              {/* Attendance & PAT Controls */}
              <div className="mt-3 flex items-center gap-4 bg-white/10 rounded-lg p-3">
                <div className="flex gap-3">
                  {['present', 'absent'].map(v => (
                    <label
                      key={v}
                      className="flex items-center gap-1.5 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`att-${activeStudent}`}
                        checked={currentMeta.attendance === v}
                        onChange={() =>
                          updateMeta(activeStudent, {
                            attendance: v,
                            pat: v === 'absent' ? false : currentMeta.pat
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-xs font-medium capitalize">
                        {v}
                      </span>
                    </label>
                  ))}
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
                  <input
                    type="checkbox"
                    checked={currentMeta.pat}
                    onChange={e =>
                      updateMeta(activeStudent, {
                        pat: e.target.checked,
                        attendance: e.target.checked ? 'present' : currentMeta.attendance
                      })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-xs font-bold">
                    PAT
                  </span>
                </label>
              </div>
            </div>

            {/* Components & Marking Section */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {rubrics.map((rubric, idx) => {
                  const selectedLevel = marks[activeStudent]?.[rubric.rubric_id];
                  const componentTotal = getComponentTotal(activeStudent, rubric);
                  const maxLevel = Math.max(...rubric.levels.map(l => l.score));

                  return (
                    <div key={rubric.rubric_id} className="bg-white rounded-lg shadow border border-gray-200">
                      {/* Component Header */}
                      <div className="bg-gray-50 p-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </span>
                            <h3 className="text-sm font-bold text-gray-900">{rubric.component_name}</h3>
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">
                              {rubric.max_marks}m
                            </span>
                          </div>
                          
                          {selectedLevel !== undefined && (
                            <div className="text-right">
                              <div className="text-xl font-bold text-blue-600">{componentTotal}</div>
                            </div>
                          )}
                        </div>
                        {rubric.component_description && (
                          <p className="text-xs text-gray-600 mt-1 ml-8">{rubric.component_description}</p>
                        )}
                      </div>

                      {/* Level Selection */}
                      <div className="p-3">
                        <div className="grid grid-cols-5 gap-2">
                            {rubric.levels.map(level => {
                              const isSelected = selectedLevel === level.score;
                              const colorClass = getScoreColor(level.score, maxLevel);

                              return (
                                <button
                                  key={level.score}
                                  type="button"
                                  disabled={blocked}
                                  onClick={() => setComponentLevel(activeStudent, rubric.rubric_id, level.score)}
                                  className={`
                                    p-2 rounded border transition-all text-center
                                    ${isSelected 
                                      ? `${colorClass} text-white shadow` 
                                      : 'bg-white border-gray-300 text-gray-700 hover:border-blue-500'
                                    }
                                    ${blocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:shadow'}
                                  `}
                                  title={level.description}
                                >
                                  <div className="text-lg font-bold">{level.score}</div>
                                  <div className="text-xs font-semibold uppercase mt-0.5">{level.label}</div>
                                  {isSelected && (
                                    <div className="text-xs mt-1 font-bold">{componentTotal}</div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {/* Faculty Comment Section */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                  <label className="text-sm font-bold text-gray-900 block mb-2">
                    Faculty Comment <span className="text-red-500">*</span>
                    <span className="text-xs font-normal text-gray-500 ml-2">(Min 5 chars)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={currentMeta.comment}
                    onChange={e =>
                      updateMeta(activeStudent, { comment: e.target.value })
                    }
                    className={`
                      w-full border rounded-lg p-3 text-sm
                      transition-all
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      ${
                        currentMeta.comment.trim().length < 5
                          ? 'border-red-300 bg-red-50'
                          : 'border-green-300 bg-white'
                      }
                    `}
                    placeholder="Enter your feedback..."
                  />
                  <div className="flex justify-between items-center mt-1">
                    <div className={`text-xs font-medium ${currentMeta.comment.trim().length < 5 ? 'text-red-600' : 'text-green-600'}`}>
                      {currentMeta.comment.trim().length < 5 ? (
                        <>
                          <XCircleIcon className="w-3 h-3 inline mr-1" />
                          {currentMeta.comment.trim().length}/5 (Need {5 - currentMeta.comment.trim().length} more)
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-3 h-3 inline mr-1" />
                          Complete ({currentMeta.comment.trim().length} chars)
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center gap-3 p-3 border-t bg-white">
              <div className="text-xs text-gray-600">
                <span className="font-semibold">{team.students.length}</span> students • 
                <span className="font-semibold ml-1">
                  {team.students.filter(s => {
                    const m = meta[s.student_id];
                    return m?.comment?.trim().length >= 5 && 
                      (m.pat || m.attendance === 'absent' || rubrics.every(r => marks[s.student_id]?.[r.rubric_id] !== undefined));
                  }).length}
                </span> completed
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={!allValid() || saving}
                  onClick={handleSave}
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Save Marks'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default MarkEntryModal;
