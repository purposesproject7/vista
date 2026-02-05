import mongoose from "mongoose";
import dotenv from "dotenv";
import Faculty from "./models/facultySchema.js";
import ProjectCoordinator from "./models/projectCoordinatorSchema.js";
import ActivityLogService from "./services/activityLogService.js";
import bcrypt from "bcryptjs";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function reproduce() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");

        // Simulate login
        const emailId = "guide_ppt@test.com"; // Adjust if needed
        const password = "password123";

        console.log(`Attempting login for ${emailId}...`);

        const faculty = await Faculty.findOne({ emailId }).select("+password");

        if (!faculty) {
            console.error("User not found!");
            return;
        }
        console.log("User found:", faculty.emailId);

        const isMatch = await bcrypt.compare(password, faculty.password);
        if (!isMatch) {
            console.error("Password mismatch!");
            return;
        }
        console.log("Password matched.");

        // Simulate Activity Log
        console.log("Attempting to log activity...");
        await ActivityLogService.logActivity(
            faculty._id,
            "LOGIN",
            {
                school: faculty.school,
                program: faculty.program,
                academicYear: "N/A",
            },
            { description: "Faculty logged in" },
            { ip: "127.0.0.1" } // Mock req
        );
        console.log("Activity logged.");

        // Simulate Project Coordinator fetch
        console.log("Checking Project Coordinator status...");
        let isPrimary = false;
        if (faculty.isProjectCoordinator) {
            const coordinatorData = await ProjectCoordinator.findOne({
                faculty: faculty._id,
                isActive: true
            });
            if (coordinatorData) {
                isPrimary = coordinatorData.isPrimary;
            }
        }
        console.log("Project Coordinator check done. Is Primary:", isPrimary);

        console.log("Login flow simulation completed successfully.");

    } catch (error) {
        console.error("CAUGHT ERROR:", error);
    } finally {
        await mongoose.disconnect();
    }
}

reproduce();
