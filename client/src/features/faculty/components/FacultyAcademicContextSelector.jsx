import React, { useState, useEffect } from "react";
import Select from "../../../shared/components/Select";
import Card from "../../../shared/components/Card";
import { AcademicCapIcon, CheckCircleIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { getMasterData } from "../services/facultyApi";

const FacultyAcademicContextSelector = ({ currentFilters, onFilterChange, className = "", lockedSchool = null }) => {
    const [loading, setLoading] = useState(false);
    const [masterData, setMasterData] = useState({
        schools: [],
        programs: [],
        years: [],
    });
    const [options, setOptions] = useState({
        schools: [],
        programs: [],
        years: [],
    });

    // Fetch real metadata on mount
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                setLoading(true);

                const response = await getMasterData();

                if (response.success) {
                    const data = response.data;

                    // Extract and filter active items
                    const activeSchools = (data.schools || []).filter(s => s.isActive);
                    const activePrograms = (data.programs || []).filter(p => p.isActive);
                    const activeYears = (data.academicYears || [])
                        .filter(y => y.isActive)
                        .map(y => y.year);

                    // Sort years in descending order (newest first)
                    const sortedYears = activeYears.sort().reverse();

                    setMasterData({
                        schools: activeSchools,
                        programs: activePrograms,
                        years: sortedYears,
                    });

                    setOptions(prev => ({
                        ...prev,
                        schools: activeSchools.map(s => ({ value: s.code, label: s.name })),
                        years: sortedYears.map(y => ({ value: y, label: y })),
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch evaluation metadata:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMetadata();
    }, []);

    // Enforce Locked School
    useEffect(() => {
        if (lockedSchool && currentFilters.school !== lockedSchool) {
            // Force update if not already set, but be careful not to trigger infinite loops
            // Only update if it's different and we have assurance it's a valid school (optional check)
            onFilterChange({ ...currentFilters, school: lockedSchool, program: "All Programs" });
        }
    }, [lockedSchool, currentFilters.school]);

    // Sync programs when school changes
    useEffect(() => {
        const activeSchool = lockedSchool || currentFilters.school;

        if (activeSchool && masterData.programs) {
            const programs = masterData.programs
                ?.filter(p => p.school === activeSchool)
                ?.map(p => ({
                    value: p.code,
                    label: p.name,
                })) || [];

            setOptions(prev => ({ ...prev, programs }));
        } else {
            setOptions(prev => ({ ...prev, programs: [] }));
        }
    }, [currentFilters.school, lockedSchool, masterData.programs]);

    const steps = [
        { key: "school", label: "School", options: options.schools, enabled: !lockedSchool, locked: !!lockedSchool },
        { key: "program", label: "Program", options: options.programs, enabled: !!(lockedSchool || currentFilters.school) },
        { key: "year", label: "Academic Year", options: options.years, enabled: !!(lockedSchool || currentFilters.school) && !!currentFilters.program },
    ];

    const completedSteps = steps.filter(step => step.locked || (currentFilters[step.key] && currentFilters[step.key] !== "All Programs")).length;
    const isComplete = completedSteps === 3;

    const handleChange = (key, value) => {
        if (key === "school") {
            onFilterChange({ ...currentFilters, school: value, program: "All Programs" });
        } else {
            onFilterChange({ ...currentFilters, [key]: value });
        }
    };

    return (
        <Card className={`bg-white border-slate-200 shadow-sm ${className}`}>
            <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2 flex-1">
                    <div className="bg-indigo-50 p-1.5 rounded-lg">
                        <AcademicCapIcon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-800">
                        Evaluation Context
                    </h2>
                    <div className="flex-1 mx-4 max-w-xs">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 transition-all duration-700 ease-out"
                                style={{ width: `${(completedSteps / 3) * 100}%` }}
                            />
                        </div>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        Step {completedSteps}/3
                    </span>
                </div>

                {isComplete && (
                    <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 animate-in fade-in zoom-in duration-300">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                        <span className="text-[10px] font-bold text-emerald-700 uppercase">
                            Ready
                        </span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {steps.map((step) => (
                    <div key={step.key} className={`space-y-1.5 ${!step.enabled && !step.locked ? "opacity-50" : ""}`}>
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                                {step.label}
                            </label>
                            {step.locked && <LockClosedIcon className="w-3 h-3 text-slate-400" />}
                        </div>
                        <div className="relative">
                            <select
                                value={step.locked ? lockedSchool : currentFilters[step.key]}
                                onChange={(e) => handleChange(step.key, e.target.value)}
                                disabled={!step.enabled || step.locked}
                                className={`
                                    w-full border rounded-xl py-2 px-3 text-sm font-bold outline-none transition-all appearance-none
                                    ${step.locked
                                        ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed"
                                        : "bg-slate-50 border-slate-200 text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                                    }
                                    ${(!step.enabled && !step.locked) ? "cursor-not-allowed" : ""}
                                `}
                            >
                                <option value="">Select {step.label}</option>
                                {step.options.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                {step.locked ? (
                                    <LockClosedIcon className="w-4 h-4" />
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default FacultyAcademicContextSelector;
