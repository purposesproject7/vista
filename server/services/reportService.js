import Student from "../models/studentSchema.js";
import Faculty from "../models/facultySchema.js";
import Project from "../models/projectSchema.js";
import Marks from "../models/marksSchema.js";
import Panel from "../models/panelSchema.js";
import mongoose from "mongoose";
import ActivityLogService from "./activityLogService.js";

export class ReportService {
    /**
     * Main entry point to generate reports based on type works
     */
    static async generateReport(type, filters) {
        switch (type) {
            case "master-report":
                return this.generateMasterReport(filters);
            case "student-marks-range":
                return this.generateMarksRangeReport(filters);
            case "panel-marks-entry":
                return this.generatePanelStatusReport(filters);
            case "guide-student-list":
                return this.generateGuideStudentReport(filters);
            case "comprehensive-marks":
                return this.generateComprehensiveMarksReport(filters);
            case "faculty-workload":
                return this.generateFacultyWorkloadReport(filters);
            case "pending-marks":
                return this.generatePendingMarksReport(filters);
            case "marks-distribution":
                return this.generateMarksDistributionReport(filters);
            case "student-complete-details":
                return this.generateStudentCompleteReport(filters);
            case "faculty-time-sheet":
                return this.generateTimeSheetReport(filters);
            default:
                throw new Error("Invalid report type");
        }
    }

    /**
     * 1. Master Report - All Data
     * Fetches data from multiple collections
     */
    static async generateMasterReport(filters) {
        // Determine query context if filters exist (e.g. for specific year)
        const baseQuery = {};
        if (filters.academicYear) baseQuery.academicYear = filters.academicYear;

        const [students, faculty, projects, marks, panels] = await Promise.all([
            Student.find(baseQuery).lean(),
            Faculty.find({}).lean(), // Faculty guidelines usually span years, but can filter if needed
            Project.find(baseQuery).populate("guideFaculty").populate("panel").lean(),
            Marks.find(baseQuery).lean(),
            Panel.find(baseQuery).populate("members.faculty").lean(),
        ]);

        return {
            students,
            faculty,
            projects,
            marks,
            panels,
        };
    }

    /**
     * 2. Students by Marks Range
     */
    static async generateMarksRangeReport(filters) {
        const { minMarks, maxMarks, ...queryFilters } = filters;
        const min = parseFloat(minMarks) || 0;
        const max = parseFloat(maxMarks) || 100;

        const query = this._buildMatchQuery(queryFilters);

        // Fetch all marks matching the criteria
        const marks = await Marks.find(query)
            .populate("student", "name regNo")
            .populate("faculty", "name")
            .populate("project", "name")
            .lean();

        // 1. Group marks by student
        const studentMarksMap = {};
        marks.forEach(m => {
            if (!m.student) return;
            const sid = m.student._id.toString();
            if (!studentMarksMap[sid]) {
                studentMarksMap[sid] = {
                    student: m.student,
                    project: m.project,
                    reviews: {}
                };
            }
            if (!studentMarksMap[sid].reviews[m.reviewType]) {
                studentMarksMap[sid].reviews[m.reviewType] = [];
            }
            studentMarksMap[sid].reviews[m.reviewType].push(m);
        });

        const results = [];

        // 2. Calculate Effective Score for each student
        Object.values(studentMarksMap).forEach(data => {
            let totalObtained = 0;
            // let totalMax = 0;

            // Iterate reviews (e.g., Review 1, Review 2, PPT)
            Object.values(data.reviews).forEach(reviewMarks => {
                // reviewMarks is array of Mark docs for ONE review type
                // Separate Guide vs Panel
                const guideMarkParam = reviewMarks.find(r => r.facultyType === 'guide');
                const panelMarksParam = reviewMarks.filter(r => r.facultyType === 'panel');

                let guideScore = guideMarkParam ? (guideMarkParam.totalMarks || 0) : 0;
                // let guideMax = guideMarkParam ? (guideMarkParam.maxTotalMarks || 100) : 100;

                let panelScore = 0;
                // let panelMax = 0;
                if (panelMarksParam.length > 0) {
                    const pSum = panelMarksParam.reduce((sum, m) => sum + (m.totalMarks || 0), 0);
                    panelScore = pSum / panelMarksParam.length; // Average
                    // panelMax = panelMarksParam[0].maxTotalMarks || 100;
                }

                // Total for this review
                totalObtained += (guideScore + panelScore);

                // if(guideMarkParam) totalMax += guideMax;
                // if(panelMarksParam.length > 0) totalMax += panelMax;
            });

            // 3. Filter by Range
            if (totalObtained >= min && totalObtained <= max) {
                results.push({
                    regNo: data.student.regNo,
                    studentName: data.student.name,
                    projectName: data.project?.name,
                    marks: parseFloat(totalObtained.toFixed(2)),
                    facultyName: "Aggregated",
                    facultyType: "Mixed"
                });
            }
        });

        return results;
    }

