import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Faculty from "./models/facultySchema.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://purposesproject7_db_user:bIiZVirXzT488Gdm@vista-testdb.kjfjv3y.mongodb.net/?appName=Vista-TestDB";

async function debugLogin() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");

        const email = "guide_ppt@test.com"; // The user reporting issues
        const users = await Faculty.find({ emailId: email }).select("+password");

        if (users.length === 0) {
            console.error(`User ${email} NOT FOUND in DB.`);
        } else {
            const user = users[0];
            console.log(`User Found: ${user.name} (${user.role})`);
            console.log(`Stored Hash: ${user.password}`);
            const isMatch = await bcrypt.compare("password123", user.password);
            console.log(`bcrypt.compare("password123", hash) result: ${isMatch}`);

            if (!isMatch) {
                console.log("!!! PASSWORD MISMATCH DETECTED !!!");
                console.log("Resetting password to 'password123'...");
                const newHash = await bcrypt.hash("password123", 10);
                user.password = newHash;
                await user.save();
                console.log("Password reset success.");
            } else {
                console.log("Password is CORRECT. The issue might be Role or Frontend input.");
            }
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

debugLogin();
