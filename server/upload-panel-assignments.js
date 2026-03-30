import mongoose from "mongoose";
import dotenv from "dotenv";
import xlsx from "xlsx";
import fs from "fs";
import { ProjectService } from "./services/projectService.js";
import Student from "./models/studentSchema.js";
import Project from "./models/projectSchema.js";
import Panel from "./models/panelSchema.js";

// Load environment variables from .env file
dotenv.config();

// ============================================================================
// CONFIGURATION
// ============================================================================
// Path to your Excel file containing the panel assignments
const EXCEL_FILE_PATH = "./Project_Panel_Assignments.xlsx"; // Replace with your actual file path

// IMPORTANT Context: Panels are strictly tied to specific academic programs
const DEFAULT_ACADEMIC_YEAR = "2025-2026 WINTER";
const DEFAULT_SCHOOL = "SCOPE";
const DEFAULT_PROGRAM = "MD";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/vista";
const SYS_ADMIN_ID = new mongoose.Types.ObjectId(); // Mock user ID for the system performing the change

async function parseExcelAndAssignPanels() {
    try {
        console.log(`Checking for file at: ${EXCEL_FILE_PATH}`);
        if (!fs.existsSync(EXCEL_FILE_PATH)) {
            console.error(`Error: Could not find the excel file at '${EXCEL_FILE_PATH}'.`);
            console.error("Please ensure the file exists or update 'EXCEL_FILE_PATH' in this script.");
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

        let successCount = 0;
        let failedCount = 0;
        let errors = [];

        console.log("Processing panel assignments...");

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
                // 1. Resolve Student first, as RegNo provides strict uniqueness
                const studentString = studentRegNo.toString().trim();
                const student = await Student.findOne({ regNo: studentString });

                if (!student) {
                    throw new Error(`Student with RegNo '${studentString}' not found.`);
                }

                // 2. Find the active project containing this student
                // We also strictly ensure the name loosely matches just in case
                const project = await Project.findOne({
                    students: student._id,
                    status: "active"
                });

                if (!project) {
                    throw new Error(`No active project found for student '${studentString}'.`);
                }

                if (project.name.trim().toLowerCase() !== projectTitle.toString().trim().toLowerCase()) {
                    console.warn(`[Row ${i + 2}] Warning: Project title in DB ('${project.name}') differs from Excel ('${projectTitle}'). Proceeding anyway as student matches.`);
                }

                // 3. Resolve the exact Panel by Name + Academic Context
                const panelString = panelName.toString().trim();
                const panel = await Panel.findOne({
                    panelName: panelString,
                    academicYear: DEFAULT_ACADEMIC_YEAR,
                    school: DEFAULT_SCHOOL,
                    // If your database stores program strictly in certain casing, use REGEX
                    program: new RegExp(`^${DEFAULT_PROGRAM}$`, 'i'),
                    isActive: true
                });

                if (!panel) {
                    throw new Error(`Active panel '${panelString}' not found for context Program: ${DEFAULT_PROGRAM}, Year: ${DEFAULT_ACADEMIC_YEAR}`);
                }

                // Skip if already assigned perfectly
                if (project.panel && project.panel.toString() === panel._id.toString()) {
                    console.log(`[Row ${i + 2}] Skipped: Project '${project.name}' is already assigned to panel '${panelString}'.`);
                    successCount++;
                    continue; // Correctly assigned already
                }

                // 4. Safely trigger the backend method native to the application
                await ProjectService.assignPanelToProject(
                    project._id.toString(),
                    panel._id.toString(),
                    SYS_ADMIN_ID
                );

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
