import ActivityLog from "../models/activityLogSchema.js";
import Faculty from "../models/facultySchema.js";

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

        if (filters.academicYear) query.academicYear = this._exactMatchRegex(filters.academicYear);
        if (filters.school) query.school = this._exactMatchRegex(filters.school);

        const programValue = filters.programme ?? filters.program;
        if (programValue) {
            const programValues = Array.isArray(programValue) ? programValue : [programValue];
            const programRegexes = programValues.map(value => this._exactMatchRegex(value));
            query.program = programRegexes.length === 1 ? programRegexes[0] : { $in: programRegexes };
        }

        if (filters.startDate && filters.endDate) {
            query.createdAt = {
                $gte: new Date(filters.startDate),
                $lte: new Date(filters.endDate),
            };
        }

        // Fetch logs with faculty details
        const logs = await ActivityLog.find(query)
            .populate("faculty", "name employeeId emailId")
            .sort({ createdAt: -1 })
            .lean();

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
        const escaped = String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`^${escaped}$`, "i");
    }
}
