import React, { useEffect, useState, useMemo, useCallback } from 'react';
import api from '../../../services/api';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import Toast from '../../../shared/components/Toast';
import {
  XCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const DEFAULT_META = Object.freeze({
  attendance: 'present',
  pat: false,
  comment: ''
});

const MarkEntryModal = ({ isOpen, onClose, review, team, onSuccess }) => {
  // --- STATE ---
  const [marks, setMarks] = useState({});
  const [meta, setMeta] = useState({});
  const [teamMeta, setTeamMeta] = useState({ pptApproved: false, teamComment: '' });

  const [activeStudent, setActiveStudent] = useState(null);
  const [activeRubricIndex, setActiveRubricIndex] = useState(0);
  const [viewMode, setViewMode] = useState('student'); // 'student' | 'dashboard'
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [spotlight, setSpotlight] = useState(null); // { score, label }
  const [hoveredLevel, setHoveredLevel] = useState(null); // For showing description below
  const [isSwitching, setIsSwitching] = useState(false); // New loading state for student switch

  const rubrics = useMemo(() => review?.rubrics || review?.rubric_structure || [], [review]);

  // --- INITIALIZATION ---
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
    setViewMode('student');
  }, [isOpen, team]);

  useEffect(() => {
    if (activeStudent) {
      setIsSwitching(true);
      const timer = setTimeout(() => {
        setIsSwitching(false);
        setActiveRubricIndex(0);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [activeStudent]);

  if (!isOpen || !team || !review) return null;

  // --- HELPERS ---
  const activeStudentData = team.students.find(s => s.student_id === activeStudent);
  const currentMeta = meta[activeStudent] || DEFAULT_META;
  const isBlocked = currentMeta.pat || currentMeta.attendance === 'absent';

  const updateMeta = (sid, patch) => {
    setMeta(prev => ({ ...prev, [sid]: { ...prev[sid], ...patch } }));
  };

  const getComponentTotal = (sid, rubric) => {
    const level = marks[sid]?.[rubric.rubric_id];
    if (level === undefined) return 0;
    const maxLevel = Math.max(...rubric.levels.map(l => l.score));
    return ((level / maxLevel) * rubric.max_marks).toFixed(1);
  };

  const calculateStudentTotal = (sid) => {
    if (!marks[sid] || meta[sid]?.pat || meta[sid]?.attendance === 'absent') return 0;
    return rubrics.reduce((sum, r) => sum + parseFloat(getComponentTotal(sid, r) || 0), 0);
  };

  const isStudentComplete = (sid) => {
    const m = meta[sid];
    if (!m) return false;
    if (m.pat || m.attendance === 'absent') return true;
    return rubrics.every(r => marks[sid]?.[r.rubric_id] !== undefined);
  };

  const allValid = team.students.every(s => isStudentComplete(s.student_id)) && teamMeta.teamComment.trim().length >= 10;

  // --- ACTIONS ---

  const handleNextStudent = useCallback((currentIndex) => {
    if (currentIndex < team.students.length - 1) {
      setActiveStudent(team.students[currentIndex + 1].student_id);
      setViewMode('student');
    } else {
      setViewMode('dashboard');
    }
  }, [team.students]);

  const setComponentLevel = (sid, rid, score, label) => {
    if (isBlocked) return;
    setMarks(prev => ({
      ...prev,
      [sid]: { ...prev[sid], [rid]: score }
    }));

    // Spotlight Effect
    setSpotlight({ score, label });

    // Auto-advance
    setTimeout(() => {
      setSpotlight(null);
      if (activeRubricIndex < rubrics.length - 1) {
        setActiveRubricIndex(prev => prev + 1);
      } else {
        const currentIndex = team.students.findIndex(s => s.student_id === activeStudent);
        setTimeout(() => {
          handleNextStudent(currentIndex);
        }, 300);
      }
    }, 600);
  };

  const handleAttendanceChange = (type, value) => {
    let patch = {};
    let shouldSkip = false;

    if (type === 'attendance') {
      patch = { attendance: value, pat: value === 'absent' ? false : currentMeta.pat };
      if (value === 'absent') shouldSkip = true;
    } else if (type === 'pat') {
      patch = { pat: value, attendance: value ? 'present' : currentMeta.attendance };
      if (value === true) shouldSkip = true;
    }
    updateMeta(activeStudent, patch);

    if (shouldSkip) {
      const currentIndex = team.students.findIndex(s => s.student_id === activeStudent);
      setToast({ type: 'info', message: `Marked as ${type === 'attendance' ? 'Absent' : 'PAT'}. Auto-skipping...` });
      setTimeout(() => {
        handleNextStudent(currentIndex);
        setToast(null);
      }, 1000);
    }
  };

  const handleDashboardScoreChange = (sid, rid, newScore) => {
    const rubric = rubrics.find(r => r.rubric_id === rid);
    const maxScore = Math.max(...rubric.levels.map(l => l.score));

    // Allow clearing the input
    if (newScore === '') {
      setMarks(prev => ({ ...prev, [sid]: { ...prev[sid], [rid]: '' } }));
      return;
    }

    let val = parseFloat(newScore);
    if (isNaN(val)) return;

    // Strict clamping
    if (val < 0) val = 0;
    if (val > maxScore) {
      val = maxScore;
      setToast({ type: 'error', message: `Max marks for ${rubric.component_name} is ${maxScore}` });
    }

    setMarks(prev => ({
      ...prev,
      [sid]: { ...prev[sid], [rid]: val }
    }));
  };

  const handleSave = async () => {
    if (!allValid) {
      setToast({ type: 'error', message: 'Please complete all fields & team feedback.' });
      return;
    }
    setSaving(true);

    try {
      const timestamp = new Date().toISOString();
      const submissions = team.students.map(student => {
        const sid = student.student_id;
        const studentMarks = marks[sid] || {};
        const studentMeta = meta[sid] || DEFAULT_META;

        // Remarks construction
        let remarks = studentMeta.comment || '';
        if (studentMeta.attendance === 'absent') remarks = `[ABSENT] ${remarks}`;
        if (studentMeta.pat) remarks = `[PAT] ${remarks}`;
        if (teamMeta.teamComment) remarks += ` | Team Feedback: ${teamMeta.teamComment}`;
        if (teamMeta.pptApproved) remarks += ` | PPT Approved`;

        // Calculate Components
        const componentMarks = rubrics.map(rubric => {
          const score = parseFloat(studentMarks[rubric.rubric_id] || 0);
          return {
            componentId: rubric.rubricId || rubric.rubric_id, // Ensure ID matches what backend expects (ObjectId or string?)
            componentName: rubric.componentName || rubric.component_name,
            marks: score,
            maxMarks: rubric.maxMarks || rubric.max_marks,
            componentTotal: score, // Flat structure
            componentMaxTotal: rubric.maxMarks || rubric.max_marks,
            remarks: ''
          };
        });

        const totalObtained = componentMarks.reduce((sum, c) => sum + c.componentTotal, 0);
        const maxTotal = componentMarks.reduce((sum, c) => sum + c.componentMaxTotal, 0);

        // Payload
        return api.post('/faculty/marks', {
          student: sid,
          project: team.id || team.project_id || team.team_id, // Check ID field 
          reviewType: review.id || review.reviewName, // Use review ID
          facultyType: review.type || 'guide', // Default guide
          componentMarks,
          totalMarks: totalObtained,
          maxTotalMarks: maxTotal,
          remarks: remarks,
          isSubmitted: true // Final submission
        });
      });

      await Promise.all(submissions);

      setToast({ type: 'success', message: 'Marks submitted successfully!' });
      await new Promise(r => setTimeout(r, 1000)); // Show success toast
      onSuccess?.({ marks, meta, teamMeta });
      onClose();

    } catch (err) {
      console.error('Submission failed', err);
      setToast({ type: 'error', message: 'Failed to submit marks. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // --- RENDER HELPERS ---
  const getScoreColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'bg-green-50 text-green-700 border-green-200 ring-green-100';
    if (percentage >= 60) return 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-100';
    if (percentage >= 40) return 'bg-yellow-50 text-yellow-700 border-yellow-200 ring-yellow-100';
    return 'bg-red-50 text-red-700 border-red-200 ring-red-100';
  };

  const getGridCols = (count) => {
    if (count <= 4) return 'grid-cols-2 md:grid-cols-4';
    if (count === 5) return 'grid-cols-2 md:grid-cols-5';
    if (count <= 8) return 'grid-cols-3 md:grid-cols-4';
    return 'grid-cols-3 md:grid-cols-5';
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="full" hideHeader={true} noPadding={true}>
        <div className="flex bg-slate-50 h-screen overflow-hidden font-sans">

          {/* LEFT SIDEBAR */}
          <div className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reviewing Team</h2>
              <div className="text-lg font-bold text-slate-800 leading-tight">{team.team_name}</div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {team.students.map(s => {
                const isActive = activeStudent === s.student_id && viewMode === 'student';
                const isComplete = isStudentComplete(s.student_id);
                const total = calculateStudentTotal(s.student_id);
                const m = meta[s.student_id] || DEFAULT_META;
                const isAbsOrPat = m.pat || m.attendance === 'absent';

                return (
                  <button
                    key={s.student_id}
                    onClick={() => { setActiveStudent(s.student_id); setViewMode('student'); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all relative border
                      ${isActive ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-100' : 'bg-white hover:bg-slate-50 border-transparent'}
                    `}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden ring-2 ring-white shadow-sm">
                        <img src={s.profile_image || `https://ui-avatars.com/api/?name=${s.student_name}`} alt="" className="w-full h-full object-cover" />
                      </div>
                      {isComplete && !isAbsOrPat && (
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-bold truncate ${isActive ? 'text-blue-900' : 'text-slate-700'}`}>{s.student_name}</div>
                      <div className="text-xs text-slate-400 truncate">{s.roll_no}</div>
                    </div>
                    {isAbsOrPat ? (
                      <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">abs</span>
                    ) : (
                      <div className={`text-sm font-bold ${isActive ? 'text-blue-600' : 'text-slate-300'}`}>
                        {Math.round(total)}
                      </div>
                    )}
                  </button>
                );
              })}
              <div className="my-2 border-t border-slate-100"></div>
              <button
                onClick={() => setViewMode('dashboard')}
                className={`w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all border
                  ${viewMode === 'dashboard' ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-100 text-purple-900' : 'bg-white hover:bg-slate-50 border-transparent text-slate-600'}
                `}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${viewMode === 'dashboard' ? 'bg-purple-200 text-purple-700' : 'bg-slate-100 text-slate-400'}`}>
                  <UserGroupIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold">Team Dashboard</div>
                  <div className="text-xs opacity-70">Submit Review</div>
                </div>
              </button>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 flex flex-col relative min-w-0 bg-slate-50/50">
            {/* Header */}
            {viewMode === 'student' && activeStudentData && (
              <div className="bg-white/80 backdrop-blur-md px-8 py-4 border-b border-slate-200 flex justify-between items-center shrink-0 sticky top-0 z-30">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{activeStudentData.student_name}</h1>
                  <div className="text-sm text-slate-500">{activeStudentData.roll_no}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => handleAttendanceChange('attendance', 'present')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${currentMeta.attendance === 'present' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Present</button>
                    <button onClick={() => handleAttendanceChange('attendance', 'absent')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${currentMeta.attendance === 'absent' ? 'bg-red-500 shadow text-white' : 'text-slate-500 hover:text-red-600'}`}>Absent</button>
                  </div>
                  <button onClick={() => handleAttendanceChange('pat', !currentMeta.pat)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-2 ${currentMeta.pat ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white border-slate-200 text-slate-500 hover:border-orange-300'}`}>
                    <span>PAT</span>{currentMeta.pat && <CheckCircleIcon className="w-4 h-4" />}
                  </button>
                  <button onClick={onClose} className="ml-4 p-2 text-slate-400 hover:text-slate-600"><XCircleIcon className="w-8 h-8" /></button>
                </div>
              </div>
            )}

            {/* CONTENT */}
            <div className="flex-1 p-8 overflow-y-auto flex flex-col relative w-full">
              {viewMode === 'student' && activeStudentData && (
                <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col">
                  {/* LOADING OVERLAY FOR STUDENT SWITCH */}
                  {isSwitching && (
                    <div className="absolute inset-0 z-40 bg-white/80 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
                      <div className="text-center">
                        <div className="inline-block w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <h3 className="text-xl font-bold text-slate-800">Switching to {activeStudentData.student_name}...</h3>
                      </div>
                    </div>
                  )}

                  {/* SPOTLIGHT OVERLAY */}
                  {spotlight && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
                      <div className="bg-slate-900 text-white p-10 rounded-3xl shadow-2xl flex flex-col items-center transform scale-110 transition-transform animate-bounce-subtle">
                        <div className="text-7xl font-black mb-2 tracking-tighter">{spotlight.score}</div>
                        <div className="text-2xl font-bold text-slate-300 uppercase tracking-widest">{spotlight.label}</div>
                      </div>
                    </div>
                  )}

                  {!isSwitching && rubrics.length > 0 && (() => {
                    const rubric = rubrics[activeRubricIndex];
                    const selectedLevel = marks[activeStudent]?.[rubric.rubric_id];
                    // Find description to show: either hovered or selected
                    const activeLevelInfo = hoveredLevel || rubric.levels.find(l => l.score === selectedLevel);
                    const maxLevel = Math.max(...rubric.levels.map(l => l.score));

                    return (
                      <div className="flex-1 flex flex-col animate-fadeIn">
                        {/* Rubric Progress */}
                        <div className="flex justify-center gap-2 mb-8">
                          {rubrics.map((_, idx) => (
                            <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeRubricIndex ? 'w-12 bg-blue-600' : 'w-2 bg-slate-200'}`} />
                          ))}
                        </div>

                        <div className="text-center mb-10">
                          <h3 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">{rubric.component_name}</h3>
                          <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">{rubric.component_description}</p>
                        </div>

                        {/* MARKS GRID */}
                        <div className={`grid gap-4 mb-8 ${getGridCols(rubric.levels.length)}`} onMouseLeave={() => setHoveredLevel(null)}>
                          {rubric.levels.map(level => {
                            const isSelected = selectedLevel === level.score;
                            const colorClass = getScoreColor(level.score, maxLevel);
                            return (
                              <button
                                key={level.score}
                                onClick={() => setComponentLevel(activeStudent, rubric.rubric_id, level.score, level.label)}
                                onMouseEnter={() => setHoveredLevel(level)}
                                disabled={isBlocked}
                                className={`
                                        group relative p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center
                                        ${isSelected ? `${colorClass} shadow-xl scale-105 z-10 border-current` : 'bg-white border-slate-100 hover:border-blue-300 hover:shadow-lg hover:-translate-y-1'}
                                        ${isBlocked ? 'opacity-40 cursor-not-allowed' : ''}
                                     `}
                              >
                                <div className={`text-4xl font-black mb-1 transition-transform group-hover:scale-110 ${isSelected ? 'text-inherit' : 'text-slate-800'}`}>{level.score}</div>
                                <div className="text-xs uppercase font-bold tracking-wider opacity-70">{level.label}</div>
                              </button>
                            )
                          })}
                        </div>

                        {/* DESCRIPTION AREA */}
                        <div className="bg-blue-50/50 rounded-xl p-6 mb-8 min-h-[100px] flex items-center justify-center text-center border border-blue-100/50 transition-all">
                          {activeLevelInfo ? (
                            <div className="animate-fadeIn">
                              <div className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-1 opacity-70">{activeLevelInfo.label} ({activeLevelInfo.score})</div>
                              {/* Using description if available, else label */}
                              <div className="text-lg text-slate-700 leading-relaxed font-medium">{activeLevelInfo.description || activeLevelInfo.label}</div>
                            </div>
                          ) : (
                            <div className="text-slate-400 italic">Hover over a mark to see details</div>
                          )}
                        </div>

                        {/* BOTTOM NAVIGATION */}
                        <div className="mt-auto flex justify-between items-center sticky bottom-0 bg-white/90 backdrop-blur p-4 rounded-xl border border-slate-100 shadow-sm z-20">
                          <Button
                            variant="secondary"
                            onClick={() => {
                              if (activeRubricIndex > 0) setActiveRubricIndex(p => p - 1);
                              else {
                                const currIdx = team.students.findIndex(s => s.student_id === activeStudent);
                                if (currIdx > 0) setActiveStudent(team.students[currIdx - 1].student_id);
                              }
                            }}
                            disabled={activeRubricIndex === 0 && team.students[0].student_id === activeStudent}
                            className="w-32 rounded-full"
                          >
                            <ChevronLeftIcon className="w-4 h-4 mr-2" /> Back
                          </Button>
                          <div className="text-xs font-bold text-slate-300 uppercase tracking-widest hidden md:block">Navigation</div>
                          <Button
                            variant="primary"
                            onClick={() => {
                              if (activeRubricIndex < rubrics.length - 1) setActiveRubricIndex(p => p + 1);
                              else handleNextStudent(team.students.findIndex(s => s.student_id === activeStudent));
                            }}
                            className="w-32 rounded-full"
                          >
                            {activeRubricIndex === rubrics.length - 1 ? 'Finish' : 'Next'}
                            <ChevronRightIcon className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {viewMode === 'dashboard' && (
                <div className="max-w-4xl mx-auto w-full animate-slideUp">
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 mb-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600"><UserGroupIcon className="w-5 h-5" /></div>
                      <div><h2 className="text-xl font-bold text-slate-800">Team Dashboard</h2><p className="text-xs text-slate-500">Edit marks directly and provide feedback.</p></div>
                      <button onClick={onClose} className="ml-auto p-2 text-slate-400 hover:text-slate-600"><XCircleIcon className="w-8 h-8" /></button>
                    </div>

                    {/* EDITABLE MARKS TABLE */}
                    <div className="overflow-x-auto mb-6 border rounded-xl border-slate-200 shadow-sm custom-scrollbar">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
                          <tr>
                            <th className="px-5 py-3">Student</th>
                            {rubrics.map(r => <th key={r.rubric_id} className="px-3 py-3 text-center">{r.component_name} <span className="text-[10px] text-slate-400">({r.max_marks})</span></th>)}
                            <th className="px-5 py-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {team.students.map(s => {
                            const total = calculateStudentTotal(s.student_id);
                            return (
                              <tr key={s.student_id} className="bg-white hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3 font-bold text-slate-800 flex items-center gap-3">
                                  <img src={s.profile_image || `https://ui-avatars.com/api/?name=${s.student_name}`} className="w-7 h-7 rounded-full bg-slate-200" alt="" />
                                  <span className="truncate max-w-[120px]" title={s.student_name}>{s.student_name}</span>
                                </td>
                                {rubrics.map(r => {
                                  const score = marks[s.student_id]?.[r.rubric_id] ?? '';
                                  return (
                                    <td key={r.rubric_id} className="px-3 py-3 text-center">
                                      <input
                                        type="number"
                                        value={score}
                                        onChange={(e) => handleDashboardScoreChange(s.student_id, r.rubric_id, e.target.value)}
                                        className="w-14 p-1.5 text-center border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-bold text-slate-700 bg-slate-50 focus:bg-white transition-all text-xs"
                                        max={Math.max(...r.levels.map(l => l.score))}
                                        min={0}
                                      />
                                    </td>
                                  )
                                })}
                                <td className="px-5 py-3 text-right font-black text-slate-900 text-base">{total}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mb-0">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Team Feedback <span className="text-red-500">*</span></label>
                      <textarea
                        value={teamMeta.teamComment}
                        onChange={(e) => setTeamMeta(prev => ({ ...prev, teamComment: e.target.value }))}
                        placeholder="Enter specific feedback for the entire team..."
                        className="w-full h-24 p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-slate-50 focus:bg-white transition-colors"
                      />
                      <div className="flex justify-between items-center mt-3">
                        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors">
                          <input type="checkbox" checked={teamMeta.pptApproved} onChange={(e) => setTeamMeta(prev => ({ ...prev, pptApproved: e.target.checked }))} className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-gray-300" />
                          <span className="text-sm font-bold text-slate-700">PPT Approved by Guide</span>
                        </label>
                        <span className={`text-xs font-bold ${teamMeta.teamComment.length >= 10 ? 'text-green-600' : 'text-slate-400'}`}>{teamMeta.teamComment.length} / 10 chars</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-5 mt-5 border-t border-slate-100">
                      <Button variant="secondary" onClick={onClose} className="w-28 justify-center text-sm">Cancel</Button>
                      <Button variant="primary" onClick={handleSave} disabled={!allValid || saving} className="w-40 justify-center py-2.5 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200 rounded-xl text-sm">{saving ? 'Submitting...' : 'Submit Evaluation'}</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <style jsx>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
          .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        `}</style>
      </Modal>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  );
};

export default MarkEntryModal;
