import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
// import xlsx from "xlsx"; // Commented out for hardcoded mode
import Student from "./models/studentSchema.js";
import Project from "./models/projectSchema.js";
import Panel from "./models/panelSchema.js";

// Load environment variables from .env file
dotenv.config();

// ============================================================================
// CONFIGURATION
// ============================================================================
/*
const EXCEL_FILE_PATH = "./Project_Panel_Assignments_updated.xlsx";
*/

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

async function assignHardcodedPanels() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected successfully to DB.");

        await runPreflightMigration();

        // ---------------------------------------------------------
        // HARDCODED DATA OVERRIDE
        // ---------------------------------------------------------
        const rawData = [
            // Group 1
            { StudentRegNo: "25BEC1047", PanelName: "OM KUMAR C U & MERCY RAJASELVI BEAULAH P" },
            { StudentRegNo: "25BRS1218", PanelName: "OM KUMAR C U & MERCY RAJASELVI BEAULAH P" },
            { StudentRegNo: "25BRS1215", PanelName: "OM KUMAR C U & MERCY RAJASELVI BEAULAH P" },
            { StudentRegNo: "25BMH1078", PanelName: "OM KUMAR C U & MERCY RAJASELVI BEAULAH P" },
            { StudentRegNo: "25BRS1217", PanelName: "OM KUMAR C U & MERCY RAJASELVI BEAULAH P" },

            // Group 2
            { StudentRegNo: "25BEL1017", PanelName: "OM KUMAR C U & MERCY RAJASELVI BEAULAH P" },
            { StudentRegNo: "25BME1272", PanelName: "OM KUMAR C U & MERCY RAJASELVI BEAULAH P" },
            { StudentRegNo: "25BDS1224", PanelName: "OM KUMAR C U & MERCY RAJASELVI BEAULAH P" },
            { StudentRegNo: "25BDS1225", PanelName: "OM KUMAR C U & MERCY RAJASELVI BEAULAH P" },
            { StudentRegNo: "25BDS1223", PanelName: "OM KUMAR C U & MERCY RAJASELVI BEAULAH P" },

            // Group 3
            { StudentRegNo: "25BLC1365", PanelName: "OM KUMAR C U & MERCY RAJASELVI BEAULAH P" },
            { StudentRegNo: "25BCE5448", PanelName: "OM KUMAR C U & MERCY RAJASELVI BEAULAH P" },
            { StudentRegNo: "25BCE5447", PanelName: "OM KUMAR C U & MERCY RAJASELVI BEAULAH P" },
            { StudentRegNo: "25BCE5446", PanelName: "OM KUMAR C U & MERCY RAJASELVI BEAULAH P" },
            { StudentRegNo: "25BCE5445", PanelName: "OM KUMAR C U & MERCY RAJASELVI BEAULAH P" },

            // Group 4
            { StudentRegNo: "25BRS1342", PanelName: "GANESH M & MOHD IMRAN IDRISI" },
            { StudentRegNo: "25BRS1341", PanelName: "GANESH M & MOHD IMRAN IDRISI" },
            { StudentRegNo: "25BRS1343", PanelName: "GANESH M & MOHD IMRAN IDRISI" },
            { StudentRegNo: "25BEC1105", PanelName: "GANESH M & MOHD IMRAN IDRISI" },
            { StudentRegNo: "25BMH1118", PanelName: "GANESH M & MOHD IMRAN IDRISI" },
        ];

        /*
        // ORIGINAL EXCEL LOGIC (Commented out):
        const workbook = xlsx.readFile(EXCEL_FILE_PATH);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        let rawData = xlsx.utils.sheet_to_json(sheet);
        */

        if (rawData.length === 0) {
            console.log("No assignments found to process.");
            process.exit(0);
        }

        let successCount = 0;
        let failedCount = 0;
        let errors = [];

        console.log(`\nProcessing ${rawData.length} hardcoded panel assignments...`);

        // We use a Set to track processed project IDs to avoid duplicate assignment/counters
        const processedProjectIds = new Set();

        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            const studentRegNo = row["StudentRegNo"];
            const panelName = row["PanelName"];

            if (!studentRegNo || !panelName) {
                failedCount++;
                errors.push(`Row ${i + 1}: Missing required columns.`);
                continue;
            }

            try {
                const studentString = studentRegNo.toString().trim();
                const student = await Student.findOne({ regNo: { $regex: new RegExp(`^${studentString}$`, 'i') } });

                if (!student) {
                    console.warn(`[Row ${i + 1}] Warning: Student with RegNo '${studentString}' not registered or found. Skipping...`);
                    // We don't throw an error because other students in the same team might be registered!
                    continue;
                }

                const project = await Project.findOne({
                    students: student._id,
                    status: "active"
                });

                if (!project) {
                    throw new Error(`No active project found for student '${studentString}'.`);
                }

                // If we already successfully fixed this project using another student in the team, skip it.
                if (processedProjectIds.has(project._id.toString())) {
                    console.log(`[Row ${i + 1}] Skipped: Project '${project.name}' was already updated in this run.`);
                    continue;
                }

                const panelString = panelName.toString().trim();
                const panelsMatches = await Panel.find({
                    panelName: { $regex: new RegExp(`^${panelString}$`, 'i') },
                    isActive: true
                });

                if (panelsMatches.length === 0) {
                    throw new Error(`Active panel '${panelString}' not found in the database.`);
                }

                // Since these are missing records, apply the panel immediately 
                // using the first match (ignoring context checks intentionally)
                let panel = panelsMatches[0];

                // Skip if already assigned perfectly
                if (project.panel && project.panel.toString() === panel._id.toString()) {
                    console.log(`[Row ${i + 1}] Skipped: Project '${project.name}' is already internally assigned to panel '${panelString}'.`);
                    processedProjectIds.add(project._id.toString());
                    continue; // Correctly assigned already
                }

                // Direct Database Assignment
                const previousPanel = project.panel;

                project.panel = panel._id;
                project.history.push({
                    action: "panel_reassigned", // Using legally allowed enum
                    panel: panel._id,
                    performedBy: SYS_ADMIN_ID,
                    performedAt: new Date(),
                });

                await project.save({ validateBeforeSave: true });

                // Sync panel counts safely
                if (previousPanel) {
                    await Panel.findByIdAndUpdate(previousPanel, { $inc: { assignedProjectsCount: -1 } });
                }
                panel.assignedProjectsCount += 1;
                await panel.save();

                processedProjectIds.add(project._id.toString());
                console.log(`[Row ${i + 1}] Success: Assigned panel '${panelString}' to project '${project.name}' (Matched via Student: ${studentString})`);
                successCount++;

            } catch (err) {
                failedCount++;
                errors.push(`Row ${i + 1} (${studentRegNo}): ${err.message}`);
            }
        }

        console.log("\n=================== ASSIGNMENT RESULTS ===================");
        console.log(`Total Expected Student Checks: ${rawData.length}`);
        console.log(`Successfully Fixed Projects:   ${successCount}`);
        console.log(`Failed Project Lookups:        ${failedCount}`);

        if (errors.length > 0) {
            console.log("\nErrors occurred during assignment:");
            errors.forEach(err => console.error(`- ${err}`));
        } else {
            console.log("\nAll valid hardcoded panel assignments completed successfully!");
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

assignHardcodedPanels();
