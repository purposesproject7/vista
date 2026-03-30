import mongoose from "mongoose";
import dotenv from "dotenv";
import xlsx from "xlsx";
import fs from "fs";
import { ProjectService } from "./services/projectService.js";

// Load environment variables from .env file
dotenv.config();

// ============================================================================
// CONFIGURATION
// ============================================================================
// Path to your Excel file containing the new projects
const EXCEL_FILE_PATH = "./Projects_Clean_Final.xlsx"; // Replace with your actual file path

// Since the Excel file only has these columns:
// [Name, Guide Faculty Emp ID, Team Members, Type, Specialization]
// These common details need to be defined for the entire batch:
const DEFAULT_ACADEMIC_YEAR = "2024-2025";
const DEFAULT_SCHOOL = "SCOPE";
const DEFAULT_PROGRAM = "B.Tech Computer Science and Engineering";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/vista";

async function parseExcelAndUpload() {
    try {
        console.log(`Checking for file at: ${EXCEL_FILE_PATH}`);
        if (!fs.existsSync(EXCEL_FILE_PATH)) {
            console.error(`Error: Could not find the excel file at '${EXCEL_FILE_PATH}'.`);
            console.error("Please ensure the file exists or update 'EXCEL_FILE_PATH' in this script.");
            process.exit(1);
        }

        console.log("Reading excel file...");
        const workbook = xlsx.readFile(EXCEL_FILE_PATH);
        const sheetName = workbook.SheetNames[0]; // Take the first sheet
        const sheet = workbook.Sheets[sheetName];

        // Parse to JSON
        const rawData = xlsx.utils.sheet_to_json(sheet);
        console.log(`Found ${rawData.length} rows in the excel document.`);

        const newProjectsData = rawData.map((row, index) => {
            // Mapping exactly to your column names
            // Adjust if the column names have extra spaces or different casing
            const name = row["Name"];
            const guideEmpId = row["Guide Faculty Emp ID"];
            const teamMembersStr = row["Team Members"];
            const type = row["Type"];
            const specialization = row["Specialization"];

            if (!name || !guideEmpId || !teamMembersStr) {
                console.warn(`[Row ${index + 2}] Warning: Missing required columns (Name, Guide Faculty Emp ID, or Team Members). Skipping.`);
                return null;
            }

            // Parse Team Members (Assuming they are separated by commas, spaces, or both)
            // e.g. "21BCE0001, 21BCE0002" or "21BCE0001 21BCE0002"
            const parsedMembers = teamMembersStr
                .toString()
                .split(/[\s,]+/) // Split by commas or whitespace
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
        }).filter(Boolean); // Remove skipped rows

        if (newProjectsData.length === 0) {
            console.log("No valid projects found to upload.");
            process.exit(0);
        }

        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected successfully to DB.");

        console.log(`Starting bulk upload of ${newProjectsData.length} formatted projects...`);

        const SYS_ADMIN_ID = new mongoose.Types.ObjectId();
        const results = await ProjectService.bulkCreateProjects(newProjectsData, SYS_ADMIN_ID);

        console.log("\n=================== UPLOAD RESULTS ===================");
        console.log(`Total Attempted: ${results.total}`);
        console.log(`Successfully Created: ${results.created}`);
        console.log(`Failed: ${results.failed}`);

        if (results.failed > 0) {
            console.log("\nErrors occurred during upload:");
            results.errors.forEach((err) => {
                console.error(`- Project: '${err.name}' | Guide: ${err.guideFacultyEmpId} | Students: ${err.teamMembers?.join(', ')}`);
                console.error(`  Error: ${err.error}`);
            });
        } else {
            console.log("\nAll projects uploaded successfully!");
        }
        console.log("======================================================");

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

parseExcelAndUpload();
