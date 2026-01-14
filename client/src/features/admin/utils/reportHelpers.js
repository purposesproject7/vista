export const processTimeSheetData = (data, workbook, utils) => {
    if (!data || !data.logs) return;

    const { summary, logs } = data;

    // 1. Summary Sheet
    if (summary && summary.length > 0) {
        const summarySheet = utils.json_to_sheet(summary);
        utils.book_append_sheet(workbook, summarySheet, "Summary");
    }

    // 2. Group by School
    const schools = {};
    logs.forEach(log => {
        const schoolName = log.school || "Unknown";
        if (!schools[schoolName]) schools[schoolName] = [];

        // Clean up log object for display
        const { school, program, ...displayLog } = log;
        schools[schoolName].push({
            ...displayLog,
            Program: program // Add program back as column
        });
    });

    // 3. Create Sheet per School
    Object.entries(schools).forEach(([schoolName, schoolLogs]) => {
        // Sanitize sheet name (max 31 chars)
        const sheetName = schoolName.replace(/[:\/\\?*\[\]]/g, "").substring(0, 31);
        const sheet = utils.json_to_sheet(schoolLogs);
        utils.book_append_sheet(workbook, sheet, sheetName);
    });
};