    /**
     * 3. Panel Marks Entry Status
     */
    static async generatePanelStatusReport(filters) {
        const query = this._buildMatchQuery(filters);

        // Get all panels
        const panels = await Panel.find(query)
            .populate("members.faculty", "name email")
            .lean();

        const results = [];

        for (const panel of panels) {
            // Get projects assigned to this panel
            const projects = await Project.find({ panel: panel._id }).lean();
            const projectIds = projects.map(p => p._id);

            // Count total students in these projects
            let totalStudents = 0;
            projects.forEach(p => totalStudents += p.students.length);

            // Count marks submitted by this panel (facultyType: 'panel') for these projects
            const submittedMarksCount = await Marks.countDocuments({
                project: { $in: projectIds },
                facultyType: 'panel'
            });

            // Calculate expected marks: (Students * Panel Members)
            // If no members or no students, expected is 0.
            const totalMembers = panel.members ? panel.members.length : 0;
            const expectedMarks = totalStudents * totalMembers;

            // Status is completed if submitted >= expected (and expected > 0)
            // Handle edge case where expected is 0 (no members or no students) -> marked as N/A or Completed?
            const isComplete = totalStudents > 0 && totalMembers > 0 && submittedMarksCount >= expectedMarks;

            results.push({
                panelName: panel.panelName,
                members: panel.members?.map(m => m.faculty?.name || "Unknown").join(", ") || "",
                totalProjects: projects.length,
                totalStudents: totalStudents,
                marksSubmitted: submittedMarksCount,
                pending: Math.max(0, expectedMarks - submittedMarksCount),
                status: isComplete ? "Completed" : "Pending"
            });
        }

        return results;
    }

    /**
     * 4. Guide-wise Student List
     */
    static async generateGuideStudentReport(filters) {
        const query = this._buildMatchQuery(filters);
        if (filters.guideId) {
            // Look up faculty _id if guideId is provided (assuming it's formatted properly)
            // If it's a string ID from frontend
            query.guideFaculty = filters.guideId;
        }

        const projects = await Project.find(query)
            .populate("guideFaculty", "name email department")
            .populate("students", "name regNo emailId")
            .lean();

        const flattened = [];
        projects.forEach(p => {
            p.students.forEach(s => {
                flattened.push({
                    guideName: p.guideFaculty?.name || "Unassigned",
                    guideEmail: p.guideFaculty?.email,
                    projectTitle: p.name,
                    studentName: s.name,
                    regNo: s.regNo,
                    email: s.emailId
                });
            });
        });

        return flattened.sort((a, b) => a.guideName.localeCompare(b.guideName));
    }

