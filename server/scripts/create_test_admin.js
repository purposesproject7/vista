
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Faculty from "../models/facultySchema.js";

dotenv.config({ path: "../.env" });
if (!process.env.MONGO_URI) dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function createTestAdmin() {
    try {
        if (!MONGO_URI) {
            console.error("MONGO_URI missing");
            process.exit(1);
        }
        await mongoose.connect(MONGO_URI);

        const email = "admin_fix@vista.com";
        const employeeId = "ADMIN999"; // Non-conflicting ID

        // Cleanup previous failed attempts if any
        await Faculty.deleteOne({ emailId: email });
        await Faculty.deleteOne({ employeeId: employeeId });

        console.log("Creating new test admin...");
        const newAdmin = new Faculty({
            name: "Test Admin Fix",
            emailId: email,
            employeeId: employeeId,
            phoneNumber: "9999999998",
            password: await bcrypt.hash("password123", 10),
            role: "admin",
            school: "ADMIN",
            program: ["N/A"],
            specialization: "Administration"
        });
        await newAdmin.save();

        console.log(`Admin ${email} created successfully.`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

createTestAdmin();
