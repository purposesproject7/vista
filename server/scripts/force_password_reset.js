import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import Faculty from "../models/facultySchema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected for Password Reset...");

        const email = "faculty1@test.com";
        const newPassword = "password123";
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const faculty = await Faculty.findOne({ emailId: email });
        if (!faculty) {
            console.error(`User ${email} not found! Run the seed script first.`);
            process.exit(1);
        }

        faculty.password = hashedPassword;
        await faculty.save();

        console.log(`✅ Password for ${email} has been forcefully RESET to: ${newPassword}`);

    } catch (err) {
        console.error("Error resetting password:", err);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

resetPassword();
