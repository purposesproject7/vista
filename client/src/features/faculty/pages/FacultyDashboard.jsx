import React, { useState, useEffect } from 'react';
import Navbar from '../../../shared/components/Navbar';
import { useFacultyReviews } from '../hooks/useFacultyReviews';
import ActiveReviewsSection from '../components/ActiveReviewsSection';
import DeadlinePassedSection from '../components/DeadlinePassedSection';
import PastReviewsSection from '../components/PastReviewsSection';
import MarkEntryModal from '../components/MarkEntryModal';
import FacultyAcademicContextSelector from '../components/FacultyAcademicContextSelector';
import Button from '../../../shared/components/Button';
import { CalendarIcon, AcademicCapIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../../shared/hooks/useAuth';
import PPTApprovalSection from '../components/PPTApprovalSection';


const FacultyDashboard = () => {
    const { user: authUser } = useAuth();

    // Filter State
    const [filters, setFilters] = useState({ year: '', school: '', program: '', role: 'guide' });
    const [filterOptions, setFilterOptions] = useState({
        years: [],
        schools: [],
        programs: [],
        roles: ['guide', 'panel']
    });

    const {
        active,
        deadlinePassed,
        past,
        panelAssignments,
        loading,
        error,
        refreshReviews
    } = useFacultyReviews(authUser?._id || authUser?.employeeId || 'FAC_001', filters);
    const [loadingFilters, setLoadingFilters] = useState(true);

    // Initial Data Fetch
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                // Fetch Master Data
                const api = (await import('../../../services/api')).default;
                const response = await api.get('/faculty/master-data');
                const data = response.data.data;

                // Process Master Data
                // Process Master Data
                const years = data.academicYears.filter(y => y.isActive).map(y => y.year);
                const schools = data.schools.filter(s => s.isActive).map(s => s.code);
                const allPrograms = data.programs.filter(p => p.isActive).map(p => ({
                    name: p.name,
                    code: p.code,
                    school: p.school
                }));

                const initialSchool = schools[0] || '';
                const initialPrograms = allPrograms.filter(p => p.school === initialSchool);

                setFilterOptions({
                    years,
                    schools,
                    programs: initialPrograms,
                    allPrograms,
                    roles: ['guide', 'panel']
                });

                // Set defaults if available
                setFilters(prev => ({
                    ...prev,
                    year: years.find(y => y === '2024-2025') || years[0] || '',
                    school: initialSchool,
                    program: 'All Programs',
                    role: 'guide'
                }));
            } catch (err) {
                console.error("Failed to load filter options", err);
            } finally {
                setLoadingFilters(false);
            }
        };

        fetchFilters();
    }, []);

    // Update programs when school changes
    useEffect(() => {
        if (filterOptions.allPrograms) {
            const relevantPrograms = filterOptions.allPrograms.filter(p => p.school === filters.school);
            setFilterOptions(prev => ({
                ...prev,
                programs: relevantPrograms
            }));

            // Reset program selection if current selection is invalid for new school
            // But let's keep "All Programs" or reset to "All Programs" for simplicity
            setFilters(prev => ({ ...prev, program: 'All Programs' }));
        }
    }, [filters.school, filterOptions.allPrograms]);

    // Marking Workflow State
    const [isMarkingOpen, setIsMarkingOpen] = useState(false);
    const [currentReview, setCurrentReview] = useState(null);
    const [currentTeam, setCurrentTeam] = useState(null);

    const handleEnterMarks = (review, team) => {
        setCurrentReview(review);
        setCurrentTeam(team);
        setIsMarkingOpen(true);
    };

    const handleMarkingSuccess = (data) => {
        console.log('Marking saved:', data);
        refreshReviews();
        setIsMarkingOpen(false);
    };

    // --- DASHBOARD VIEW ---
    if (loading || loadingFilters) return <div className="flex h-screen items-center justify-center p-8 text-slate-500">Loading Dashboard...</div>;
    if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">

            {/* 1. NAVBAR (Standard) */}
            <div className="shrink-0 z-30">
                <Navbar />
            </div>

            {/* 2. SCROLLABLE CONTENT AREA */}
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 pb-32">

                <div className="container mx-auto max-w-7xl">
                    <div className="flex flex-col md:flex-row gap-6 mb-8 items-stretch">
                        <FacultyAcademicContextSelector
                            className="flex-1"
                            currentFilters={filters}
                            onFilterChange={(newFilters) => setFilters(newFilters)}
                            lockedSchool={authUser?.school || 'SCOPE'} // Lock to user school
                        />

                        {/* Role Selector Card */}
                        <div className="w-full md:w-64 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Viewing Mode</label>
                            <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1">
                                <button
                                    onClick={() => setFilters(f => ({ ...f, role: 'guide' }))}
                                    className={`flex-1 py-2 text-xs font-black uppercase tracking-tight rounded-lg transition-all ${filters.role === 'guide' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Guide
                                </button>
                                <button
                                    onClick={() => setFilters(f => ({ ...f, role: 'panel' }))}
                                    className={`flex-1 py-2 text-xs font-black uppercase tracking-tight rounded-lg transition-all ${filters.role === 'panel' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Panel
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-3 leading-tight italic">
                                {filters.role === 'guide' ? 'Evaluating as Project Supervisor.' : 'Evaluating as Review Panel Member.'}
                            </p>
                        </div>
                    </div>



                    {/* NEW: PPT Approval Section */}
                    {filters.role === 'guide' && (
                        <PPTApprovalSection
                            reviews={active}
                            onRefresh={refreshReviews}
                        />
                    )}

                    {/* Active Reviews (Always Open) */}
                    <section className="animate-slideUp">
                        <ActiveReviewsSection
                            reviews={active}
                            onEnterMarks={(review, team) => handleEnterMarks(review, team)}
                        />
                    </section>

                    {/* NEW: Panel Assignments Section (Direct list of projects)
                    {filters.role === 'panel' && (
                        <section className="animate-slideUp mt-10">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <div className="bg-emerald-100 p-1.5 rounded-lg">
                                        <UserGroupIcon className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    My Panel Assignments
                                </h2>
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider rounded-full border border-emerald-100">
                                    {panelAssignments?.length || 0} teams
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {panelAssignments?.map((project) => (
                                    <div key={project._id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="bg-slate-50 p-2 rounded-xl group-hover:bg-emerald-50 transition-colors">
                                                <UserGroupIcon className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-tighter text-slate-300"># PANEL</span>
                                        </div>

                                        <h3 className="text-base font-bold text-slate-800 mb-1 truncate">{project.name}</h3>
                                        <p className="text-xs text-slate-500 line-clamp-2 mb-4 h-8">{project.description || 'No description available for this project.'}</p>

                                        <div className="grid grid-cols-2 gap-2 mb-5">
                                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-50">
                                                <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Students</p>
                                                <p className="text-xs font-bold text-slate-700">{project.students?.length || 0} Members</p>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-50">
                                                <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Batch</p>
                                                <p className="text-xs font-bold text-slate-700">{project.academicYear}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleEnterMarks({ id: 'GENERAL', displayName: 'Panel Review', reviews: [] }, project)}
                                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                                        >
                                            Enter Marks
                                        </button>
                                    </div>
                                ))}

                                {panelAssignments?.length === 0 && (
                                    <div className="col-span-full py-12 bg-white rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                                        <UserGroupIcon className="w-12 h-12 text-slate-100 mb-3" />
                                        <p className="text-slate-400 text-sm font-medium italic">No panel assignments found for this academic session.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )} */}

                    {/* Collapsible Sections */}
                    <section className="space-y-6 mt-8 animate-slideUp delay-100">
                        <DeadlinePassedSection
                            reviews={deadlinePassed}
                            onEnterMarks={handleEnterMarks}
                        />

                        <PastReviewsSection
                            reviews={past}
                            onEnterMarks={handleEnterMarks}
                        />
                    </section>
                </div>

            </div>

            {/* MARKING MODAL */}
            {isMarkingOpen && (
                <MarkEntryModal
                    isOpen={isMarkingOpen}
                    onClose={() => setIsMarkingOpen(false)}
                    review={currentReview}
                    team={currentTeam}
                    onSuccess={handleMarkingSuccess}
                />
            )}

        </div>
    );
};

export default FacultyDashboard;
