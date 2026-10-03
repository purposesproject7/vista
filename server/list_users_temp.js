import mongoose from "mongoose";
import dotenv from "dotenv";
import Faculty from "./models/facultySchema.js"; // Adjust path if needed

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function listUsers() {
    try {
        if (!MONGO_URI) {
            console.error("MONGO_URI is missing in .env");
            return;
        }
        await mongoose.connect(MONGO_URI);
        const users = await Faculty.find({});
        console.log("USERS_START");
        users.forEach(u => {
            console.log(`Email: ${u.emailId}, Role: ${u.role}, ID: ${u._id}`);
        });
        console.log("USERS_END");
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

listUsers();