    /**
     * 5. Comprehensive Marks Report
     */
    static async generateComprehensiveMarksReport(filters) {
        const query = this._buildMatchQuery(filters);

        const students = await Student.find(query).sort({ regNo: 1 }).lean();
        const results = [];

        for (const student of students) {
            // Find Project
            const project = await Project.findOne({
                students: student._id,
                status: { $in: ["active", "completed"] }
            })
                .populate("guideFaculty", "name")
                .populate("panel", "panelName")
                .lean();

            if (!project) {
                //console.log(`DEBUG: Skipping student ${student.regNo} - No active/completed project found.`);
                continue;
            }

            // Find Marks for this student
            const marks = await Marks.find({ student: student._id }).lean();

            // Group marks by reviewType
            const marksByReview = {};
            marks.forEach(m => {
                if (!marksByReview[m.reviewType]) {
                    marksByReview[m.reviewType] = {
                        guideMark: null,
                        panelMarks: []
                    };
                }
                if (m.facultyType === 'guide') {
                    marksByReview[m.reviewType].guideMark = m;
                } else if (m.facultyType === 'panel') {
                    marksByReview[m.reviewType].panelMarks.push(m);
                }
            });

            // Process each review type found
            // If no marks found at all, we might want to still show the student row?
            // The original logic seemed to flatten per student, but didn't clearly separate reviews.
            // If we want a flattened list per review per student, we loop reviews.
            // If we want one row per student with accumulated reviews, we loop marksByReview.
            // Assuming the requirement "add the marks for each review... avg them and show them in the script"
            // implies we likely want list of report rows where each row might be a review or columns are reviews.
            // Given the existing structure was ONE row per student with 'guideMarks' and 'panelMarks' (implying maybe only one main review or sum),
            // let's try to maintain one row per student but accumulate total averages across all reviews, OR return detailed per-review data?
            // "Show them in the script" -> likely means the frontend script/table.
            // To support multiple reviews (Review 1, Review 2 etc), let's construct a detail object.

            // HOWEVER, the original code had:
            // guideMarks: guideMark ? guideMark.totalMarks : "Pending",
            // panelMarks: panelMark ? panelMark.totalMarks : "Pending",
            // total: (guideMark?.totalMarks || 0) + (panelMark?.totalMarks || 0)

            // This suggests it MIGHT have been built for a single review scenario or flawed logic picking *any* mark.
            // To support distinct reviews properly, let's output an array of reviews for the student
            // OR if the table expects one row per student, we might sum up everything?
            // "Avg them and show them": context implies averaging PANEL marks for A SINGLE REVIEW.

            // Let's iterate found review types and create a row for EACH Review Type for clarity, 
            // OR keep student-centric and nest review details.
            // Standard report tables often want flat data. Let's produce one row PER REVIEW per Student.

            if (Object.keys(marksByReview).length === 0) {
                // No marks yet
                results.push({
                    regNo: student.regNo,
                    name: student.name,
                    projectTitle: project.name,
                    guideName: project.guideFaculty?.name,
                    panelName: project.panel?.panelName,
                    reviewType: "N/A",
                    guideMarks: "Pending",
                    panelMarks: "Pending",
                    total: 0
                });
            } else {
                for (const reviewType of Object.keys(marksByReview)) {
                    const reviewData = marksByReview[reviewType];
                    const guideMarkVal = reviewData.guideMark ? reviewData.guideMark.totalMarks : 0;
                    const guideStatus = reviewData.guideMark ? "Submitted" : "Pending";

                    // Calculate Panel Average
                    let panelAvg = 0;
                    let panelStatus = "Pending";
                    if (reviewData.panelMarks.length > 0) {
                        const sum = reviewData.panelMarks.reduce((acc, curr) => acc + curr.totalMarks, 0);
                        panelAvg = sum / reviewData.panelMarks.length;
                        panelStatus = "Submitted"; // Partial or Full? Assuming submitted if any exist
                    }

                    results.push({
                        regNo: student.regNo,
                        name: student.name,
                        projectTitle: project.name,
                        guideName: project.guideFaculty?.name,
                        panelName: project.panel?.panelName,
                        reviewType: reviewType,
                        guideMarks: guideStatus === "Submitted" ? guideMarkVal : "Pending",
                        panelMarks: panelStatus === "Submitted" ? panelAvg.toFixed(2) : "Pending", // send as string or number? fixed 2 decimal for float
                        total: (guideStatus === "Submitted" ? guideMarkVal : 0) + (panelStatus === "Submitted" ? panelAvg : 0)
                    });
                }
            }
        }

        return results;
    }

    /**
     * 6. Faculty Workload Report
     */
    static async generateFacultyWorkloadReport(filters) {
        const query = {};
        if (filters.school) query.school = filters.school;
        // Faculty school matching

        const facultyList = await Faculty.find(query).lean();
        const results = [];

        for (const f of facultyList) {
            // Count projects as Guide
            const guideCount = await Project.countDocuments({
                guideFaculty: f._id,
                status: "active",
                academicYear: filters.year || filters.academicYear
            });

            // Count panels they are part of
            const panelCount = await Panel.countDocuments({
                "members.faculty": f._id,
                academicYear: filters.year || filters.academicYear
            });

            results.push({
                name: f.name,
                email: f.email,
                designation: f.designation,
                projectsGuided: guideCount,
                panelsAssigned: panelCount,
                totalWorkload: guideCount + panelCount // Simple metric
            });
        }

        return results.sort((a, b) => b.totalWorkload - a.totalWorkload);
    }

    /**
     * 7. Pending Marks Report
     */
    static async generatePendingMarksReport(filters) {
        const statusFilter = filters.status || 'both-pending';
        const query = this._buildMatchQuery(filters);
        delete query.status; // Remove status from mongo query

        const students = await Student.find(query).lean();
        const results = [];

        for (const student of students) {
            const project = await Project.findOne({ students: student._id }).populate("guideFaculty").populate("panel").lean();
            if (!project) continue;

            const marks = await Marks.find({ student: student._id }).lean();
            const hasGuideMark = marks.some(m => m.facultyType === 'guide');
            const hasPanelMark = marks.some(m => m.facultyType === 'panel');

            let status = '';
            if (!hasGuideMark && !hasPanelMark) status = 'Both Pending';
            else if (!hasGuideMark) status = 'Guide Pending';
            else if (!hasPanelMark) status = 'Panel Pending';
            else status = 'Complete';

            // Filter based on requested status
            if (statusFilter === 'guide-pending' && hasGuideMark) continue;
            if (statusFilter === 'panel-pending' && hasPanelMark) continue;
            if (statusFilter === 'both-pending' && (hasGuideMark || hasPanelMark)) continue;
            if (statusFilter === 'complete' && status !== 'Complete') continue;

            if (status !== 'Complete') {
                results.push({
                    regNo: student.regNo,
                    name: student.name,
                    projectTitle: project.name,
                    guide: project.guideFaculty?.name,
                    panel: project.panel?.panelName,
                    pendingStatus: status
                });
            }
        }

        return results;
    }

