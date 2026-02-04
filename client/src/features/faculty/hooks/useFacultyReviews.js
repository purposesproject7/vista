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
                // VERSION CHECK - FORCE UPDATE
                console.log(`[ReviewHook] VERSION CHECK: Loaded at ${new Date().toISOString()}`);

                setLoading(true);

                // Fetch Data in Parallel
                const [schemaRes, projectsRes, marksRes] = await Promise.allSettled([
                    api.get('/faculty/marking-schema', {
                        academicYear: filters.year,
                        school: filters.school,
                        // FIX: If "All Programs", do not send undefined if backend requires it.
                        // Ideally backend handles it, but let's try sending undefined (which axios strips)
                        // If backend REQUIRES it, we might need a fallback.
                        // The error suggests 400 Bad Request, likely due to missing program.
                        // Assuming backend uses req.query.program
                        program: filters.program === 'All Programs' ? undefined : filters.program
                    }),
                    api.get('/faculty/projects', {
                        params: {
                            academicYear: filters.year,
                            school: filters.school,
                            program: filters.program === 'All Programs' ? undefined : filters.program
                        }
                    }),
                    api.get('/faculty/marks', { params: { _t: Date.now() } })
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
                const submittedMarks = marksRes.status === 'fulfilled' ? (marksRes.value.data.data.student_marks || marksRes.value.data.data) : [];
                const marksList = Array.isArray(submittedMarks) ? submittedMarks : [];

                console.log(`[useFacultyReviews] FETCHED MARKS: ${marksList.length}`);

                // Transform Data
                // --- ROBUST REGEX & MULTI-STRATEGY MAPPING ---

                // Helper to extract review number (e.g. "Review 1" -> "1", "review_1_xxx" -> "1")
                const extractReviewNumber = (str) => {
                    if (!str) return null;
                    const match = String(str).match(/review[\s_-]*(\d+)/i);
                    return match ? match[1] : null;
                };

                // 1. Create a Dictionary of Marks: Map<StudentID, MarkContext>
                // storing the original mark accessible by multiple keys
                const marksByStudent = new Map();

                marksList.forEach(mark => {
                    const sId = String(mark.student?._id || mark.student).trim();
                    if (!marksByStudent.has(sId)) {
                        marksByStudent.set(sId, []);
                    }

                    const rTypeRaw = String(mark.reviewType || '');
                    const rNum = extractReviewNumber(rTypeRaw);

                    // console.log(`[ReviewHook] Indexing Mark: Student=${sId} Type=${rTypeRaw} Num=${rNum}`);

                    marksByStudent.get(sId).push({
                        mark: mark,
                        raw: rTypeRaw,
                        normalized: rTypeRaw.toLowerCase().replace(/[^a-z0-9]/g, ''),
                        number: rNum
                    });
                });

                console.log(`[ReviewHook] Indexed marks for ${marksByStudent.size} students. Total Marks Fetched: ${marksList.length}`);

                // 2. Transform Schema -> Reviews
                const adaptedReviews = schema.reviews.map(reviewSchema => {
                    const reviewId = String(reviewSchema.reviewName).trim();
                    const displayName = String(reviewSchema.displayName || '').trim();

                    // Pre-calculate Schema Match Keys
                    const schemaKeys = {
                        raw: reviewId,
                        normalized: reviewId.toLowerCase().replace(/[^a-z0-9]/g, ''),
                        number: extractReviewNumber(reviewId) || extractReviewNumber(displayName)
                    };

                    // Filter teams relevant to this review
                    const relevantTeams = projects.filter(project => {
                        // ... (keep existing role filtering logic) ...
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

                        const canBeGuide = String(reviewSchema.facultyType).toLowerCase() === 'guide' || String(reviewSchema.facultyType).toLowerCase() === 'both';
                        const canBePanel = String(reviewSchema.facultyType).toLowerCase() === 'panel' || String(reviewSchema.facultyType).toLowerCase() === 'both';

                        const roleFilter = filters.role?.toLowerCase() || 'all roles';

                        let matches = false;
                        if (roleFilter === 'guide') {
                            matches = isGuide && canBeGuide;
                        } else if (roleFilter === 'panel') {
                            matches = isInPanel && canBePanel;
                        } else {
                            matches = (isGuide && canBeGuide) || (isInPanel && canBePanel);
                        }

                        return matches;
                    }).map(project => {
                        // 3. Map Students and Attach Marks using Multi-Strategy Lookup
                        const studentsWithMarks = project.students.map(student => {
                            const sId = String(student._id || student).trim();

                            // LOOKUP MARK
                            const studentMarksCandidates = marksByStudent.get(sId) || [];
                            let studentMark = null;

                            // Log candidates for debugging
                            if (studentMarksCandidates.length > 0) {
                                // console.log(`[ReviewHook] Candidates for ${student.name} (${sId}):`, studentMarksCandidates.map(c => `${c.raw} [${c.number}]`));
                            } else {
                                // Log missing candidates so we know if index failed
                                console.log(`[ReviewHook] NO CANDIDATES for ${student.name} (${sId}). Check if marks were fetched.`);
                            }

                            // Strategy 1: Exact Number Match (Best for "Review 1" vs "review_1_3745")
                            if (!studentMark && schemaKeys.number) {
                                const found = studentMarksCandidates.find(c => c.number === schemaKeys.number);
                                if (found) {
                                    studentMark = found.mark;
                                    // console.log(`[ReviewHook] MATCH: Number ${schemaKeys.number} (Schema: ${reviewId} | Match: ${found.raw})`);
                                }
                            }

                            // Strategy 2: Normalized String Containment
                            if (!studentMark) {
                                const found = studentMarksCandidates.find(c =>
                                    c.normalized.includes(schemaKeys.normalized) ||
                                    schemaKeys.normalized.includes(c.normalized)
                                );
                                if (found) {
                                    studentMark = found.mark;
                                    console.log(`[ReviewHook] MATCH: Norm ${c.normalized} <-> ${schemaKeys.normalized}`);
                                }
                            }

                            // Strategy 3: Try Display Name Match explicitly (User Request)
                            if (!studentMark && displayName) {
                                const normDisplay = displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
                                const found = studentMarksCandidates.find(c => c.normalized === normDisplay || c.normalized.includes(normDisplay) || normDisplay.includes(c.normalized));
                                if (found) {
                                    studentMark = found.mark;
                                    console.log(`[ReviewHook] MATCH: DisplayName '${displayName}' matches '${found.raw}'`);
                                }
                            }

                            if (studentMark) {
                                // console.log(`[ReviewHook] Success Linking Student ${sId} to Mark ${studentMark._id}`);
                                if (!studentMark._id) {
                                    console.warn(`[ReviewHook] WARNING: Mark found for ${student.name} but has NO _id!`, studentMark);
                                }
                            } else {
                                // ALWAYS LOG FAILURE now
                                console.log(`[ReviewHook] FAILED TO MATCH for ${student.name} (${sId}). Schema: [${schemaKeys.raw}|${schemaKeys.normalized}|${schemaKeys.number}] vs Candidates:`, studentMarksCandidates.map(c => `[${c.raw}|${c.normalized}|${c.number}]`));
                            }

                            return {
                                student_id: student._id || student,
                                student_name: student.name,
                                roll_no: student.regNo, // Ensure this exists
                                email: student.emailId,
                                profile_image: student.profileImage || null,
                                existingMarks: studentMark?.componentMarks || [],
                                existingMeta: {
                                    comment: studentMark?.remarks || '',
                                    isSubmitted: !!studentMark?.isSubmitted // Ensure boolean
                                },
                                markId: studentMark?._id, // Critical for PUT
                                totalMarks: studentMark?.totalMarks || 0,
                                maxTotalMarks: studentMark?.maxTotalMarks || 0
                            };
                        });

                        // 4. Determine Completion based on attached marks
                        // Calculate metrics for logging
                        const totalStudents = project.students.length;
                        const studentsSubmitted = studentsWithMarks.filter(s => s.existingMeta.isSubmitted).length;
                        const allStudentsMarked = totalStudents > 0 && studentsSubmitted === totalStudents;

                        // DEBUG: Log completion status for Guide reviews specifically
                        if (isGuide && relevantTeams.length < 5) {
                            console.log(`[ReviewHook] Team ${project.name}: ${studentsSubmitted}/${totalStudents} Submitted. Complete? ${allStudentsMarked}`);
                        }

                        const isGuide = String(project.guideFaculty?._id || project.guideFaculty) === String(effectiveFacultyId);
                        const reviewPanelAssignment = project.reviewPanels?.find(rp => rp.reviewType === reviewId);
                        const activePanel = reviewPanelAssignment?.panel || project.panel;
                        // ... (keep logic for role label)

                        let roleLabel = 'Guide';
                        // Simplified role labeling for brevity
                        if (!isGuide) roleLabel = 'Panel';


                        return {
                            id: project._id,
                            name: project.name,
                            projectTitle: project.name,
                            students: studentsWithMarks, // Use the mapped students
                            marksEntered: allStudentsMarked,
                            guideId: project.guideFaculty?._id || project.guideFaculty,
                            panelName: activePanel?.panelName || activePanel?.name || 'TBD',
                            venue: activePanel?.venue || 'TBD',
                            role: isGuide ? 'guide' : 'panel',
                            roleLabel: roleLabel,
                            pptApprovals: project.pptApprovals || []
                        };
                    });

                    return {
                        id: reviewId,
                        name: reviewSchema.displayName,
                        startDate: reviewSchema.deadline.from,
                        endDate: reviewSchema.deadline.to,
                        type: filters.role && filters.role !== 'All Roles' ? filters.role.toLowerCase() : (reviewSchema.facultyType === 'both' ? 'both' : reviewSchema.facultyType),
                        rubrics: [], // Fill later if needed or mapped below
                        teams: relevantTeams,
                        // Pass through rubric structure from schema
                        rubric_structure: reviewSchema.components.map(comp => ({
                            rubric_id: comp.componentId,
                            component_name: comp.name,
                            max_marks: comp.maxMarks,
                            component_description: comp.description || '',
                            sub_components: comp.subComponents || []
                        }))
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

    const past = reviews.filter(r =>
        isAllTeamsMarked(r) || (isDeadlinePassed(r.endDate) && isAllTeamsMarked(r))
    );

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
