import mongoose from "mongoose";
import dotenv from "dotenv";
import xlsx from "xlsx";
import fs from "fs";
import { ProjectService } from "../../services/projectService.js";
import { PanelService } from "../../services/panelService.js";

// Load environment variables from .env file
dotenv.config();

// ============================================================================
// CONFIGURATION
// ============================================================================
// Paths to the individual Excel files containing the new projects and panels
const PROJECTS_EXCEL_PATH = "./Projects_Template (7).xlsx";
const PANELS_EXCEL_PATH = "./panel_upload_template (8).xlsx";

const DEFAULT_ACADEMIC_YEAR = "2025-26 WINTER";
const DEFAULT_SCHOOL = "SCOPE";
const DEFAULT_PROGRAM = "M.TECH(FIRST YEAR)";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/vista";

async function uploadProjects(SYS_ADMIN_ID) {
    if (!fs.existsSync(PROJECTS_EXCEL_PATH)) {
        console.warn(`⚠️ Projects excel file not found at '${PROJECTS_EXCEL_PATH}'. Skipping projects upload.`);
        return;
    }

    console.log("Reading projects excel file...");
    const workbook = xlsx.readFile(PROJECTS_EXCEL_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
        console.warn("⚠️ No sheet found in the projects file. Skipping.");
        return;
    }

    const rawData = xlsx.utils.sheet_to_json(sheet);
    console.log(`\nFound ${rawData.length} rows in projects sheet.`);

    const newProjectsData = rawData.map((row, index) => {
        const name = row["name"];
        const guideEmpId = row["guideFacultyEmpId"];
        const teamMembersStr = row["teamMembers"];
        const type = row["type"];
        const specialization = row["specialization"];

        if (!name || !guideEmpId || !teamMembersStr) {
            console.warn(`[Row ${index + 2}] Warning: Missing required columns (name, guideFacultyEmpId, or teamMembers). Skipping.`);
            return null;
        }

        const parsedMembers = teamMembersStr
            .toString()
            .split(/[\s,]+/)
            .map(reg => reg.trim())
            .filter(reg => reg.length > 0)
            .map(reg => ({ regNo: reg }));

        return {
            name: name.trim(),
            academicYear: DEFAULT_ACADEMIC_YEAR,
            school: DEFAULT_SCHOOL,
            program: DEFAULT_PROGRAM,
            specialization: specialization ? specialization.trim() : "",
            type: type ? type.toString().toLowerCase().trim() : "software",
            guideFacultyEmpId: guideEmpId.toString().trim(),
            students: parsedMembers
        };
    }).filter(Boolean);

    if (newProjectsData.length === 0) {
        console.log("No valid projects found to upload.");
        return;
    }

    console.log(`Starting bulk upload of ${newProjectsData.length} projects...`);
    const results = await ProjectService.bulkCreateProjects(newProjectsData, SYS_ADMIN_ID);

    console.log("\n=================== PROJECT UPLOAD RESULTS ===================");
    console.log(`Total Attempted: ${results.total}`);
    console.log(`Successfully Created: ${results.created}`);
    console.log(`Failed: ${results.failed}`);

    if (results.failed > 0) {
        console.log("\nErrors occurred during project upload:");
        results.errors.forEach((err) => {
            console.error(`- Project: '${err.name}' | Guide: ${err.guideFacultyEmpId}`);
            console.error(`  Error: ${err.error}`);
        });
    } else {
        console.log("\nAll projects uploaded successfully!");
    }
}

async function uploadPanels(SYS_ADMIN_ID) {
    if (!fs.existsSync(PANELS_EXCEL_PATH)) {
        console.warn(`⚠️ Panels excel file not found at '${PANELS_EXCEL_PATH}'. Skipping panels upload.`);
        return;
    }

    console.log("Reading panels excel file...");
    const workbook = xlsx.readFile(PANELS_EXCEL_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
        console.warn("⚠️ No sheet found in the panels file. Skipping.");
        return;
    }

    const rawData = xlsx.utils.sheet_to_json(sheet);
    console.log(`\nFound ${rawData.length} rows in panels sheet.`);

    let successCount = 0;
    let failedCount = 0;
    const errors = [];

    for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const panelName = row["Panel Name"];
        const fac1 = row["Faculty Employee ID 1"];
        const fac2 = row["Faculty Employee ID 2"];
        const specsStr = row["Specializations"];

        if (!panelName || !fac1) {
            failedCount++;
            errors.push(`Row ${i + 2}: Missing required 'Panel Name' or 'Faculty Employee ID 1'`);
            continue;
        }

        const memberEmployeeIds = [fac1.toString().trim()];
        if (fac2) {
            memberEmployeeIds.push(fac2.toString().trim());
        }

        let specializations = [];
        if (specsStr) {
            specializations = specsStr
                .toString()
                .split(/[\s,]+/)
                .map(s => s.trim())
                .filter(s => s.length > 0);
        }

        try {
            await PanelService.createPanel(
                {
                    panelName: panelName.toString().trim(),
                    memberEmployeeIds,
                    academicYear: DEFAULT_ACADEMIC_YEAR,
                    school: DEFAULT_SCHOOL,
                    program: DEFAULT_PROGRAM,
                    specializations,
                    venue: "TBD", // default value
                },
                SYS_ADMIN_ID
            );
            successCount++;
        } catch (error) {
            failedCount++;
            errors.push(`Row ${i + 2} (${panelName}): ${error.message}`);
        }
    }

    console.log("\n=================== PANEL UPLOAD RESULTS ===================");
    console.log(`Total Attempted: ${rawData.length}`);
    console.log(`Successfully Created: ${successCount}`);
    console.log(`Failed: ${failedCount}`);

    if (errors.length > 0) {
        console.log("\nErrors occurred during panel upload:");
        errors.forEach(err => console.error(`- ${err}`));
    } else {
        console.log("\nAll panels uploaded successfully!");
    }
}

async function startUpload() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected successfully to DB.");

        const SYS_ADMIN_ID = new mongoose.Types.ObjectId();

        await uploadProjects(SYS_ADMIN_ID);
        await uploadPanels(SYS_ADMIN_ID);

        console.log("\nDone!");

    } catch (error) {
        console.error("An unexpected error occurred executing the upload script:");
        console.error(error);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log("Disconnected from DB.");
        }
        process.exit(0);
    }
}

startUpload();
