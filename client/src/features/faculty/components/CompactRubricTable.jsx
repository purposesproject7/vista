// src/features/faculty/components/CompactRubricTable.jsx - REPLACE ENTIRE FILE
import React, { useState } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

const CompactRubricTable = ({
  students,
  rubrics,
  marks,
  errors,
  onMarkChange,
  getStudentTotal,
}) => {
  const [expandedStudent, setExpandedStudent] = useState(
    students[0]?.id || null
  );

  // Calculate actual mark based on max marks
  const getActualMark = (score, maxMarks) => {
    return ((score / 5) * maxMarks).toFixed(2);
  };

  return (
    <div
      className="p-4 bg-gradient-to-br from-blue-50 to-gray-50 space-y-4"
      data-tutorial="rubric-table"
    >
      {students.map((student, studentIdx) => {
        const isExpanded = expandedStudent === student.id;
        const studentTotal = getStudentTotal(student.id);
        const allMarksEntered = rubrics.every((r) => marks[student.id]?.[r.id]);

        return (
          <div
            key={student.id}
            className="bg-white rounded-xl shadow-lg border-2 border-blue-200 overflow-hidden"
            data-tutorial="individual-marks"
          >
            {/* Student Header - Always Visible */}
            <div
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-all"
              onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white text-blue-700 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                    {studentIdx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{student.name}</h3>
                    <p className="text-sm text-blue-100">
                      {student.rollNumber}
                    </p>
                  </div>
                  {allMarksEntered && (
                    <div className="ml-4 flex items-center gap-2 bg-green-500 px-3 py-1 rounded-full">
                      <CheckCircleIcon className="w-4 h-4" />
                      <span className="text-xs font-semibold">Complete</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-blue-100">Total Marks</div>
                    <div className="text-3xl font-bold">
                      {studentTotal.toFixed(2)}
                    </div>
                  </div>
                  <button className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
                    {isExpanded ? (
                      <ChevronUpIcon className="w-6 h-6" />
                    ) : (
                      <ChevronDownIcon className="w-6 h-6" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Student Rubrics - Expandable */}
            {isExpanded && (
              <div className="p-4 space-y-4 bg-gray-50">
                {rubrics.map((rubric, rubricIdx) => {
                  const errorKey = `${student.id}-${rubric.id}`;
                  const currentValue = parseFloat(
                    marks[student.id]?.[rubric.id]
                  );
                  const selectedLevel = rubric.levels?.find(
                    (l) => l.score === currentValue
                  );

                  return (
                    <div
                      key={rubric.id}
                      className="bg-white rounded-lg shadow-sm border-2 border-gray-200 overflow-hidden hover:border-blue-300 transition-all"
                    >
                      {/* Rubric Header */}
                      <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 border-b-2 border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="bg-blue-600 text-white font-bold text-sm px-3 py-1 rounded-full">
                            {rubricIdx + 1}
                          </span>
                          <h4 className="font-bold text-gray-900 text-base">
                            {rubric.component}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 font-semibold">
                            Max:
                          </span>
                          <span className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg text-sm">
                            {rubric.maxMarks}
                          </span>
                        </div>
                      </div>

                      {/* Score Selection Grid */}
                      <div className="p-4">
                        <div className="grid grid-cols-1 gap-3">
                          {rubric.levels?.map((level) => {
                            const isSelected = currentValue === level.score;
                            const actualMark = getActualMark(
                              level.score,
                              rubric.maxMarks
                            );

                            return (
                              <button
                                key={level.score}
                                type="button"
                                onClick={() =>
                                  onMarkChange(
                                    student.id,
                                    rubric.id,
                                    level.score.toString()
                                  )
                                }
                                className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                                  isSelected
                                    ? "bg-blue-50 border-blue-500 shadow-md ring-2 ring-blue-300"
                                    : "bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-400"
                                }`}
                              >
                                {/* Score Badge */}
                                <div className="flex flex-col items-center gap-1 shrink-0">
                                  <div
                                    className={`w-20 h-20 rounded-xl flex flex-col items-center justify-center font-bold border-2 ${
                                      isSelected
                                        ? "bg-blue-600 text-white border-blue-700 shadow-lg"
                                        : "bg-gray-100 text-gray-700 border-gray-300"
                                    }`}
                                  >
                                    <div className="text-3xl">{actualMark}</div>
                                    <div className="text-xs opacity-75 font-semibold">
                                      {level.label}
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                                  )}
                                </div>

                                {/* Description */}
                                <div className="flex-1 pt-2">
                                  <div
                                    className={`font-bold mb-2 text-base ${
                                      isSelected
                                        ? "text-blue-700"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {level.score} – {level.label}
                                  </div>
                                  <div
                                    className={`text-sm leading-relaxed ${
                                      isSelected
                                        ? "text-gray-800"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {level.description}
                                  </div>
                                </div>

                                {/* Checkmark */}
                                {isSelected && (
                                  <div className="shrink-0">
                                    <div className="bg-green-500 text-white rounded-full p-2">
                                      <CheckCircleIcon className="w-8 h-8" />
                                    </div>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {errors[errorKey] && (
                          <p className="text-red-600 text-sm mt-3 font-semibold bg-red-50 border-2 border-red-300 rounded-lg p-3">
                            ⚠ {errors[errorKey]}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Tip */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong className="text-blue-700">💡 Quick Tip:</strong> Click on a
          student card to expand and enter marks. Select the appropriate score
          level for each rubric component.
        </p>
      </div>
    </div>
  );
};

export default CompactRubricTable;
