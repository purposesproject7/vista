import React, { useEffect, useState, useMemo } from 'react';
import api from '../../../services/api';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import Toast from '../../../shared/components/Toast';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
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

  const [initialState, setInitialState] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  const rubrics = useMemo(() => review?.rubrics || review?.rubric_structure || [], [review]);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (!isOpen || !team) return;
    const initMarks = {};
    const initMeta = {};

    // Initialize team-level metadata
    let foundTeamComment = team.teamComment || '';
    let foundPptApproved = team.pptApproved || false;

    team.students.forEach(s => {
      const studentMarks = {};
      if (s.existingMarks && Array.isArray(s.existingMarks)) {
        s.existingMarks.forEach(em => {
          studentMarks[em.componentId] = em.marks;
        });
      }
      initMarks[s.student_id] = studentMarks;

      const rawComment = s.existingMeta?.comment || '';

      // Try to extract team feedback if we haven't found it yet
      if (!foundTeamComment && rawComment.includes('| Team Feedback:')) {
        const match = rawComment.match(/\|\s*Team Feedback:\s*(.*?)(?:\s*\|\s*PPT Approved|$)/);
        if (match && match[1]) {
          foundTeamComment = match[1].trim();
        }
      }

      // Try to extract PPT approval if we haven't found it yet
      if (!foundPptApproved && rawComment.includes('| PPT Approved')) {
        foundPptApproved = true;
      }

      initMeta[s.student_id] = {
        ...DEFAULT_META,
        comment: rawComment.replace(/^\[ABSENT\]\s*|^\[PAT\]\s*|\|\s*Team Feedback:.*|\|\s*PPT Approved/g, '').trim() || '',
        attendance: rawComment.includes('[ABSENT]') ? 'absent' : 'present',
        pat: rawComment.includes('[PAT]') ? true : false
      };
    });

    setMarks(initMarks);
    setMeta(initMeta);
    setInitialState({ marks: JSON.stringify(initMarks), meta: JSON.stringify(initMeta) });
    setTeamMeta({
      pptApproved: foundPptApproved,
      teamComment: foundTeamComment
    });
  }, [isOpen, team]);

  const isDirty = useMemo(() => {
    if (!initialState) return false;
    return JSON.stringify(marks) !== initialState.marks || JSON.stringify(meta) !== initialState.meta;
  }, [marks, meta, initialState]);

  const handleCloseAttempt = () => {
    if (isDirty) {
      setConfirmation({ type: 'close' });
    } else {
      onClose();
    }
  };

  if (!isOpen || !team || !review) return null;

  // --- HELPERS ---
  const updateMeta = (sid, patch) => {
    setMeta(prev => ({ ...prev, [sid]: { ...prev[sid], ...patch } }));
  };

  const calculateStudentTotal = (sid) => {
    if (!marks[sid] || meta[sid]?.pat || meta[sid]?.attendance === 'absent') return 0;
    return rubrics.reduce((sum, r) => {
      const val = parseFloat(marks[sid]?.[r.rubric_id] || 0);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  };

  const isStudentComplete = (sid) => {
    const m = meta[sid];
    if (!m) return false;
    if (m.pat || m.attendance === 'absent') return true;
    return rubrics.every(r => {
      const val = marks[sid]?.[r.rubric_id];
      return val !== undefined && val !== '' && !isNaN(parseFloat(val));
    });
  };

  const allValid = team.students.every(s => isStudentComplete(s.student_id)) && teamMeta.teamComment.trim().length >= 10;

  // --- ACTIONS ---
  const handleScoreChange = (sid, rid, val) => {
    const currentMeta = meta[sid] || DEFAULT_META;
    if (currentMeta.pat || currentMeta.attendance === 'absent') return;

    if (val === '') {
      setMarks(prev => ({ ...prev, [sid]: { ...prev[sid], [rid]: '' } }));
      return;
    }

    let numVal = parseFloat(val);
    const rubric = rubrics.find(r => r.rubric_id === rid);
    const max = rubric ? (rubric.maxMarks || rubric.max_marks) : 100;

    if (numVal < 0) numVal = 0;
    if (numVal > max) {
      setToast({ type: 'error', message: `Max marks for this component is ${max}` });
      numVal = max;
    }

    setMarks(prev => ({
      ...prev,
      [sid]: { ...prev[sid], [rid]: numVal }
    }));
  };

  const initiateAttendanceChange = (sid, type) => {
    const currentMeta = meta[sid] || DEFAULT_META;
    if ((type === 'attendance' && currentMeta.attendance === 'absent') ||
      (type === 'pat' && currentMeta.pat)) {
      confirmAttendanceChange(sid, type, false);
    } else {
      setConfirmation({ type, studentId: sid });
    }
  };

  const confirmAttendanceChange = (sid, type, isActive) => {
    const currentMeta = meta[sid] || DEFAULT_META;
    let patch = {};
    if (type === 'attendance') {
      const newVal = isActive ? 'absent' : 'present';
      patch = { attendance: newVal, pat: newVal === 'absent' ? false : currentMeta.pat };
    } else if (type === 'pat') {
      patch = { pat: isActive, attendance: isActive ? 'present' : currentMeta.attendance };
    }
    updateMeta(sid, patch);
    setConfirmation(null);
  };

  const handleSave = async () => {
    if (!allValid) {
      setToast({ type: 'error', message: 'Please complete all fields & team feedback.' });
      return;
    }
    setSaving(true);
    try {
      const submissions = team.students.map(student => {
        const sid = student.student_id;
        const studentMarks = marks[sid] || {};
        const studentMeta = meta[sid] || DEFAULT_META;

        let remarks = studentMeta.comment || '';
        if (studentMeta.attendance === 'absent') remarks = `[ABSENT] ${remarks}`;
        if (studentMeta.pat) remarks = `[PAT] ${remarks}`;
        if (teamMeta.teamComment) remarks += ` | Team Feedback: ${teamMeta.teamComment}`;
        if (teamMeta.pptApproved) remarks += ` | PPT Approved`;

        const componentMarks = rubrics.map(rubric => {
          const score = parseFloat(studentMarks[rubric.rubric_id] || 0);
          const max = rubric.maxMarks || rubric.max_marks;
          return {
            componentId: rubric.rubricId || rubric.rubric_id,
            componentName: rubric.componentName || rubric.component_name,
            marks: score,
            maxMarks: max,
            componentTotal: score,
            componentMaxTotal: max,
            remarks: ''
          };
        });

        const totalObtained = componentMarks.reduce((sum, c) => sum + c.componentTotal, 0);
        const maxTotal = componentMarks.reduce((sum, c) => sum + c.componentMaxTotal, 0);

        return api.post('/faculty/marks', {
          student: sid,
          project: team.id || team.project_id || team.team_id,
          reviewType: review.id || review.reviewName,
          facultyType: review.type || 'guide',
          componentMarks,
          totalMarks: totalObtained,
          maxTotalMarks: maxTotal,
          remarks: remarks,
          isSubmitted: true
        });
      });

      await Promise.all(submissions);
      setToast({ type: 'success', message: 'Marks submitted successfully!' });
      await new Promise(r => setTimeout(r, 1000));
      onSuccess?.({ marks, meta, teamMeta });
      onClose();
    } catch (err) {
      console.error('Submission failed', err);
      setToast({ type: 'error', message: 'Failed to submit marks.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleCloseAttempt} size="full" hideHeader={true} noPadding={true}>
        <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800">

          {/* HEADER */}
          <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0 z-40 shadow-sm">
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Reviewing Team</h2>
              <h1 className="text-xl font-black text-slate-900 leading-tight">{team.team_name}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-500 hidden md:block">All changes are local until submitted.</span>
              <Button variant="secondary" onClick={handleCloseAttempt} className="text-sm">Exit</Button>
            </div>
          </div>

          {/* SCROLLABLE BODY */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <div className="max-w-6xl mx-auto space-y-8 pb-20">

              {/* RUBRIC CARDS */}
              {rubrics.map((rubric) => {
                const max = rubric.maxMarks || rubric.max_marks;
                return (
                  <div key={rubric.rubric_id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* CARD HEADER: DESCRIPTION */}
                    <div className="px-6 py-5 bg-slate-50 border-b border-slate-200">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-black text-slate-900">{rubric.component_name}</h3>
                        <span className="text-xs font-bold bg-white border border-slate-200 px-3 py-1 rounded-full text-slate-600 shadow-sm">Max: {max}</span>
                      </div>
                      <div className="text-sm text-slate-600 leading-relaxed">
                        {Array.isArray(rubric.component_description)
                          ? (
                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                              {rubric.component_description.map((c, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                  <span className="font-medium text-slate-700">{c.label}</span>
                                  {c.marks && <span className="font-black text-slate-900 bg-white px-1.5 rounded border border-slate-200 text-[10px]">{c.marks}</span>}
                                </span>
                              ))}
                            </div>
                          )
                          : rubric.component_description}
                      </div>
                    </div>

                    {/* CARD BODY: STUDENT LIST */}
                    <div className="divide-y divide-slate-100">
                      {team.students.map(student => {
                        const sid = student.student_id;
                        const m = meta[sid] || DEFAULT_META;
                        const currentScore = marks[sid]?.[rubric.rubric_id];
                        const isAbsOrPat = m.pat || m.attendance === 'absent';

                        return (
                          <div key={sid} className={`px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${isAbsOrPat ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>

                            {/* STUDENT INFO & ATTENDANCE */}
                            <div className="flex items-center gap-4 min-w-[30%]">
                              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden ring-2 ring-white shadow-sm flex-shrink-0">
                                <img src={student.profile_image || `https://ui-avatars.com/api/?name=${student.student_name}`} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{student.student_name}</div>
                                <div className="text-xs font-bold text-slate-400">{student.roll_no}</div>
                              </div>
                            </div>

                            {/* MIDDLE: ATTENDANCE CONTROLS */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => initiateAttendanceChange(sid, 'attendance')}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border
                                                          ${m.attendance === 'present' && !m.pat
                                    ? 'bg-green-100 text-green-600 border-green-300 ring-2 ring-green-50'
                                    : 'bg-white text-slate-300 border-slate-200 hover:border-slate-300'}
                                                        `}
                                title="Mark Present"
                              >
                                <span className="w-2.5 h-2.5 rounded-full bg-current"></span>
                              </button>

                              <button
                                onClick={() => initiateAttendanceChange(sid, 'attendance')}
                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border
                                                          ${m.attendance === 'absent'
                                    ? 'bg-red-500 text-white border-red-600 shadow-sm'
                                    : 'bg-white text-slate-400 border-slate-200 hover:text-red-500'}
                                                        `}
                              >
                                Absent
                              </button>
                              <button
                                onClick={() => initiateAttendanceChange(sid, 'pat')}
                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border
                                                          ${m.pat
                                    ? 'bg-orange-500 text-white border-orange-600 shadow-sm'
                                    : 'bg-white text-slate-400 border-slate-200 hover:text-orange-500'}
                                                        `}
                              >
                                PAT
                              </button>
                            </div>

                            {/* RIGHT: INPUT */}
                            <div className="w-full md:w-auto text-right">
                              {isAbsOrPat ? (
                                <div className={`inline-block px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider border ${m.attendance === 'absent' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-orange-50 text-orange-500 border-orange-100'}`}>
                                  {m.attendance === 'absent' ? 'ABSENT' : 'PAT'}
                                </div>
                              ) : (
                                <input
                                  type="number"
                                  min="0"
                                  max={max}
                                  value={currentScore !== undefined ? currentScore : ''}
                                  onChange={(e) => handleScoreChange(sid, rubric.rubric_id, e.target.value)}
                                  className="w-24 bg-white border border-slate-300 rounded-lg py-2 text-center text-xl font-black text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all placeholder-slate-200"
                                  placeholder="-"
                                />
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* TEAM FEEDBACK SECTION */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600"><UserGroupIcon className="w-6 h-6" /></div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Final Team Feedback</h2>
                    <p className="text-sm text-slate-500 font-medium">This feedback applies to the entire team.</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  <textarea
                    value={teamMeta.teamComment}
                    onChange={(e) => setTeamMeta(prev => ({ ...prev, teamComment: e.target.value }))}
                    placeholder="Write your constructive feedback here..."
                    className="flex-1 w-full p-4 text-base border-2 border-slate-100 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all resize-none min-h-[120px]"
                  />
                  <div className="w-full md:w-72 shrink-0 flex flex-col gap-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => setTeamMeta(prev => ({ ...prev, pptApproved: !prev.pptApproved }))}>
                      <label className="flex items-center gap-3 cursor-pointer pointer-events-none">
                        <input type="checkbox" checked={teamMeta.pptApproved} onChange={() => { }} className="w-6 h-6 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                        <span className="text-base font-bold text-slate-800">PPT Approved</span>
                      </label>
                    </div>
                    <Button variant="primary" onClick={handleSave} disabled={!allValid || saving} className="w-full py-4 text-lg bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-200">
                      {saving ? 'Submitting...' : 'Submit All Marks'}
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* CONFIRMATION DIALOG */}
        {confirmation && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm transform scale-100 transition-all border border-slate-100">
              <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${confirmation.type === 'close' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                {confirmation.type === 'close' ? <ExclamationCircleIcon className="w-8 h-8" /> : <ExclamationTriangleIcon className="w-8 h-8" />}
              </div>
              <h3 className="text-center text-xl font-black text-slate-800 mb-2">
                {confirmation.type === 'close' ? 'Unsaved Changes' : 'Confirm Action'}
              </h3>
              <p className="text-center text-sm text-slate-500 font-medium mb-8 leading-relaxed px-2">
                {confirmation.type === 'close'
                  ? 'Are you sure you want to exit? Your marks have not been submitted.'
                  : 'Marking this student as Absent/PAT will clear any entered marks. Continue?'}
              </p>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setConfirmation(null)} className="flex-1 justify-center rounded-xl py-3 font-bold bg-slate-100 text-slate-600">Cancel</Button>
                <Button
                  variant="primary"
                  onClick={args => {
                    if (confirmation.type === 'close') onClose();
                    else confirmAttendanceChange(confirmation.studentId, confirmation.type, true);
                  }}
                  className={`flex-1 justify-center rounded-xl py-3 font-bold text-white shadow-lg ${confirmation.type === 'close' ? 'bg-orange-500 shadow-orange-200' : 'bg-red-600 shadow-red-200'}`}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        )}

      </Modal>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  );
};

export default MarkEntryModal;
