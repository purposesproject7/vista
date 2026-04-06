import mongoose from "mongoose";
import dotenv from "dotenv";
import xlsx from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ProjectService } from "../../services/projectService.js";

// Setup directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

// ============================================================================
// CONFIGURATION
// ============================================================================
const PROJECTS_EXCEL_PATH = path.join(__dirname, "Projects_Template (7).xlsx");

const DEFAULT_ACADEMIC_YEAR = "2025-26 WINTER";
const DEFAULT_SCHOOL = "SCOPE";
const DEFAULT_PROGRAM = "M.TECH(FIRST YEAR)";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/vista";

// ============================================================================
// PROJECT UPLOAD FUNCTION
// ============================================================================
async function uploadProjects(SYS_ADMIN_ID) {
    if (!fs.existsSync(PROJECTS_EXCEL_PATH)) {
        console.warn(`⚠️ Projects excel file not found at '${PROJECTS_EXCEL_PATH}'.`);
        return;
    }

    console.log("Reading projects excel file...");
    const workbook = xlsx.readFile(PROJECTS_EXCEL_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
        console.warn("⚠️ No sheet found in the projects file.");
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
            console.warn(
                `[Row ${index + 2}] Missing required columns. Skipping.`
            );
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
            type: type ? type.toLowerCase().trim() : "software",
            guideFacultyEmpId: guideEmpId.toString().trim(),
            students: parsedMembers
        };
    }).filter(Boolean);

    if (newProjectsData.length === 0) {
        console.log("No valid projects found to upload.");
        return;
    }

    console.log(`Starting bulk upload of ${newProjectsData.length} projects...`);
    const results = await ProjectService.bulkCreateProjects(
        newProjectsData,
        SYS_ADMIN_ID
    );

    console.log("\n=================== PROJECT UPLOAD RESULTS ===================");
    console.log(`Total Attempted: ${results.total}`);
    console.log(`Successfully Created: ${results.created}`);
    console.log(`Failed: ${results.failed}`);

    if (results.failed > 0) {
        console.log("\nErrors:");
        results.errors.forEach((err) => {
            console.error(`- ${err.name} (${err.guideFacultyEmpId})`);
            console.error(`  ${err.error}`);
        });
    } else {
        console.log("\nAll projects uploaded successfully!");
    }
}

// ============================================================================
// MAIN
// ============================================================================
async function startUpload() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected successfully to DB.");

        const SYS_ADMIN_ID = new mongoose.Types.ObjectId();

        await uploadProjects(SYS_ADMIN_ID);

        console.log("\nDone!");
    } catch (error) {
        console.error("Unexpected error:");
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
