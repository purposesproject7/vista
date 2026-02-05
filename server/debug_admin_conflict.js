
import mongoose from "mongoose";
import dotenv from "dotenv";
import Faculty from "./models/facultySchema.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function checkConflict() {
    try {
        if (!MONGO_URI) {
            console.error("MONGO_URI missing");
            process.exit(1);
        }
        await mongoose.connect(MONGO_URI);

        const u = await Faculty.findOne({ employeeId: "ADMIN001" });
        if (u) {
            console.log(`CONFLICT_USER: ${u.emailId} (${u.role}) _id:${u._id}`);
        } else {
            console.log("No user found with employeeId ADMIN001");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkConflict();
