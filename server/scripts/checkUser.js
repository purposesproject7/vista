import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import Faculty from "../models/facultySchema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log("Connected to DB");

        const email = "guide_ppt@test.com";
        const faculty = await Faculty.findOne({ emailId: email });

        if (!faculty) {
            console.log(`❌ User ${email} NOT FOUND in database.`);
        } else {
            console.log(`✅ User ${email} found.`);
            console.log(`   ID: ${faculty._id}`);
            console.log(`   EmployeeID: ${faculty.employeeId}`);
            console.log(`   Hash: ${faculty.password ? faculty.password.substring(0, 10) + "..." : "MISSING"}`);

            const isMatch = await bcrypt.compare("password123", faculty.password);
            console.log(`   Password 'password123' match: ${isMatch ? "YES" : "NO"}`);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

checkUser();
