import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

// Import Models
import Faculty from "../models/facultySchema.js";
import Project from "../models/projectSchema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const fixDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for Repair...");

        // 1. DROP INDEXES
        console.log("Dropping Faculty Indexes...");
        try { await Faculty.collection.dropIndexes(); } catch (e) { console.log("Faculty indexes drop error (ignorable):", e.message); }

        console.log("Dropping Project Indexes...");
        try { await Project.collection.dropIndexes(); } catch (e) { console.log("Project indexes drop error (ignorable):", e.message); }

        // 2. CREATE ADMIN
        const adminPass = await bcrypt.hash("Vitadmin@123", 10);
        const admin = await Faculty.findOneAndUpdate(
            { emailId: "admin@vit.ac.in" },
            {
                $set: {
                    name: "System Admin",
                    role: "admin",
                    school: "SCOPE",
                    program: "B.Tech CSE",
                    password: adminPass,
                    employeeId: "ADMIN001",
                    phoneNumber: "9999999999",
                    isActive: true
                }
            },
            { upsert: true, new: true }
        );
        console.log(`✅ Admin Fixed: ${admin.emailId} / Vitadmin@123`);

        // 3. CREATE FACULTY 1
        const facultyPass = await bcrypt.hash("password123", 10);
        const faculty1 = await Faculty.findOneAndUpdate(
            { emailId: "faculty1@test.com" },
            {
                $set: {
                    name: "Dr. Faculty One",
                    role: "faculty",
                    school: "School of Computing",
                    program: "B.Tech Computer Science and Engineering",
                    password: facultyPass,
                    employeeId: "1001",
                    phoneNumber: "9999999991",
                    isActive: true
                }
            },
            { upsert: true, new: true }
        );
        console.log(`✅ Faculty1 Fixed: ${faculty1.emailId} / password123`);

    } catch (err) {
        console.error("Critical Error during fix:", err);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

fixDatabase();
