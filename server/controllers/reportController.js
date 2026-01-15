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
