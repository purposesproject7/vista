import React, { useState, useEffect } from 'react';
import Navbar from '../../../shared/components/Navbar';
import { useFacultyReviews } from '../hooks/useFacultyReviews';
import ActiveReviewsSection from '../components/ActiveReviewsSection';
import DeadlinePassedSection from '../components/DeadlinePassedSection';
import PastReviewsSection from '../components/PastReviewsSection';
import MarkEntryModal from '../components/MarkEntryModal';
import Button from '../../../shared/components/Button';
import { FunnelIcon, CalendarIcon, AcademicCapIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { MOCK_MASTER_DATA } from '../../../shared/utils/mockData';

const FacultyDashboard = () => {
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
        loading,
        error,
        refreshReviews
    } = useFacultyReviews('FAC_001', filters);
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
                const years = data.academicYears.filter(y => y.isActive).map(y => y.year);
                const schools = data.schools.filter(s => s.isActive).map(s => s.code);
                const programs = data.programs.filter(p => p.isActive).map(p => p.name);

                setFilterOptions({ years, schools, programs, roles: ['guide', 'panel'] });

                // Set defaults if available
                setFilters(prev => ({
                    ...prev,
                    year: years.find(y => y === '2024-2025') || years[0] || '',
                    school: schools[0] || '',
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

    // Workflow State
    const [isInitialized, setIsInitialized] = useState(false);

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

    // --- SETUP VIEW ---
    if (!isInitialized) {
        return (
            <div className="flex flex-col h-screen bg-slate-50 font-sans">
                {/* Show Navbar, but empty center */}
                <div className="shrink-0 z-30">
                    <Navbar />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-6 -mt-16">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center animate-slideUp">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
                            <FunnelIcon className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome, Professor</h1>
                        <p className="text-slate-500 mb-8">Please select your dashboard parameters to begin.</p>

                        <div className="space-y-4 text-left">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Academic Year</label>
                                <select
                                    value={filters.year}
                                    onChange={e => setFilters(f => ({ ...f, year: e.target.value }))}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                                >
                                    {filterOptions.years.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">School</label>
                                <select
                                    value={filters.school}
                                    onChange={e => setFilters(f => ({ ...f, school: e.target.value }))}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                                >
                                    {filterOptions.schools.map(school => (
                                        <option key={school} value={school}>{school}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Program</label>
                                <select
                                    value={filters.program}
                                    onChange={e => setFilters(f => ({ ...f, program: e.target.value }))}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                                >
                                    <option>All Programs</option>
                                    {filterOptions.programs.map(program => (
                                        <option key={program} value={program}>{program}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
                                <select
                                    value={filters.role}
                                    onChange={e => setFilters(f => ({ ...f, role: e.target.value }))}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700 uppercase"
                                >
                                    <option value="guide">GUIDE</option>
                                    <option value="panel">PANEL</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsInitialized(true)}
                            className="w-full mt-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-200 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                        >
                            Load Dashboard <ArrowRightIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- DASHBOARD VIEW (Normal) ---

    // Define Filter Content (Body Mode)
    const FilterBar = (
        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 animate-slideUp">
            <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wide text-xs">
                <FunnelIcon className="w-4 h-4" /> Filters
            </div>

            <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>

            {/* Year Filter */}
            <div className="flex flex-col gap-1 min-w-[140px]">
                <label className="text-[10px] uppercase font-bold text-slate-400">Academic Year</label>
                <select
                    value={filters.year}
                    onChange={e => setFilters(f => ({ ...f, year: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 transition-colors"
                >
                    {filterOptions.years.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>

            {/* School Filter */}
            <div className="flex flex-col gap-1 min-w-[140px]">
                <label className="text-[10px] uppercase font-bold text-slate-400">School</label>
                <select
                    value={filters.school}
                    onChange={e => setFilters(f => ({ ...f, school: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 transition-colors"
                >
                    {filterOptions.schools.map(school => (
                        <option key={school} value={school}>{school}</option>
                    ))}
                </select>
            </div>

            {/* Program Filter */}
            <div className="flex flex-col gap-1 min-w-[180px]">
                <label className="text-[10px] uppercase font-bold text-slate-400">Program</label>
                <select
                    value={filters.program}
                    onChange={e => setFilters(f => ({ ...f, program: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-sm font-bold text-blue-600 outline-none focus:border-blue-500 transition-colors"
                >
                    <option>All Programs</option>
                    {filterOptions.programs.map(program => (
                        <option key={program} value={program}>{program}</option>
                    ))}
                </select>
            </div>

            <div className="flex-1"></div>

            {/* Role Filter */}
            <div className="flex flex-col gap-1 min-w-[120px]">
                <label className="text-[10px] uppercase font-bold text-slate-400">Your Role</label>
                <div className="relative">
                    <select
                        value={filters.role}
                        onChange={e => setFilters(f => ({ ...f, role: e.target.value }))}
                        className="w-full bg-slate-800 text-white border border-slate-800 rounded-lg py-1.5 px-2 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-slate-500 transition-colors appearance-none"
                    >
                        <option value="guide">Guide</option>
                        <option value="panel">Panel</option>
                    </select>
                </div>
            </div>
        </div>
    );

    if (loading) return <div className="flex h-screen items-center justify-center p-8 text-slate-500">Loading Dashboard...</div>;
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
                    {/* FILTERS (In Body) */}
                    {FilterBar}

                    {/* Active Reviews (Always Open) */}
                    <section className="animate-slideUp">
                        <ActiveReviewsSection
                            reviews={active}
                            onEnterMarks={(review, team) => handleEnterMarks(review, team)}
                        />
                    </section>

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
