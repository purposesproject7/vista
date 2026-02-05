import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { isDeadlinePassed, isReviewActive } from '../../../shared/utils/dateHelpers';

export const useFacultyReviews = (facultyId, filters = {}) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [assignments, setAssignments] = useState({ panel: [], guide: [] });

    const refreshReviews = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setLoading(true);

                // Fetch Data in Parallel
                const [schemaRes, projectsRes, marksRes, requestsRes] = await Promise.allSettled([
                    api.get('/faculty/marking-schema', {
                        params: {
                            academicYear: filters.year,
                            school: filters.school,
                            program: filters.program === 'All Programs' ? undefined : filters.program
                        }
                    }),
                    api.get('/faculty/projects', {
                        params: {
                            academicYear: filters.year,
                            school: filters.school,
                            program: filters.program === 'All Programs' ? undefined : filters.program
                        }
                    }),
                    api.get('/faculty/marks'),
                    api.get('/faculty/requests') // Fetch requests made by this faculty
                ]);

                // Handle Schema
                if (schemaRes.status === 'rejected' || !schemaRes.value?.data?.data) {
                    console.warn('Marking schema not found or failed', schemaRes);
                    setReviews([]);
                    setLoading(false);
                    return;
                }
                const schema = schemaRes.value.data.data;
                console.log(`[useFacultyReviews] Marking Schema reviews found: ${schema.reviews?.length || 0}`);

                // Handle Requests
                const myRequests = requestsRes.status === 'fulfilled' ? requestsRes.value.data.data : [];

                // Handle Projects
                let projects = [];
                let effectiveFacultyId = facultyId;
                let effectiveEmpId = '';

                if (projectsRes.status === 'fulfilled') {
                    const resData = projectsRes.value.data;
                    effectiveFacultyId = resData.facultyId || facultyId;
                    effectiveEmpId = resData.employeeId || '';
                    const rawData = resData.data;

                    if (Array.isArray(rawData)) {
                        projects = rawData;
                    } else if (rawData && typeof rawData === 'object') {
                        // Backend returns { guideProjects: [], panelProjects: [] }
                        const guideProjects = rawData.guideProjects || [];
                        const panelProjects = rawData.panelProjects || [];
                        // Combine and deduplicate by ID
                        const allProjects = [...guideProjects, ...panelProjects];
                        const uniqueIds = new Set();
                        projects = allProjects.filter(p => {
                            const pid = String(p._id);
                            if (uniqueIds.has(pid)) return false;
                            uniqueIds.add(pid);
                            return true;
                        });
                    }
                }
                console.log(`[useFacultyReviews] TOTAL_PROJECTS_FETCHED: ${projects.length} for ${effectiveFacultyId} (${effectiveEmpId})`);

                // Handle Marks
                const submittedMarks = marksRes.status === 'fulfilled' ? marksRes.value.data.data.student_marks || marksRes.value.data.data : [];

                const marksList = Array.isArray(submittedMarks) ? submittedMarks : [];

                // Transform Data
                const adaptedReviews = schema.reviews.map(reviewSchema => {
                    const reviewId = reviewSchema.reviewName; // e.g., "Review 1"
                    console.log(`[useFacultyReviews] Checking Review: ${reviewId} (FacultyType: ${reviewSchema.facultyType})`);

                    // Filter teams relevant to this review
                    const relevantTeams = projects.filter(project => {
                        // 1. Is faculty the guide?
                        const guideId = String(project.guideFaculty?._id || project.guideFaculty);
                        const isGuide = guideId === String(effectiveFacultyId);

                        // 2. Is faculty in the panel for THIS specific review?
                        const reviewPanelAssignment = project.reviewPanels?.find(rp => rp.reviewType === reviewId);
                        const assignedPanel = reviewPanelAssignment?.panel || project.panel;

                        const panelMembers = assignedPanel?.members || [];
                        const panelEmpIds = assignedPanel?.facultyEmployeeIds || [];

                        const isInPanelMember = panelMembers.some(m => String(m.faculty?._id || m.faculty) === String(effectiveFacultyId));
                        const isInPanelEmp = effectiveEmpId && panelEmpIds.some(eid => String(eid) === String(effectiveEmpId));
                        const isInPanel = isInPanelMember || isInPanelEmp;

                        // Match against review schema type
                        const canBeGuide = String(reviewSchema.facultyType).toLowerCase() === 'guide' || String(reviewSchema.facultyType).toLowerCase() === 'both';
                        const canBePanel = String(reviewSchema.facultyType).toLowerCase() === 'panel' || String(reviewSchema.facultyType).toLowerCase() === 'both';

                        // Check against Dashboard Role Filter
                        const roleFilter = filters.role?.toLowerCase() || 'all roles';

                        let matches = false;
                        if (roleFilter === 'guide') {
                            matches = isGuide;
                        } else if (roleFilter === 'panel') {
                            matches = isInPanel && canBePanel;
                        } else {
                            matches = (isGuide && canBeGuide) || (isInPanel && canBePanel);
                        }

                        return matches;
                    }).map(project => {
                        // A team is "marked" if every student has a submitted mark entry
                        const projectMarks = marksList.filter(m =>
                            String(m.project?._id || m.project) === String(project._id) &&
                            m.reviewType === reviewId
                        );

                        const allStudentsMarked = project.students.length > 0 && project.students.every(student => {
                            const sId = String(student._id || student);
                            return projectMarks.some(m =>
                                String(m.student?._id || m.student) === sId &&
                                m.isSubmitted
                            );
                        });

                        const isGuide = String(project.guideFaculty?._id || project.guideFaculty) === String(effectiveFacultyId);

                        const reviewPanelAssignment = project.reviewPanels?.find(rp => rp.reviewType === reviewId);
                        const isTempPanel = reviewPanelAssignment?.panel?.members?.some(m => String(m.faculty?._id || m.faculty) === String(effectiveFacultyId)) ||
                            (effectiveEmpId && reviewPanelAssignment?.panel?.facultyEmployeeIds?.includes(effectiveEmpId));

                        let roleLabel = 'Guide';
                        if (isTempPanel) roleLabel = 'Temporary Panel';
                        else if (!isGuide) roleLabel = 'Panel';

                        const activePanel = reviewPanelAssignment?.panel || project.panel;

                        // Find Request Status
                        // We need to see if ANY student in this team has a pending request for this review?
                        // Or since we now do team-based requests (cascading), checking just one is enough but filtering by project/review is safer.
                        const activeRequest = myRequests.find(r =>
                            String(r.project?._id || r.project) === String(project._id) &&
                            r.reviewType === reviewId &&
                            r.requestType === 'mark_edit' // Only care about edit requests
                        );

                        // If multiple exist (legacy), take the latest. Backend sort is descending createdAt, so find() gets latest.
                        const requestStatus = activeRequest ? activeRequest.status : null;

                        return {
                            id: project._id,
                            name: project.name, // Removed "Team " prefix
                            projectTitle: project.name,
                            students: project.students.map(s => {
                                const sId = String(s._id || s);
                                const studentMark = projectMarks.find(m => String(m.student?._id || m.student) === sId);

                                return {
                                    student_id: s._id,
                                    student_name: s.name,
                                    roll_no: s.regNo,
                                    email: s.emailId,
                                    profile_image: s.profileImage || null,
                                    profile_image: s.profileImage || null,
                                    existingMarks: studentMark?.componentMarks || [],
                                    existingMeta: {
                                        comment: studentMark?.remarks || '',
                                        isSubmitted: studentMark?.isSubmitted || false,
                                        // attendance/pat logic might need better DB storage mapping
                                        attendance: studentMark?.attendance || 'present', // Assuming new fields exist or defaulting
                                        pat: studentMark?.pat || false // Assuming new fields exist or defaulting
                                    },
                                    marksId: studentMark?._id, // EXPOSE THE MARKS ID FOR UPDATES
                                    totalMarks: studentMark?.totalMarks || 0,
                                    maxTotalMarks: studentMark?.maxTotalMarks || 0
                                };
                            }),
                            marksEntered: allStudentsMarked,
                            guideId: project.guideFaculty?._id || project.guideFaculty,
                            panelName: activePanel?.panelName || activePanel?.name || 'TBD',
                            venue: activePanel?.venue || 'TBD',
                            role: isGuide ? 'guide' : 'panel',
                            roleLabel: roleLabel, // "Temporary Panel", "Panel", "Guide"
                            pptApprovals: project.pptApprovals || [], // Pass PPT approvals to UI
                            requestStatus: requestStatus, // 'pending', 'approved', 'rejected' or null
                            activeRequest: activeRequest,
                            isUnlocked: requestStatus === 'approved' // Unlock if request is approved
                        };
                    });

                    console.log(`[useFacultyReviews] Review ${reviewId} - Relevant Teams: ${relevantTeams.length}`);

                    // Adapt components/rubrics and generate levels
                    const rubrics = reviewSchema.components.map(comp => {
                        const maxMarks = comp.maxMarks || 20;
                        const steps = 5;
                        const levels = [];

                        // Generate appropriate levels (0 to maxMarks)
                        // Heuristic: 0, 25%, 50%, 75%, 100% of Max Marks
                        for (let i = 0; i <= steps; i++) {
                            const val = Math.round((i / steps) * maxMarks * 10) / 10;
                            if (levels.length > 0 && levels[levels.length - 1].score === val) continue;

                            let label = 'Fair';
                            if (i === 0) label = 'Poor';
                            else if (i === steps) label = 'Excellent';
                            else if (i === Math.floor(steps / 2)) label = 'Average';
                            else if (i > Math.floor(steps / 2)) label = 'Good';

                            levels.push({
                                score: val,
                                label: label
                            });
                        }

                        return {
                            rubric_id: comp.componentId || comp._id || comp.name,
                            component_name: comp.name,
                            component_description: comp.description || '',
                            max_marks: maxMarks,
                            sub_components: comp.subComponents?.map(sub => ({
                                sub_id: sub.name,
                                name: sub.name,
                                description: sub.description,
                                max_marks: sub.weight
                            })) || [],
                            levels: levels
                        };
                    });

                    return {
                        id: reviewId,
                        name: reviewSchema.displayName,
                        startDate: reviewSchema.deadline.from,
                        endDate: reviewSchema.deadline.to,
                        type: filters.role && filters.role !== 'All Roles' ? filters.role.toLowerCase() : (reviewSchema.facultyType === 'both' ? 'both' : reviewSchema.facultyType),
                        facultyType: reviewSchema.facultyType,
                        rubrics: rubrics,
                        teams: relevantTeams
                    };
                }).filter(r => r.teams.length > 0);

                setReviews(adaptedReviews);

                // For the "My Assignments" view (unfiltered by marking schema)
                const pAssignments = projects.filter(project => {
                    const assignedPanel = project.panel;
                    const panelMembers = assignedPanel?.members || [];
                    const panelEmpIds = assignedPanel?.facultyEmployeeIds || [];

                    const isInP = panelMembers.some(m => String(m.faculty?._id || m.faculty) === String(effectiveFacultyId)) ||
                        (effectiveEmpId && panelEmpIds.some(eid => String(eid) === String(effectiveEmpId)));
                    return isInP;
                }).map(p => ({ ...p, role: 'panel' }));

                const gAssignments = projects.filter(project => {
                    return String(project.guideFaculty?._id || project.guideFaculty) === String(effectiveFacultyId);
                }).map(p => ({ ...p, role: 'guide' }));

                setAssignments({
                    panel: pAssignments,
                    guide: gAssignments
                });

                setError(null);
            } catch (err) {
                console.error('Error fetching reviews:', err);
                setError('Failed to load reviews');
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [facultyId, filters, refreshTrigger]);

    const isAllTeamsMarked = (review) => {
        return review.teams?.length > 0 && review.teams.every(team => team.marksEntered);
    };

    const active = reviews.filter(r => isReviewActive(r.startDate, r.endDate) && !isAllTeamsMarked(r));

    const deadlinePassed = reviews.filter(r =>
        isDeadlinePassed(r.endDate) && !isAllTeamsMarked(r)
    );

    // Completed Reviews Logic:
    // A review appears in "Completed" if:
    // 1. Logic A: The review deadline has passed (regardless of marking status? usually yes).
    // 2. Logic B: A specific team has been fully marked (submitted).

    // We want to show a structure: Review -> [Completed Teams]
    // So 'past' should be a list of reviews, but inside each review, we might ideally showing ONLY the completed teams?
    // Or if the plan is "Moved to Past Section", usually it means the *Review* is done.

    // Current requirement: "completed is showing teams but shd show review and then teams"
    // So we return the reviews, but perhaps we want to include ANY review that has AT LEAST ONE completed team?
    // Or adhering to the "Review is Completed" definition?
    // Let's stick to "Review is Completed" or "Deadline Passed" for the SECTION, 
    // but ensure the structure is preserved.

    // Actually, "Completed Reviews" section usually implies the *Faculty's* work is done or time is up.
    // Let's rely on standard logic but ensure we return Review Objects.

    const past = reviews.filter(r =>
        isAllTeamsMarked(r) || (isDeadlinePassed(r.endDate))
    ).map(r => {
        // Optional: Filter strict teams?
        // If deadline passed, show ALL teams (even pending ones, which are locked).
        // If deadline NOT passed but all marked, show ALL teams (all are marked).
        // So simply returning the review is correct.
        return r;
    });

    return {
        reviews,
        active,
        deadlinePassed,
        past,
        panelAssignments: assignments.panel,
        guideAssignments: assignments.guide,
        loading,
        error,
        refreshReviews
    };
};
