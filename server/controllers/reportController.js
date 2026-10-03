import { ReportService } from "../services/reportService.js";

export const getReportData = async (req, res) => {
    try {
        const { type, ...filters } = req.query;

        if (!type) {
            return res.status(400).json({
                success: false,
                message: "Report type is required",
            });
        }

        // If user is a project coordinator, scope filters to their context
        // This ensures coordinators can only download reports from their assigned school/program
        if (req.coordinator) {
            filters.school = req.coordinator.school;
            filters.programme = req.coordinator.program;  // Backend uses 'program', frontend uses 'programme'
            // Allow coordinator to filter by year, but default to their assigned year if not provided
            if (!filters.year) {
                filters.year = req.coordinator.academicYear;
            }

            // Log the applied coordinator context for debugging
            console.log(`[COORDINATOR REPORT] User: ${req.user?.name}, School: ${filters.school}, Programme: ${filters.programme}, Year: ${filters.year}`);
        }

        const data = await ReportService.generateReport(type, filters);

        res.status(200).json({
            success: true,
            count: Array.isArray(data) ? data.length : 1,
            data,
        });
    } catch (error) {
        console.error("Report Generation Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to generate report",
        });
    }
};
