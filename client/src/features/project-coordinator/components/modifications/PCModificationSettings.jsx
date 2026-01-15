// src/features/project-coordinator/components/modifications/PCModificationSettings.jsx
// PC version of ModificationSettings - uses PC context and APIs
import React, { useState, useEffect, useMemo } from 'react';
import Card from '../../../../shared/components/Card';
import Button from '../../../../shared/components/Button';
import Select from '../../../../shared/components/Select';
import LoadingSpinner from '../../../../shared/components/LoadingSpinner';
import Badge from '../../../../shared/components/Badge';
import Modal from '../../../../shared/components/Modal';
import {
    MagnifyingGlassIcon,
    UserGroupIcon,
    CheckCircleIcon,
    ArrowRightIcon,
    ExclamationTriangleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import {
    getFacultyList,
    getProjectList,
    getPanelList,
    getMarkingSchema,
    batchReassignGuide,
    batchReassignPanel
} from '../../services/coordinatorModificationsApi';

const PCModificationSettings = ({ filters }) => {
    // Faculty selection state
    const [facultyList, setFacultyList] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState(null);
    const [facultySearch, setFacultySearch] = useState('');

    // Projects state
    const [allProjects, setAllProjects] = useState([]);
    const [guideProjects, setGuideProjects] = useState([]);
    const [panelProjects, setPanelProjects] = useState([]);
    const [selectedProjects, setSelectedProjects] = useState([]);

    // Panels state
    const [availablePanels, setAvailablePanels] = useState([]);

    // Reassignment state
    const [reassignMode, setReassignMode] = useState(null); // 'guide' | 'panel'
    const [targetFaculty, setTargetFaculty] = useState(null);
    const [targetPanel, setTargetPanel] = useState(null);
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [reassignReason, setReassignReason] = useState('');

    // Available reviews for scoped panel assignment
    const [availableReviews, setAvailableReviews] = useState([]);

    // Enhanced Reassignment State
    const [panelAssignType, setPanelAssignType] = useState('existing'); // 'existing' | 'faculty'
    const [panelAssignmentScope, setPanelAssignmentScope] = useState('main'); // 'main' | 'review'
    const [selectedReviewType, setSelectedReviewType] = useState('');
    const [ignoreSpecialization, setIgnoreSpecialization] = useState(false);

    // Loading states
    const [loading, setLoading] = useState({
        faculty: false,
        projects: false,
        reassigning: false
    });

    const [message, setMessage] = useState({ type: '', text: '' });

    // Use filters from parent
    const academicContext = {
        year: filters?.year || '2024-25',
        school: filters?.school || '',
        program: filters?.program || ''
    };

    const isContextComplete = academicContext.school && academicContext.program && academicContext.year;

    // Fetch data when context is complete
    useEffect(() => {
        if (isContextComplete) {
            fetchAllData();
        }
    }, [academicContext.year, academicContext.school, academicContext.program]);

    const fetchAllData = async () => {
        setLoading(prev => ({ ...prev, faculty: true, projects: true }));
        try {
            await Promise.all([
                fetchFacultyList(),
                fetchProjects(),
                fetchPanels(),
                fetchReviews()
            ]);
        } finally {
            setLoading(prev => ({ ...prev, faculty: false, projects: false }));
        }
    };

    const fetchFacultyList = async () => {
        try {
            const response = await getFacultyList(academicContext.school, academicContext.program);
            const faculty = response?.data || [];

            // Calculate project counts for each faculty
            const facultyWithCounts = faculty.map(f => ({
                ...f,
                guideCount: 0,
                panelCount: 0
            }));

            setFacultyList(facultyWithCounts);
        } catch (error) {
            console.error('Error fetching faculty:', error);
            setMessage({ type: 'error', text: 'Failed to load faculty list' });
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await getProjectList(
                academicContext.year,
                academicContext.school,
                academicContext.program
            );
            setAllProjects(response?.data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const fetchPanels = async () => {
        try {
            const response = await getPanelList(
                academicContext.year,
                academicContext.school,
                academicContext.program
            );
            const panels = (response?.data || []).map(panel => ({
                _id: panel._id,
                name: panel.panelName || `Panel ${panel._id?.slice(-4) || 'Unknown'}`,
                members: panel.members?.map(m => m.faculty?.name || 'Unknown') || []
            }));
            setAvailablePanels(panels);
        } catch (error) {
            console.error('Error fetching panels:', error);
        }
    };

    const fetchReviews = async () => {
        try {
            const response = await getMarkingSchema(
                academicContext.year,
                academicContext.school,
                academicContext.program
            );
            if (response?.data?.reviews) {
                const reviews = response.data.reviews.map(r => ({
                    value: r.reviewName,
                    label: r.displayName || r.reviewName
                }));
                setAvailableReviews(reviews);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    // Filter projects when faculty is selected
    useEffect(() => {
        if (selectedFaculty && allProjects.length > 0) {
            // Filter by guide
            const guideProjs = allProjects.filter(p =>
                p.guideFaculty?.employeeId === selectedFaculty.employeeId ||
                p.guideFacultyEmpId === selectedFaculty.employeeId
            );
            setGuideProjects(guideProjs);

            // Filter by panel
            const panelProjs = allProjects.filter(p => {
                const mainPanelMembers = p.panel?.members || [];
                const isMainPanel = mainPanelMembers.some(m =>
                    m.faculty?.employeeId === selectedFaculty.employeeId ||
                    m.employeeId === selectedFaculty.employeeId
                );

                const isReviewPanel = p.reviewPanels?.some(rp =>
                    rp.panel?.members?.some(m =>
                        m.faculty?.employeeId === selectedFaculty.employeeId ||
                        m.employeeId === selectedFaculty.employeeId
                    )
                );

                return isMainPanel || isReviewPanel;
            });
            setPanelProjects(panelProjs);
        } else {
            setGuideProjects([]);
            setPanelProjects([]);
        }
        setSelectedProjects([]);
    }, [selectedFaculty, allProjects]);

    // Update faculty counts when projects loading completes
    useEffect(() => {
        if (allProjects.length > 0 && facultyList.length > 0) {
            setFacultyList(prev => prev.map(f => {
                const guideCount = allProjects.filter(p =>
                    p.guideFaculty?.employeeId === f.employeeId ||
                    p.guideFacultyEmpId === f.employeeId
                ).length;

                const panelCount = allProjects.filter(p => {
                    const panelMembers = p.panel?.members || [];
                    return panelMembers.some(m =>
                        m.faculty?.employeeId === f.employeeId ||
                        m.employeeId === f.employeeId
                    );
                }).length;

                return { ...f, guideCount, panelCount };
            }));
        }
    }, [allProjects.length]); // Only run when projects length changes to avoid loops

    // Filter faculty by search
    const filteredFaculty = useMemo(() => {
        if (!facultySearch.trim()) return facultyList;
        const search = facultySearch.toLowerCase();
        return facultyList.filter(f =>
            f.name?.toLowerCase().includes(search) ||
            f.employeeId?.toLowerCase().includes(search) ||
            f.emailId?.toLowerCase().includes(search)
        );
    }, [facultyList, facultySearch]);

    // Handle project selection
    const toggleProjectSelection = (projectId, type) => {
        setSelectedProjects(prev => {
            const exists = prev.find(p => p.id === projectId);
            if (exists) {
                return prev.filter(p => p.id !== projectId);
            }
            return [...prev, { id: projectId, type }];
        });
    };

    const isProjectSelected = (projectId) => {
        return selectedProjects.some(p => p.id === projectId);
    };

    // Open reassign modal
    const openReassignModal = (mode) => {
        setReassignMode(mode);
        setShowReassignModal(true);
        setReassignReason('');
        // Reset enhanced state
        setPanelAssignType('existing');
        setPanelAssignmentScope('main');
        setSelectedReviewType('');
        setIgnoreSpecialization(false);
    };

    // Handle batch reassignment
    const handleBatchReassign = async () => {
        if (!reassignReason.trim()) {
            setMessage({ type: 'error', text: 'Please provide a reason for reassignment' });
            return;
        }

        setLoading(prev => ({ ...prev, reassigning: true }));
        try {
            const projectIds = selectedProjects.map(p => p.id);
            let results;

            if (reassignMode === 'guide') {
                if (!targetFaculty) {
                    setMessage({ type: 'error', text: 'Please select a target faculty' });
                    return;
                }
                results = await batchReassignGuide(projectIds, targetFaculty.employeeId, reassignReason);
            } else {
                // Panel Reassignment Logic
                if (panelAssignType === 'existing') {
                    if (!targetPanel) {
                        setMessage({ type: 'error', text: 'Please select a target panel' });
                        return;
                    }
                    results = await batchReassignPanel(
                        projectIds,
                        targetPanel._id,
                        reassignReason,
                        { // Enhanced params object
                            scope: panelAssignmentScope,
                            reviewType: panelAssignmentScope === 'review' ? selectedReviewType : null,
                            ignoreSpecialization
                        }
                    );
                } else {
                    // Single Faculty as Panel
                    if (!targetFaculty) {
                        setMessage({ type: 'error', text: 'Please select a faculty' });
                        return;
                    }
                    // For Single Faculty, we pass memberEmployeeIds logic
                    results = await batchReassignPanel(
                        projectIds,
                        null, // No panelId
                        reassignReason,
                        {
                            memberEmployeeIds: [targetFaculty.employeeId],
                            scope: panelAssignmentScope,
                            reviewType: panelAssignmentScope === 'review' ? selectedReviewType : null,
                            ignoreSpecialization
                        }
                    );
                }
            }

            const successCount = results.filter(r => r.status === 'fulfilled').length;
            const failureCount = results.filter(r => r.status === 'rejected').length;

            const targetName = reassignMode === 'guide' ? targetFaculty.name : (panelAssignType === 'existing' ? targetPanel?.name : targetFaculty?.name);

            if (failureCount === 0) {
                setMessage({
                    type: 'success',
                    text: `Successfully reassigned ${successCount} project(s) to ${targetName}`
                });
            } else {
                setMessage({
                    type: 'error',
                    text: `Reassigned ${successCount} project(s), ${failureCount} failed`
                });
            }

            // Reset states
            setSelectedProjects([]);
            setShowReassignModal(false);
            setTargetFaculty(null);
            setTargetPanel(null);
            setReassignReason('');
            setIgnoreSpecialization(false);

            // Refresh data
            await fetchAllData();
        } catch (error) {
            console.error('Error reassigning projects:', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to reassign projects' });
        } finally {
            setLoading(prev => ({ ...prev, reassigning: false }));
        }
    };

    // Available faculty for reassignment (excluding current faculty)
    const availableFacultyForReassign = useMemo(() => {
        return facultyList.filter(f => f.employeeId !== selectedFaculty?.employeeId);
    }, [facultyList, selectedFaculty]);

    if (!isContextComplete) {
        return (
            <Card>
                <div className="p-8 text-center text-gray-500">
                    <UserGroupIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Please select an academic context using the filters above.</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Message Banner */}
            {message.text && (
                <div className={`p-3 rounded-lg flex items-center justify-between ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                    <div className="flex items-center gap-2">
                        {message.type === 'success' ? (
                            <CheckCircleIcon className="w-5 h-5" />
                        ) : (
                            <ExclamationTriangleIcon className="w-5 h-5" />
                        )}
                        <span className="text-sm">{message.text}</span>
                    </div>
                    <button onClick={() => setMessage({ type: '', text: '' })} className="p-1 hover:bg-white/50 rounded">
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Faculty Selection */}
            <Card>
                <div className="p-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <UserGroupIcon className="w-5 h-5 text-blue-600" />
                        Select Faculty to Modify Assignments
                    </h3>

                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={facultySearch}
                            onChange={(e) => setFacultySearch(e.target.value)}
                            placeholder="Search faculty by name, ID, or email..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                    </div>

                    {/* Faculty List */}
                    {loading.faculty ? (
                        <div className="flex justify-center py-8">
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
                            {filteredFaculty.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm">No faculty found</div>
                            ) : (
                                filteredFaculty.map((faculty) => (
                                    <button
                                        key={faculty.employeeId}
                                        onClick={() => setSelectedFaculty(faculty)}
                                        className={`w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedFaculty?.employeeId === faculty.employeeId ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                            }`}
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900">{faculty.name}</p>
                                            <p className="text-xs text-gray-500">{faculty.employeeId} • {faculty.emailId}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge variant="info" size="sm">Guide: {faculty.guideCount || 0}</Badge>
                                            <Badge variant="secondary" size="sm">Panel: {faculty.panelCount || 0}</Badge>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </Card>

            {/* Projects Display */}
            {selectedFaculty && (
                <Card>
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold text-gray-900">
                                Projects under {selectedFaculty.name}
                            </h3>

                            {selectedProjects.length > 0 && (
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => openReassignModal('guide')}
                                        disabled={selectedProjects.filter(p => p.type === 'guide').length === 0}
                                    >
                                        <ArrowRightIcon className="w-4 h-4 mr-1" />
                                        Reassign Guide ({selectedProjects.filter(p => p.type === 'guide').length})
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => openReassignModal('panel')}
                                        disabled={selectedProjects.filter(p => p.type === 'panel').length === 0}
                                    >
                                        <ArrowRightIcon className="w-4 h-4 mr-1" />
                                        Reassign Panel ({selectedProjects.filter(p => p.type === 'panel').length})
                                    </Button>
                                </div>
                            )}
                        </div>

                        {loading.projects ? (
                            <div className="flex justify-center py-8">
                                <LoadingSpinner />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Guide Projects */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                        As Guide ({guideProjects.length})
                                    </h4>

                                    {guideProjects.length === 0 ? (
                                        <p className="text-sm text-gray-500 pl-4">No projects as guide</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {guideProjects.map((project) => (
                                                <div
                                                    key={project._id}
                                                    onClick={() => toggleProjectSelection(project._id, 'guide')}
                                                    className={`p-3 border rounded-lg cursor-pointer transition-all ${isProjectSelected(project._id)
                                                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={isProjectSelected(project._id)}
                                                                onChange={() => { }}
                                                                className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                                            />
                                                            <div>
                                                                <p className="font-medium text-gray-900">{project.name}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    Students: {project.students?.map(s => s.name || s.regNo).join(', ')} • {project.specialization}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Badge variant="success" size="sm">{project.status}</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Panel Projects */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                        As Panel Member ({panelProjects.length})
                                    </h4>

                                    {panelProjects.length === 0 ? (
                                        <p className="text-sm text-gray-500 pl-4">No projects as panel member</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {panelProjects.map((project, idx) => (
                                                <div
                                                    key={`${project._id}-${idx}`}
                                                    onClick={() => toggleProjectSelection(project._id, 'panel')}
                                                    className={`p-3 border rounded-lg cursor-pointer transition-all ${isProjectSelected(project._id)
                                                        ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={isProjectSelected(project._id)}
                                                                onChange={() => { }}
                                                                className="w-4 h-4 text-purple-600 rounded border-gray-300"
                                                            />
                                                            <div>
                                                                <p className="font-medium text-gray-900">{project.name}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    Panel: {project.panelName}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {project.assignmentType === 'Review' && (
                                                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                                                    {project.reviewType || 'Review'}
                                                                </span>
                                                            )}
                                                            {(!project.assignmentType || project.assignmentType === 'Regular') && (
                                                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                                    Main Panel
                                                                </span>
                                                            )}
                                                            <Badge variant="success" size="sm">{project.status}</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Reassignment Modal */}
            <Modal
                isOpen={showReassignModal}
                onClose={() => {
                    setShowReassignModal(false);
                    setTargetFaculty(null);
                    setTargetPanel(null);
                    setPanelAssignType('existing');
                    setIgnoreSpecialization(false);
                }}
                title={`Reassign ${reassignMode === 'guide' ? 'Guide' : 'Panel'}`}
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        {selectedProjects.filter(p => p.type === reassignMode).length} project(s) selected for reassignment
                    </p>

                    {reassignMode === 'guide' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select New Guide Faculty
                            </label>
                            <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                                {availableFacultyForReassign.map((faculty) => (
                                    <button
                                        key={faculty.employeeId}
                                        onClick={() => setTargetFaculty(faculty)}
                                        className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${targetFaculty?.employeeId === faculty.employeeId ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        <p className="font-medium text-gray-900">{faculty.name}</p>
                                        <p className="text-xs text-gray-500">{faculty.employeeId}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Toggle between existing panel and single faculty */}
                            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                                <button onClick={() => { setPanelAssignType('existing'); setTargetFaculty(null); }} className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${panelAssignType === 'existing' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>Existing Panel</button>
                                <button onClick={() => { setPanelAssignType('faculty'); setTargetPanel(null); }} className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${panelAssignType === 'faculty' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>Single Faculty</button>
                            </div>

                            {/* Assignment Scope */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700">Assignment Scope</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input type="radio" value="main" checked={panelAssignmentScope === 'main'} onChange={(e) => setPanelAssignmentScope(e.target.value)} className="text-blue-600 focus:ring-blue-500" /> Main Project Panel
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input type="radio" value="review" checked={panelAssignmentScope === 'review'} onChange={(e) => setPanelAssignmentScope(e.target.value)} className="text-blue-600 focus:ring-blue-500" /> Specific Review Only
                                    </label>
                                </div>
                            </div>

                            {/* Review Type Selection */}
                            {panelAssignmentScope === 'review' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Review</label>
                                    <Select options={availableReviews} value={selectedReviewType} onChange={setSelectedReviewType} placeholder="Select a review..." />
                                </div>
                            )}

                            {panelAssignType === 'existing' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Target Panel</label>
                                    <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                                        {availablePanels.map((panel) => (
                                            <button key={panel._id} onClick={() => setTargetPanel(panel)} className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${targetPanel?._id === panel._id ? 'bg-blue-50' : ''}`}>
                                                <p className="font-medium text-gray-900">{panel.name}</p>
                                                <p className="text-xs text-gray-500">Members: {panel.members.join(', ')}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Faculty as Panel</label>
                                    <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                                        {availableFacultyForReassign.map((faculty) => (
                                            <button key={faculty.employeeId} onClick={() => setTargetFaculty(faculty)} className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${targetFaculty?.employeeId === faculty.employeeId ? 'bg-blue-50' : ''}`}>
                                                <p className="font-medium text-gray-900">{faculty.name}</p>
                                                <p className="text-xs text-gray-500">{faculty.employeeId} • Will be assigned as single-member panel</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Reason for reassignment */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason for Reassignment *
                        </label>
                        <textarea
                            value={reassignReason}
                            onChange={(e) => setReassignReason(e.target.value)}
                            placeholder="Please provide a reason for this reassignment..."
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                            rows={3}
                            required
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" id="ignoreSpecialization" checked={ignoreSpecialization} onChange={(e) => setIgnoreSpecialization(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <label htmlFor="ignoreSpecialization" className="text-sm text-gray-700">Ignore Specialization Mismatch</label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="secondary" onClick={() => setShowReassignModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleBatchReassign}
                            disabled={loading.reassigning || !reassignReason.trim() || (reassignMode === 'guide' ? !targetFaculty : (panelAssignType === 'existing' ? !targetPanel : !targetFaculty))}
                        >
                            {loading.reassigning ? 'Reassigning...' : 'Confirm Reassignment'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PCModificationSettings;
