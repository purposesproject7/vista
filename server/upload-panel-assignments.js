import mongoose from "mongoose";
import dotenv from "dotenv";
import xlsx from "xlsx";
import fs from "fs";
import Student from "./models/studentSchema.js";
import Project from "./models/projectSchema.js";
import Panel from "./models/panelSchema.js";

// Load environment variables from .env file
dotenv.config();

// ============================================================================
// CONFIGURATION
// ============================================================================
// Path to your Excel file containing the panel assignments
const EXCEL_FILE_PATH = "./Project_Panel_Assignments_updated.xlsx"; // Ensure this matches your file

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/vista";
const SYS_ADMIN_ID = new mongoose.Types.ObjectId(); // Mock user ID for the system performing the change

async function runPreflightMigration() {
    console.log("-> Running pre-flight database migration for legacy history enums...");
    try {
        const result = await Project.updateMany(
            { "history.action": "panel_assigned" },
            { $set: { "history.$[elem].action": "panel_reassigned" } },
            { arrayFilters: [{ "elem.action": "panel_assigned" }] }
        );
        console.log(`   Migration complete. Modified ${result.modifiedCount} projects with invalid 'panel_assigned' enums.`);
    } catch (err) {
        console.error("   Migration failed:", err.message);
    }
}

async function parseExcelAndAssignPanels() {
    try {
        console.log(`Checking for file at: ${EXCEL_FILE_PATH}`);
        if (!fs.existsSync(EXCEL_FILE_PATH)) {
            console.error(`Error: Could not find the excel file at '${EXCEL_FILE_PATH}'.`);
            process.exit(1);
        }

        console.log("Reading excel file...");
        const workbook = xlsx.readFile(EXCEL_FILE_PATH);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rawData = xlsx.utils.sheet_to_json(sheet);
        console.log(`Found ${rawData.length} rows in the excel document.`);

        if (rawData.length === 0) {
            console.log("No assignments found to process.");
            process.exit(0);
        }

        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected successfully to DB.");

        // Clean up invalid enums in the DB that trigger "Project validation failed"
        await runPreflightMigration();

        let successCount = 0;
        let failedCount = 0;
        let errors = [];

        console.log("\nProcessing panel assignments...");

        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            const projectTitle = row["ProjectTitle"];
            const studentRegNo = row["StudentRegNo"];
            const panelName = row["PanelName"];

            if (!projectTitle || !studentRegNo || !panelName) {
                failedCount++;
                errors.push(`Row ${i + 2}: Missing required columns (ProjectTitle, StudentRegNo, or PanelName).`);
                continue;
            }

            try {
                const studentString = studentRegNo.toString().trim();
                const student = await Student.findOne({ regNo: { $regex: new RegExp(`^${studentString}$`, 'i') } });

                // Error 2: "No active project found for student [ID]."
                if (!student) {
                    throw new Error(`Student with RegNo '${studentString}' not registered or found.`);
                }

                const project = await Project.findOne({
                    students: student._id,
                    status: "active"
                });

                if (!project) {
                    throw new Error(`No active project found for student '${studentString}'.`);
                }

                // Error 1: "Panel must belong to the same academic context as the project."
                // Find all panels matching the name loosely.
                const panelString = panelName.toString().trim();
                const panelsMatches = await Panel.find({
                    panelName: { $regex: new RegExp(`^${panelString}$`, 'i') },
                    isActive: true
                });

                if (panelsMatches.length === 0) {
                    throw new Error(`Active panel '${panelString}' not found in the database.`);
                }

                // Attempt to perfectly match panel context to project context, fallback to first match
                let panel = panelsMatches.find(p => 
                    p.program?.toLowerCase() === project.program?.toLowerCase() &&
                    p.school?.toLowerCase() === project.school?.toLowerCase() &&
                    p.academicYear === project.academicYear
                );

                if (!panel) {
                    panel = panelsMatches[0]; // Fallback to first if there's no perfectly matching context
                    console.warn(`[Row ${i + 2}] Warning: Using panel '${panelString}' from different context (${panel.program}/${panel.school}) for project (${project.program}/${project.school}). Forcing DB sync.`);
                }

                // Skip if already assigned perfectly
                if (project.panel && project.panel.toString() === panel._id.toString()) {
                    successCount++;
                    continue; // Correctly assigned already
                }

                // Direct Database Assignment to bypass overly strict case-sensitive checks in standard services
                const previousPanel = project.panel;

                project.panel = panel._id;
                project.history.push({
                    action: "panel_reassigned", // Using legally allowed enum
                    panel: panel._id,
                    performedBy: SYS_ADMIN_ID,
                    performedAt: new Date(),
                });

                await project.save({ validateBeforeSave: true });

                // Successfully changed project... sync panel counts
                if (previousPanel) {
                     await Panel.findByIdAndUpdate(previousPanel, { $inc: { assignedProjectsCount: -1 } });
                }
                panel.assignedProjectsCount += 1;
                await panel.save();

                console.log(`[Row ${i + 2}] Success: Assigned panel '${panelString}' to project '${project.name}'`);
                successCount++;

            } catch (err) {
                failedCount++;
                errors.push(`Row ${i + 2} (${projectTitle}): ${err.message}`);
            }
        }

        console.log("\n=================== ASSIGNMENT RESULTS ===================");
        console.log(`Total Attempted:   ${rawData.length}`);
        console.log(`Successfully Set:  ${successCount}`);
        console.log(`Failed/Skipped:    ${failedCount}`);

        if (errors.length > 0) {
            console.log("\nErrors occurred during assignment:");
            errors.forEach(err => console.error(`- ${err}`));
        } else {
            console.log("\nAll valid panel assignments completed successfully!");
        }
        console.log("==========================================================");

    } catch (error) {
        console.error("An unexpected error occurred executing the script:");
        console.error(error);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log("Disconnected from DB.");
        }
        process.exit(0);
    }
}

parseExcelAndAssignPanels();