    /**
     * 8. Marks Distribution Analysis
     */
    static async generateMarksDistributionReport(filters) {
        const query = this._buildMatchQuery(filters);
        // We need effective scores per student, not raw marks
        const marks = await Marks.find(query).lean();

        // Group by student to get effective total score
        const studentScores = {};
        marks.forEach(m => {
            const sid = m.student.toString();
            if (!studentScores[sid]) studentScores[sid] = { reviews: {} };

            if (!studentScores[sid].reviews[m.reviewType]) studentScores[sid].reviews[m.reviewType] = [];
            studentScores[sid].reviews[m.reviewType].push(m);
        });

        let totalStudentsProcessed = 0;
        const distribution = {
            '0-40%': 0,
            '41-60%': 0,
            '61-80%': 0,
            '81-90%': 0,
            '91-100%': 0
        };

        Object.values(studentScores).forEach(studentData => {
            let totalObtained = 0;
            let grandMax = 0;

            Object.values(studentData.reviews).forEach(reviewMarks => {
                const guideMarkParam = reviewMarks.find(r => r.facultyType === 'guide');
                const panelMarksParam = reviewMarks.filter(r => r.facultyType === 'panel');

                let guideScore = guideMarkParam ? (guideMarkParam.totalMarks || 0) : 0;
                let guideMax = guideMarkParam ? (guideMarkParam.maxTotalMarks || 100) : 100;

                let panelScore = 0;
                let panelMax = 0;
                if (panelMarksParam.length > 0) {
                    const pSum = panelMarksParam.reduce((sum, m) => sum + (m.totalMarks || 0), 0);
                    panelScore = pSum / panelMarksParam.length;
                    panelMax = panelMarksParam[0].maxTotalMarks || 100;
                }

                totalObtained += (guideScore + panelScore);
                if (guideMarkParam) grandMax += guideMax;
                if (panelMarksParam.length > 0) grandMax += panelMax;
            });

            if (grandMax > 0) {
                totalStudentsProcessed++;
                const percentage = (totalObtained / grandMax) * 100;

                if (percentage <= 40) distribution['0-40%']++;
                else if (percentage <= 60) distribution['41-60%']++;
                else if (percentage <= 80) distribution['61-80%']++;
                else if (percentage <= 90) distribution['81-90%']++;
                else distribution['91-100%']++;
            }
        });

        // Transform for table
        return Object.entries(distribution).map(([range, count]) => ({
            range,
            count,
            percentageOfStudents: totalStudentsProcessed ? ((count / totalStudentsProcessed) * 100).toFixed(2) + '%' : '0%'
        }));
    }

    /**
     * 9. Student Complete Details
     */
    static async generateStudentCompleteReport(filters) {
        return this.generateComprehensiveMarksReport(filters);
        // Similar to comprehensive but maybe with more contact info?
        // Reusing comprehensive for now as it covers the basics (Reg, Name, Project, Marks)
    }

    // Helper to standardise filters
    static _buildMatchQuery(filters) {
        const query = {};
        if (filters.school) query.school = filters.school;
        if (filters.programme) query.program = filters.programme;
        if (filters.year) query.academicYear = filters.year;

        // Log the constructed query for debugging
        console.log('[REPORT QUERY]', JSON.stringify(query));

        return query;
    }

    /**
     * 10. Faculty Time Sheet
     */
    static async generateTimeSheetReport(filters) {
        const logs = await ActivityLogService.getTimeSheetData(filters);

        // Calculate summary stats
        const totalActions = logs.length;
        const uniqueFaculty = new Set(logs.map(l => l.employeeId)).size;
        const loginCount = logs.filter(l => l.action === 'LOGIN').length;
        const marksEntryCount = logs.filter(l => l.action === 'MARK_ENTRY' || l.action === 'MARK_UPDATE').length;

        const summary = [
            { Metric: 'Total Recorded Actions', Value: totalActions },
            { Metric: 'Unique Faculty Active', Value: uniqueFaculty },
            { Metric: 'Total Logins', Value: loginCount },
            { Metric: 'Marks Entry/Updates', Value: marksEntryCount },
            { Metric: 'Generated At', Value: new Date().toLocaleString() }
        ];

        return {
            summary,
            logs
        };
    }
}
