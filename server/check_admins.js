
import mongoose from "mongoose";
import dotenv from "dotenv";
import Faculty from "./models/facultySchema.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function checkAdmins() {
    try {
        if (!MONGO_URI) {
            console.error("MONGO_URI missing");
            process.exit(1);
        }
        await mongoose.connect(MONGO_URI);
        const admins = await Faculty.find({ role: "admin" });
        console.log(`ADMINS_FOUND: ${admins.length}`);
        admins.forEach(a => console.log(`- ${a.emailId}`));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkAdmins();
