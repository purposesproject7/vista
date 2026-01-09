import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { isDeadlinePassed, isReviewActive } from '../../../shared/utils/dateHelpers';

export const useFacultyReviews = (facultyId, filters = {}) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refreshReviews = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setLoading(true);

                // Fetch Data in Parallel
                const [schemaRes, projectsRes, marksRes] = await Promise.allSettled([
                    api.get('/faculty/marking-schema'),
                    api.get('/faculty/projects'),
                    api.get('/faculty/marks')
                ]);

                // Handle Schema
                if (schemaRes.status === 'rejected' || !schemaRes.value?.data?.data) {
                    console.warn('Marking schema not found or failed', schemaRes);
                    setReviews([]);
                    setLoading(false);
                    return;
                }
                const schema = schemaRes.value.data.data;

                // Handle Projects
                let projects = [];
                if (projectsRes.status === 'fulfilled') {
                    const rawData = projectsRes.value.data.data;
                    if (Array.isArray(rawData)) {
                        projects = rawData;
                    } else if (rawData && typeof rawData === 'object') {
                        // Backend likely returns { guideProjects: [], panelProjects: [] }
                        const guideProjects = rawData.guideProjects || [];
                        const panelProjects = rawData.panelProjects || [];
                        // Combine and deduplicate by ID just in case
                        const allProjects = [...guideProjects, ...panelProjects];
                        const uniqueIds = new Set();
                        projects = allProjects.filter(p => {
                            if (uniqueIds.has(p._id)) return false;
                            uniqueIds.add(p._id);
                            return true;
                        });
                    }
                }

                // Handle Marks
                const submittedMarks = marksRes.status === 'fulfilled' ? marksRes.value.data.data.student_marks || marksRes.value.data.data : [];

                const marksList = Array.isArray(submittedMarks) ? submittedMarks : [];

                // Transform Data
                const adaptedReviews = schema.reviews.map(reviewSchema => {
                    const reviewId = reviewSchema.reviewName; // e.g., "Review 1"

                    // Filter teams relevant to this review
                    const relevantTeams = projects.map(project => {
                        // Check if existing marks exist for this project+reviewType
                        const projectMarks = marksList.filter(m =>
                            (m.project?._id === project._id || m.project === project._id) &&
                            m.reviewType === reviewId
                        );

                        // A team is "marked" if every student has a submitted mark entry
                        const allStudentsMarked = project.students.length > 0 && project.students.every(student => {
                            const sId = student._id || student;
                            return projectMarks.some(m =>
                                (m.student?._id === sId || m.student === sId) &&
                                m.isSubmitted
                            );
                        });

                        return {
                            id: project._id,
                            name: `Team ${project.name}`,
                            projectTitle: project.name,
                            students: project.students.map(s => ({
                                id: s._id,
                                name: s.name,
                                regNo: s.regNo,
                                email: s.emailId
                            })),
                            marksEntered: allStudentsMarked,
                            guideId: project.guideFaculty?._id
                        };
                    });

                    // Adapt components/rubrics and generate levels
                    const rubrics = reviewSchema.components.map(comp => {
                        const maxMarks = comp.maxMarks || 20;
                        const steps = 5;
                        const levels = [];

                        // Generate appropriate levels (0 to maxMarks)
                        // Heuristic: 0, 25%, 50%, 75%, 100% of Max Marks
                        // Ensure integers
                        for (let i = 0; i <= steps; i++) {
                            const val = Math.round((i / steps) * maxMarks);
                            // Dedup
                            if (levels.length > 0 && levels[levels.length - 1].score === val) continue;

                            let label = 'Fair';
                            if (i === 0) label = 'Poor';
                            else if (i === steps) label = 'Excellent';
                            else if (i === Math.floor(steps / 2)) label = 'Average';
                            else if (i > Math.floor(steps / 2)) label = 'Good';

                            levels.push({
                                score: val,
                                label: label,
                                description: `Score: ${val} / ${maxMarks}`
                            });
                        }

                        return {
                            rubricId: comp.componentId || comp._id || comp.name,
                            componentName: comp.name,
                            componentDescription: comp.description,
                            maxMarks: maxMarks,
                            subComponents: comp.subComponents?.map(sub => ({
                                subId: sub.name,
                                name: sub.name,
                                description: sub.description,
                                maxMarks: sub.weight
                            })) || [],
                            levels: levels
                        };
                    });

                    return {
                        id: reviewId,
                        name: reviewSchema.displayName,
                        startDate: reviewSchema.deadline.from,
                        endDate: reviewSchema.deadline.to,
                        type: reviewSchema.facultyType === 'both' ? 'guide' : reviewSchema.facultyType,
                        rubrics: rubrics,
                        teams: relevantTeams
                    };
                });

                // Apply Filters (Client-side)
                let filteredReviews = adaptedReviews;
                if (filters.role && filters.role.toLowerCase() !== 'all roles') {
                    filteredReviews = adaptedReviews.filter(r =>
                        schema.reviews.find(sr => sr.reviewName === r.id)?.facultyType === 'both' ||
                        r.type.toLowerCase() === filters.role.toLowerCase()
                    );
                }

                setReviews(filteredReviews);
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
        loading,
        error,
        refreshReviews
    };
};
