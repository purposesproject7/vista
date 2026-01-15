import Student from "../models/studentSchema.js";
import Faculty from "../models/facultySchema.js";
import Project from "../models/projectSchema.js";
import Marks from "../models/marksSchema.js";
import Panel from "../models/panelSchema.js";
import mongoose from "mongoose";
import { ActivityLogService } from "./activityLogService.js";

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

        const query = { ...queryFilters };
        if (filters.school) query.school = filters.school;
        if (filters.programme) query.program = filters.programme;
        if (filters.year) query.academicYear = filters.year;
        // Note: 'year' in frontend might map to specific query field? Assuming academicYear.
        // Actually typically 'year' filter in frontend often means 'academicYear' in DB, but sometimes 'batch'.
        // Given previous context, let's assume valid fields are passed.

        // Calculate total marks per student
        // Since Marks are stored per reviewer, we typically need the finalized total or list all
        // Let's get students and their total marks.

        // Aggregation to sum marks for students
        const marksData = await Marks.aggregate([
            { $match: { ...this._buildMatchQuery(query) } },
            {
                $group: {
                    _id: "$student",
                    totalScore: { $sum: "$totalMarks" }, // Simple sum? Or average? 
                    // Usually final marks are a specific calculation.
                    // For "Range", let's assume we are looking at individual submission marks OR average.
                    // Let's return the marks entries themselves that fall in range
                }
            }
            // This is tricky without knowing exact grading logic (average of guide+panel?).
            // Let's assume we filter students whose *average* or *any* mark falls in range?
            // Simpler approach: Find marks documents within range.
        ]);

        // Better Approach: Fetch Marks documents directly where totalMarks is within range
        const markQuery = {
            totalMarks: { $gte: min, $lte: max },
            ...this._buildMatchQuery(query)
        };

        const marksList = await Marks.find(markQuery)
            .populate("student", "name regNo")
            .populate("faculty", "name")
            .populate("project", "name")
            .lean();

        return marksList.map(m => ({
            regNo: m.student?.regNo,
            studentName: m.student?.name,
            projectName: m.project?.name,
            facultyName: m.faculty?.name,
            facultyType: m.facultyType,
            marks: m.totalMarks,
            maxMarks: m.maxTotalMarks
        }));
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

        // Optimisation: Fetch all needed marks & projects in one go ideally, 
        // but for simplicity loop or aggregation. Aggregation is better.

        for (const student of students) {
            // Find Project
            const project = await Project.findOne({
                students: student._id,
                status: "active"
            })
                .populate("guideFaculty", "name")
                .populate("panel", "panelName")
                .lean();

            if (!project) continue; // Skip if no active project

            // Find Marks
            const marks = await Marks.find({ student: student._id }).lean();

            const guideMark = marks.find(m => m.facultyType === 'guide');
            const panelMark = marks.find(m => m.facultyType === 'panel');

            results.push({
                regNo: student.regNo,
                name: student.name,
                projectTitle: project.name,
                guideName: project.guideFaculty?.name,
                panelName: project.panel?.panelName,
                guideMarks: guideMark ? guideMark.totalMarks : "Pending",
                panelMarks: panelMark ? panelMark.totalMarks : "Pending",
                total: (guideMark?.totalMarks || 0) + (panelMark?.totalMarks || 0)
                // Note: Logic for total depends on weightage, assuming simple sum for now or just listing components
            });
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
        const marks = await Marks.find(query).select('totalMarks maxTotalMarks facultyType').lean();

        // Buckets for Percentages
        const distribution = {
            '0-40%': 0,
            '41-60%': 0,
            '61-80%': 0,
            '81-90%': 0,
            '91-100%': 0
        };

        marks.forEach(m => {
            const obtained = m.totalMarks || 0;
            const max = m.maxTotalMarks || 100; // Default to 100 if missing, though schema enforces it

            // Calculate percentage
            const percentage = (obtained / max) * 100;

            if (percentage <= 40) distribution['0-40%']++;
            else if (percentage <= 60) distribution['41-60%']++;
            else if (percentage <= 80) distribution['61-80%']++;
            else if (percentage <= 90) distribution['81-90%']++;
            else distribution['91-100%']++;
        });

        // Transform for table
        return Object.entries(distribution).map(([range, count]) => ({
            range,
            count,
            percentageOfStudents: marks.length ? ((count / marks.length) * 100).toFixed(2) + '%' : '0%'
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
