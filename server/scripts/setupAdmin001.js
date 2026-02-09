import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

// Models
import Faculty from "../models/facultySchema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

import dns from "dns";
// Fix for "querySrv ECONNREFUSED" error with MongoDB Atlas
try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (err) {
    console.warn("Failed to set DNS servers:", err.message);
}

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const createOrUpdateAdmin001 = async () => {
    await connectDB();

    try {
        // Read admin credentials from .env
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const adminName = process.env.ADMIN_NAME || "Main Admin";
        const adminEmployeeId = process.env.ADMIN_EMPLOYEE_ID || "ADMIN001";
        const adminSchool = process.env.ADMIN_SCHOOL || "SCOPE";
        const adminDepartment = process.env.ADMIN_DEPARTMENT || "CSE";

        // Validate required fields
        if (!adminEmail || !adminPassword) {
            console.error("ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env file");
            process.exit(1);
        }

        console.log("\n=== Creating/Updating ADMIN001 ===");
        console.log(`Email: ${adminEmail}`);
        console.log(`Employee ID: ${adminEmployeeId}`);
        console.log(`Name: ${adminName}`);
        console.log(`School: ${adminSchool}`);
        console.log(`Department: ${adminDepartment}`);
        console.log("================================\n");

        // Hash the password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Create/Update admin data
        const adminData = {
            name: adminName,
            emailId: adminEmail,
            employeeId: adminEmployeeId,
            phoneNumber: "9999999999", // Default phone number
            password: hashedPassword,
            role: "admin",
            school: adminSchool,
            program: adminDepartment,
            specialization: "",
            isActive: true,
            isProjectCoordinator: false,
        };

        // Use findOneAndUpdate with upsert to create or overwrite
        const admin = await Faculty.findOneAndUpdate(
            { employeeId: adminEmployeeId }, // Find by employee ID
            { $set: adminData }, // Set all fields
            {
                new: true, // Return the updated document
                upsert: true, // Create if doesn't exist
                runValidators: true // Run schema validators
            }
        );

        console.log("✅ SUCCESS: ADMIN001 created/updated successfully!");
        console.log(`   ID: ${admin._id}`);
        console.log(`   Email: ${admin.emailId}`);
        console.log(`   Employee ID: ${admin.employeeId}`);
        console.log(`   Name: ${admin.name}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   School: ${admin.school}`);
        console.log("\n✅ You can now login with:");
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
        console.log("\n");

        process.exit(0);
    } catch (error) {
        console.error("❌ ERROR: Failed to create/update ADMIN001");
        console.error(error);
        process.exit(1);
    }
};

// Run the script
createOrUpdateAdmin001();
