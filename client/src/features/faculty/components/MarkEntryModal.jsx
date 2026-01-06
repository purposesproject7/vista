import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import Toast from '../../../shared/components/Toast';
import { InformationCircleIcon, CheckCircleIcon, XCircleIcon, DocumentTextIcon, PresentationChartBarIcon, EyeIcon } from '@heroicons/react/24/outline';

/* Immutable default meta */
const DEFAULT_META = Object.freeze({
  attendance: 'present',
  pat: false
});

const MarkEntryModal = ({ isOpen, onClose, review, team, onSuccess }) => {
  const [marks, setMarks] = useState({});
  const [meta, setMeta] = useState({});
  const [teamMeta, setTeamMeta] = useState({
    pptApproved: false,
    teamComment: ''
  });
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeStudent, setActiveStudent] = useState(null);
  const [previousComments, setPreviousComments] = useState(null);
  const [criteriaModalOpen, setCriteriaModalOpen] = useState(false);
  const [selectedCriteria, setSelectedCriteria] = useState(null);
  const [expandedRubric, setExpandedRubric] = useState(null);
  const [focusedRubric, setFocusedRubric] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const rubrics = review?.rubric_structure || [];
  
  // MOCK DATA: Add diverse components for testing
  const mockRubrics = rubrics.length > 0 ? rubrics : [
    {
      rubric_id: 'mock_10_mark',
      component_name: '10M Component',
      component_description: 'Full scale component with 11 levels (0-10)',
      max_marks: 10,
      levels: Array.from({ length: 11 }, (_, i) => ({
        score: i,
        label: i === 0 ? 'None' : i === 10 ? 'Perfect' : `Level ${i}`,
        description: `Level ${i} performance`
      }))
    },
    {
      rubric_id: 'mock_5_mark',
      component_name: '5M Component',
      component_description: 'Component with 5 levels (1-5)',
      max_marks: 5,
      levels: Array.from({ length: 5 }, (_, i) => {
        const score = i + 1;
        return {
          score: score,
          label: ['Poor', 'Fair', 'Good', 'V.Good', 'Excellent'][i],
          description: `${['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][i]} performance`
        };
      })
    },
    {
      rubric_id: 'mock_3_mark',
      component_name: '3M Component',
      component_description: 'Small component with 3 levels (1-3)',
      max_marks: 3,
      levels: [
        { score: 1, label: 'Basic', description: 'Basic attempt made' },
        { score: 2, label: 'Good', description: 'Good quality work' },
        { score: 3, label: 'Excellent', description: 'Excellent work' }
      ]
    }
  ];

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
    
    // Fetch previous comments if available
    fetchPreviousComments();
  }, [isOpen, team]);

  const fetchPreviousComments = async () => {
    // Mock API call - replace with actual API
    await new Promise(r => setTimeout(r, 500));
    
    // Simulate previous comments from last review
    if (Math.random() > 0.5) { // 50% chance of having previous comments
      setPreviousComments({
        reviewName: 'Review 1',
        date: '2025-12-15',
        comments: team?.students.map(s => ({
          student_id: s.student_id,
          comment: `Previous feedback for ${s.student_name}: Good progress shown in initial review.`
        })) || []
      });
    } else {
      setPreviousComments(null);
    }
  };

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
    setHasChanges(true);
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
    setHasChanges(true);
  };

  const getComponentTotal = (sid, rubric) => {
    const level = marks[sid]?.[rubric.rubric_id];
    if (level === undefined) return 0;
    
    // Calculate based on level percentage
    const maxLevel = Math.max(...rubric.levels.map(l => l.score));
    return ((level / maxLevel) * rubric.max_marks).toFixed(1);
  };

  const studentGrandTotal = sid => {
    return mockRubrics.reduce((sum, r) => {
      return sum + parseFloat(getComponentTotal(sid, r) || 0);
    }, 0);
  };

  const maxTotal = mockRubrics.reduce((s, r) => s + r.max_marks, 0);

  // Use useMemo to calculate validation errors without causing re-renders
  const validationResult = useMemo(() => {
    const errors = [];
    
    // Check team comment
    if (teamMeta.teamComment.trim().length < 10) {
      errors.push(`Team comment must be at least 10 characters (currently ${teamMeta.teamComment.trim().length} characters)`);
    }
    
    // Check each student
    team.students.forEach(s => {
      const m = meta[s.student_id];
      if (!m) {
        errors.push(`${s.student_name}: Missing student metadata`);
        return;
      }
      
      // Skip if PAT or absent
      if (m.pat || m.attendance === 'absent') return;
      
      // Check for missing marks
      const missingComponents = [];
      mockRubrics.forEach(r => {
        if (marks[s.student_id]?.[r.rubric_id] === undefined) {
          missingComponents.push(r.component_name);
        }
      });
      
      if (missingComponents.length > 0) {
        errors.push(`${s.student_name}: Missing marks for ${missingComponents.join(', ')}`);
      }
    });
    
    return { errors, isValid: errors.length === 0 };
  }, [marks, meta, teamMeta.teamComment, team.students, rubrics]);

  const allValid = () => validationResult.isValid;

  const handleSave = async () => {
    if (!allValid()) {
      setShowValidationErrors(true);
      setToast({
        type: 'error',
        message:
          'Please fix all validation errors before saving.'
      });
      return;
    }

    setSaving(true);
    await new Promise(r => setTimeout(r, 800));

    onSuccess?.({ marks, meta, teamMeta });

    setSaving(false);
    setHasChanges(false);
    setShowValidationErrors(false);
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
  const previousComment = previousComments?.comments?.find(c => c.student_id === activeStudent);

  const openCriteriaModal = (rubric) => {
    setSelectedCriteria(rubric);
    setCriteriaModalOpen(true);
  };

  const handleClose = () => {
    if (hasChanges) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  const confirmClose = () => {
    setShowCloseConfirm(false);
    setHasChanges(false);
    onClose();
  };

  const cancelClose = () => {
    setShowCloseConfirm(false);
  };

  /* ================= UI ================= */
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="full"
        hideHeader={true}
        noPadding={true}
      >
        <div className="flex flex-col h-screen bg-white">
          {/* Top Bar with Back Button */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 border-b-2 border-blue-800">
            <button 
              onClick={handleClose} 
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-semibold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-white">{review.review_name} - {team.team_name}</h2>
            </div>
          </div>

          {/* Main Content - Clean Grid */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Components + Criteria Below */}
            <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
              {/* Components Grid - Top */}
              <div className="overflow-y-auto p-3">
                <div className="mb-2">
                  <h2 className="text-xs font-bold text-gray-800 mb-1.5 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {mockRubrics.filter(r => marks[activeStudent]?.[r.rubric_id] !== undefined).length}/{mockRubrics.length}
                    </span>
                    <span>Components</span>
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
              {mockRubrics.map((rubric, idx) => {
                const selectedLevel = marks[activeStudent]?.[rubric.rubric_id];
                const componentTotal = getComponentTotal(activeStudent, rubric);
                const maxLevel = Math.max(...rubric.levels.map(l => l.score));
                const isFocused = focusedRubric === rubric.rubric_id;

                return (
                  <div 
                    key={rubric.rubric_id} 
                    onClick={() => setFocusedRubric(rubric.rubric_id)}
                    className={`bg-white rounded-md border-2 shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                      isFocused ? 'border-blue-600 ring-2 ring-blue-400' : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {/* Header */}
                    <div className={`flex items-center gap-2 px-2.5 py-1.5 border-b-2 ${
                      isFocused ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-700' : 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200'
                    }`}>
                      <span className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${
                        isFocused ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-xs font-bold truncate ${
                          isFocused ? 'text-white' : 'text-gray-900'
                        }`}>{rubric.component_name}</h3>
                      </div>
                      {selectedLevel !== undefined && (
                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${
                          isFocused ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                        }`}>
                          {componentTotal}<span className="opacity-75">/{rubric.max_marks}</span>
                        </div>
                      )}
                    </div>

                    {/* Compact Button Row - Dynamic Layout */}
                    <div className={`gap-1 p-2.5 ${
                      rubric.levels.length <= 3 ? 'flex' : 
                      rubric.levels.length <= 5 ? 'flex' :
                      rubric.levels.length === 6 ? 'grid grid-cols-6' :
                      rubric.levels.length === 8 ? 'grid grid-cols-8' :
                      rubric.levels.length === 10 ? 'grid grid-cols-10' :
                      rubric.levels.length === 11 ? 'grid grid-cols-11' :
                      'flex flex-wrap'
                    }`}>
                      {rubric.levels.map(level => {
                        const isSelected = selectedLevel === level.score;
                        const colorClass = getScoreColor(level.score, maxLevel);

                        return (
                          <button
                            key={level.score}
                            type="button"
                            disabled={blocked}
                            onClick={(e) => {
                              e.stopPropagation();
                              setComponentLevel(activeStudent, rubric.rubric_id, level.score);
                              setFocusedRubric(rubric.rubric_id);
                            }}
                            className={`
                              flex-1 px-1 py-2 rounded-md border-2 transition-all text-center min-w-0
                              ${isSelected 
                                ? `${colorClass} text-white font-bold border-gray-900 shadow-md` 
                                : 'bg-white border-gray-300 text-gray-700 hover:border-blue-500'
                              }
                              ${blocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                            `}
                          >
                            <div className="text-base font-bold">{level.score}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              </div>
              </div>
              
              {/* Marking Criteria - Below Components */}
              <div className="border-t-4 border-blue-600 bg-white shadow-md flex-shrink-0">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-1.5 border-b-2 border-blue-800">
                  <h2 className="text-white text-[10px] font-bold uppercase tracking-wide flex items-center gap-2">
                    <span>📋</span>
                    <span>Marking Criteria</span>
                    {focusedRubric && (
                      <span className="text-blue-200">- {mockRubrics.find(r => r.rubric_id === focusedRubric)?.component_name}</span>
                    )}
                  </h2>
                </div>
                
                {focusedRubric ? (() => {
                  const rubric = mockRubrics.find(r => r.rubric_id === focusedRubric);
                  if (!rubric) return null;
                  const selectedLevel = marks[activeStudent]?.[rubric.rubric_id];
                  
                  return (
                    <div className="p-2 max-h-36 overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50">
                      {/* Component Description */}
                      {rubric.component_description && (
                        <div className="bg-blue-100 rounded-md px-2.5 py-1.5 mb-1.5 border border-blue-300">
                          <p className="text-[9px] text-blue-900 leading-tight font-medium">
                            {rubric.component_description}
                          </p>
                        </div>
                      )}
                      
                      {/* Level Descriptions - Dynamic Grid */}
                      <div className={`grid gap-1 ${
                        rubric.levels.length === 3 ? 'grid-cols-3' :
                        rubric.levels.length === 5 ? 'grid-cols-5' :
                        rubric.levels.length === 6 ? 'grid-cols-6' :
                        rubric.levels.length === 8 ? 'grid-cols-8' :
                        rubric.levels.length === 10 ? 'grid-cols-10' :
                        rubric.levels.length === 11 ? 'grid grid-cols-11' :
                        'grid-cols-5'
                      }`}>
                        {rubric.levels.map(level => {
                          const isSelected = selectedLevel === level.score;
                          return (
                            <div 
                              key={level.score}
                              className={`p-2 rounded-lg border-2 transition-all ${
                                isSelected 
                                  ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-600 shadow-lg ring-2 ring-green-400' 
                                  : 'bg-white border-gray-300 hover:border-blue-400 hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-center justify-center mb-0.5">
                                <span className={`px-1.5 py-0.5 rounded text-sm font-bold ${
                                  isSelected ? 'bg-green-600 text-white' : 'bg-gray-500 text-white'
                                }`}>
                                  {level.score}
                                </span>
                              </div>
                              <div className={`text-[8px] font-bold uppercase text-center truncate mb-0.5 ${
                                isSelected ? 'text-green-900' : 'text-gray-700'
                              }`}>
                                {level.label}
                              </div>
                              {level.description && (
                                <p className={`text-[7px] leading-tight text-center ${
                                  isSelected ? 'text-gray-900 font-medium' : 'text-gray-600'
                                }`}>
                                  {level.description}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })() : (
                  <div className="p-2 text-center bg-gradient-to-br from-gray-50 to-blue-50">
                    <div className="text-xl mb-0.5">👆</div>
                    <p className="text-[8px] text-gray-700 font-bold">
                      Click a Component
                    </p>
                    <p className="text-[8px] text-gray-500">
                      to view marking criteria
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Prominent Student Switcher + Controls */}
            <div className="w-[300px] flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-600 overflow-y-auto">
              {/* Prominent Student Switcher Section */}
              <div className="p-1.5 bg-gradient-to-r from-blue-600 to-blue-700 border-b-2 border-blue-800 flex-shrink-0">
                <h2 className="text-white text-[9px] font-bold uppercase tracking-wide mb-1">
                  👥 Students
                </h2>
                <div className="space-y-1">
                  {team.students.map(student => {
                    const isActive = activeStudent === student.student_id;
                    const m = meta[student.student_id] || DEFAULT_META;
                    const isComplete = m.pat || m.attendance === 'absent' || mockRubrics.every(r => marks[student.student_id]?.[r.rubric_id] !== undefined);
                    const total = studentGrandTotal(student.student_id);
                    
                    return (
                      <button
                        key={student.student_id}
                        onClick={() => setActiveStudent(student.student_id)}
                        className={`
                          w-full p-1.5 rounded text-left transition-all
                          ${
                            isActive 
                              ? 'bg-white shadow-md border-2 border-blue-400' 
                              : 'bg-white/70 hover:bg-white border border-transparent hover:border-blue-300'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-0.5">
                              <div className={`text-[10px] font-bold truncate ${
                                isActive ? 'text-blue-900' : 'text-gray-800'
                              }`}>
                                {student.student_name}
                              </div>
                              {m.attendance === 'absent' && (
                                <span className="px-1 py-0.5 rounded-full text-[7px] font-bold bg-red-500 text-white uppercase flex-shrink-0">
                                  A
                                </span>
                              )}
                              {m.pat && (
                                <span className="px-1 py-0.5 rounded-full text-[7px] font-bold bg-green-500 text-white uppercase flex-shrink-0">
                                  P
                                </span>
                              )}
                            </div>
                            <div className={`text-[8px] leading-tight ${
                              isActive ? 'text-blue-600' : 'text-gray-500'
                            }`}>
                              {student.roll_number}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <div className={`text-sm font-bold ${
                              isActive ? 'text-blue-600' : 'text-gray-700'
                            }`}>
                              {Math.round(total)}
                            </div>
                            {isComplete && (
                              <CheckCircleIcon className={`w-3.5 h-3.5 ${
                                isActive ? 'text-green-600' : 'text-green-500'
                              }`} />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Student Controls Section */}
              <div className="flex-shrink-0 bg-white border-t-2 border-gray-200">
                <div className="p-1.5 space-y-1.5">
                  {/* PPT Approval */}
                  <label className="flex items-center gap-1 cursor-pointer bg-green-500 rounded px-2 py-1 hover:bg-green-600 transition-all">
                    <PresentationChartBarIcon className="w-3.5 h-3.5 text-white" />
                    <input
                      type="checkbox"
                      checked={teamMeta.pptApproved}
                      onChange={e => {
                        setTeamMeta(prev => ({ ...prev, pptApproved: e.target.checked }));
                        setHasChanges(true);
                      }}
                      className="w-3 h-3 rounded"
                    />
                    <span className="text-[9px] font-bold text-white uppercase flex-1">PPT</span>
                  </label>
                  
                  {/* Attendance & PAT */}
                  <div className="flex gap-1.5">
                    {/* Attendance */}
                    <div className="flex-1">
                      <label className="text-[8px] font-bold text-gray-700 uppercase block mb-0.5">Attend</label>
                      <div className="flex gap-0.5">
                        {['present', 'absent'].map(v => (
                          <label key={v} className="flex-1 cursor-pointer">
                            <input
                              type="radio"
                              name={`att-${activeStudent}`}
                              checked={currentMeta.attendance === v}
                              onChange={() => updateMeta(activeStudent, { attendance: v, pat: v === 'absent' ? false : currentMeta.pat })}
                              className="sr-only"
                            />
                            <div className={`
                              px-1.5 py-1 rounded text-center text-[8px] font-bold uppercase transition-all
                              ${currentMeta.attendance === v
                                ? v === 'present' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                : 'bg-white text-gray-600 border border-gray-300'
                              }
                            `}>
                              {v === 'present' ? 'P' : 'A'}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    {/* PAT */}
                    <div className="flex-1">
                      <label className="text-[8px] font-bold text-gray-700 uppercase block mb-0.5">PAT</label>
                      <label className="flex items-center gap-1 cursor-pointer bg-white border border-blue-300 rounded px-1.5 py-1 hover:bg-blue-50 transition-all">
                        <input
                          type="checkbox"
                          checked={currentMeta.pat}
                          onChange={e => updateMeta(activeStudent, { pat: e.target.checked, attendance: e.target.checked ? 'present' : currentMeta.attendance })}
                          className="w-3 h-3 text-blue-600 rounded"
                        />
                        <span className="text-[8px] font-bold text-gray-900 uppercase">PAT</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Comment Section - Compact */}
              <div className="p-1.5 bg-yellow-50 border-t-2 border-yellow-400 flex-shrink-0">
                <div className="flex items-center gap-1 mb-1">
                  <DocumentTextIcon className="w-3.5 h-3.5 text-yellow-700" />
                  <h3 className="text-[9px] font-bold text-yellow-900 uppercase">Feedback</h3>
                  <span className="text-red-600 text-[10px] font-bold">*</span>
                  <span className={`ml-auto text-[8px] font-semibold ${teamMeta.teamComment.trim().length < 10 ? 'text-red-600' : 'text-green-600'}`}>
                    {teamMeta.teamComment.trim().length < 10 ? `+${10 - teamMeta.teamComment.trim().length}` : `✓`}
                  </span>
                </div>
                
                <textarea
                  value={teamMeta.teamComment}
                  onChange={e => {
                    setTeamMeta(prev => ({ ...prev, teamComment: e.target.value }));
                    setHasChanges(true);
                  }}
                  className={`
                    w-full h-12 border rounded px-1.5 py-1 text-[9px] resize-none leading-tight
                    focus:ring-1 focus:ring-yellow-300 focus:border-yellow-500 transition-all
                    ${teamMeta.teamComment.trim().length < 10
                      ? 'border-red-400 bg-white'
                      : 'border-green-400 bg-white'
                    }
                  `}
                  placeholder="Team feedback (min 10 chars)..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white border-t-2 border-gray-300 flex-shrink-0">
            <div className="flex justify-between items-center gap-2 px-3 py-2">
              {/* Single-line error display */}
              {showValidationErrors && validationResult.errors.length > 0 && (
                <div className="flex items-center gap-1.5 flex-1">
                  <XCircleIcon className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span className="text-[10px] text-red-700 font-semibold truncate">
                    {validationResult.errors[0]} {validationResult.errors.length > 1 && `(+${validationResult.errors.length - 1})`}
                  </span>
                </div>
              )}
              
              {/* Submit Buttons */}
              <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={handleClose}>Cancel</Button>
              <Button
                size="sm"
                variant="primary"
                disabled={saving}
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

      {/* Criteria Details Modal */}
      {criteriaModalOpen && selectedCriteria && (
        <Modal
          isOpen={criteriaModalOpen}
          onClose={() => setCriteriaModalOpen(false)}
          title={selectedCriteria.component_name}
          size="lg"
        >
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Description</h4>
              <p className="text-sm text-gray-600">{selectedCriteria.component_description || 'No description available'}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Marking Levels</h4>
              <div className="space-y-2">
                {selectedCriteria.levels.map(level => (
                  <div key={level.score} className="flex gap-3 p-2 bg-gray-50 rounded border border-gray-200">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded bg-blue-600 text-white flex flex-col items-center justify-center">
                        <div className="text-lg font-bold">{level.score}</div>
                        <div className="text-[8px] uppercase">{level.label}</div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h5 className="text-xs font-semibold text-gray-800 mb-0.5">{level.label}</h5>
                      <p className="text-xs text-gray-600">{level.description || 'No description'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Maximum Marks:</span>
                <span className="text-xl font-bold text-blue-600">{selectedCriteria.max_marks}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal for Unsaved Changes */}
      {showCloseConfirm && (
        <Modal
          isOpen={showCloseConfirm}
          onClose={cancelClose}
          title="Unsaved Changes"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <XCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm text-gray-800 font-semibold mb-2">
                  You have unsaved changes that will be lost if you close now.
                </p>
                <p className="text-sm text-gray-600">
                  Are you sure you want to close without saving?
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button size="sm" variant="secondary" onClick={cancelClose}>
                Cancel
              </Button>
              <Button size="sm" variant="danger" onClick={confirmClose}>
                Close Without Saving
              </Button>
            </div>
          </div>
        </Modal>
      )}

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
