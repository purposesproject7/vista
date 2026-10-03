
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Faculty from "../models/facultySchema.js"; // Adjust path since this is in scripts/

dotenv.config({ path: "../.env" }); // Try to load from parent

// Fallback if path relative to CWD (server root) is needed when running from server root
if (!process.env.MONGO_URI) {
    dotenv.config();
}

const MONGO_URI = process.env.MONGO_URI;

async function createDebugUser() {
    try {
        if (!MONGO_URI) {
            console.error("MONGO_URI is missing. Make sure to run this from the server directory or set the path correctly.");
            process.exit(1);
        }

        console.log("Connecting to DB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");

        const email = "guide_ppt@test.com";

        // Check if exists
        const existing = await Faculty.findOne({ emailId: email });
        if (existing) {
            console.log(`User ${email} already exists. Updating password...`);
            existing.password = await bcrypt.hash("password123", 10);
            await existing.save();
            console.log("Password updated.");
            return;
        }

        // Create new
        const hashedPassword = await bcrypt.hash("password123", 10);

        const newUser = new Faculty({
            name: "Test Guide PPT",
            emailId: email,
            employeeId: "TEST001",
            phoneNumber: "9876543210",
            password: hashedPassword,
            role: "faculty",
            school: "SCOPE",
            isProjectCoordinator: false,
            program: ["B.Tech CSE"],
            specialization: "Testing"
        });

        await newUser.save();
        console.log(`User ${email} created successfully.`);

    } catch (error) {
        console.error("Error creating user:", error);
    } finally {
        await mongoose.disconnect();
    }
}

createDebugUser();
