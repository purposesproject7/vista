import ActivityLog from "../models/activityLogSchema.js";
import Faculty from "../models/facultySchema.js";
import Student from "../models/studentSchema.js";
import Project from "../models/projectSchema.js";
import Marks from "../models/marksSchema.js";

export default class ActivityLogService {
    /**
     * Log an activity
     * @param {string} facultyId - ID of the faculty performing action
     * @param {string} action - Enum action type
     * @param {Object} context - { school, program, academicYear }
     * @param {Object} details - { targetId, targetModel, description, meta }
     * @param {Object} req - Express request object (optional, for IP/Agent)
     */
    static async logActivity(facultyId, action, context, details = {}, req = null) {
        try {
            // If context is missing, try to fetch from faculty (fallback)
            // Efficiently, caller should provide it.
            let { school, program, academicYear } = context || {};

            if (!school || !program || !academicYear) {
                const faculty = await Faculty.findById(facultyId).select("school program");
                // Warning: academicYear is usually not on faculty directly unless stored there.
                // If not provided, we might need to assume 'current' or pass it.
                // For now, we assume caller passes it or we log what we have.
                school = school || faculty?.school || "Unknown";
                program = program || faculty?.program || "Unknown";
                academicYear = academicYear || "Unknown"; // Caller should really provide this
            }

            if (Array.isArray(program)) {
                program = program.join(", ");
            } else if (program) {
                program = String(program);
            } else {
                program = "Unknown";
            }

            const logEntry = new ActivityLog({
                faculty: facultyId,
                action,
                school,
                program,
                academicYear,
                details,
                ip: req?.ip || req?.connection?.remoteAddress,
                userAgent: req?.headers?.["user-agent"],
            });

            await logEntry.save();
        } catch (error) {
            console.error("Failed to log activity:", error);
            // Non-blocking: don't crash the main request if logging fails
        }
    }

    /**
     * Generate Time Sheet Report Data
     * Returns data grouped by school/program for the report service
     */
    static async getTimeSheetData(filters) {
        const query = {};

        const year = filters.year || filters.academicYear;
        if (year) query.academicYear = this._exactMatchRegex(year);
        if (filters.school) {
            const schools = Array.isArray(filters.school) ? filters.school : [filters.school];
            query.school = { $in: schools.map(value => this._exactMatchRegex(value)) };
        }

        const programValue = filters.programme ?? filters.program;
        if (programValue) {
            const programValues = Array.isArray(programValue) ? programValue : [programValue];
            const programRegexes = programValues.map(value => this._exactMatchRegex(value));
            query.program = programRegexes.length === 1 ? programRegexes[0] : { $in: programRegexes };
        }

        const dateQuery = {};
        if (filters.startDate && filters.endDate) {
            dateQuery.createdAt = {
                $gte: new Date(filters.startDate),
                $lte: new Date(filters.endDate),
            };
        }

        // Older mark activities were labelled with the faculty's first
        // programme and an Unknown year. Resolve the referenced entity before
        // filtering, so history is readable without rewriting audit records.
        const lookup = (model, localField, as) => ({
            $lookup: { from: model.collection.name, localField, foreignField: "_id", as },
        });
        const logs = await ActivityLog.aggregate([
            { $match: dateQuery },
            lookup(Marks, "details.targetId", "__marks"),
            lookup(Student, "__marks.student", "__markStudents"),
            lookup(Student, "details.targetId", "__students"),
            lookup(Project, "details.targetId", "__projects"),
            { $set: { __context: { $switch: {
                branches: [
                    { case: { $eq: ["$details.targetModel", "Marks"] }, then: {
                        $ifNull: [{ $arrayElemAt: ["$__markStudents", 0] }, { $arrayElemAt: ["$__marks", 0] }],
                    } },
                    { case: { $eq: ["$details.targetModel", "Student"] }, then: { $arrayElemAt: ["$__students", 0] } },
                    { case: { $eq: ["$details.targetModel", "Project"] }, then: { $arrayElemAt: ["$__projects", 0] } },
                ],
                default: null,
            } } } },
            { $set: Object.fromEntries(["school", "program", "academicYear"].map(field => [
                field, { $ifNull: [`$__context.${field}`, `$${field}`] },
            ])) },
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $unset: ["__marks", "__markStudents", "__students", "__projects", "__context"] },
        ]);
        await ActivityLog.populate(logs, { path: "faculty", select: "name employeeId emailId" });

        return logs.map((log) => ({
            date: new Date(log.createdAt).toISOString().split("T")[0],
            time: new Date(log.createdAt).toLocaleTimeString(),
            facultyName: log.faculty?.name || "Unknown",
            employeeId: log.faculty?.employeeId || "N/A",
            action: log.action,
            school: log.school,
            program: log.program,
            description: log.details?.description || "-",
            ip: log.ip || "-",
        }));
    }

    static _exactMatchRegex(value) {
        const escaped = String(value).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`^\\s*${escaped}\\s*$`, "i");
    }
}
