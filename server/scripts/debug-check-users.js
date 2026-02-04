import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Faculty from "../models/facultySchema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const targetEmails = ["admin@vit.ac.in", "faculty1@test.com", "faculty2@test.com"];
        const users = await Faculty.find({ emailId: { $in: targetEmails } });
        console.log(`Found ${users.length} matching users:`);
        users.forEach(u => {
            console.log(`- ${u.name} (${u.emailId}) Role: ${u.role} [Hash: ${u.password ? 'Yes' : 'No'}]`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error listing users:", error);
    }
};

listUsers();
