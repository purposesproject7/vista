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

        // LIST ALL USERS
        const allUsers = await Faculty.find({});
        console.log(`Total users found: ${allUsers.length}`);

        if (allUsers.length === 0) {
            console.log("Database is empty!");
        } else {
            console.log("Listing first 5 users:");
            allUsers.slice(0, 5).forEach(u => {
                console.log(`- Email: "${u.emailId}", Role: ${u.role}, ID: ${u._id}`);
            });
        }

        // Original check
        const email = "guide_ppt@test.com"; // The user reporting issues
        const users = await Faculty.find({ emailId: email }).select("+password");

        if (users.length === 0) {
            console.error(`\nUser ${email} NOT FOUND in DB.`);
        } else {
            const user = users[0];
            console.log(`\nUser Found: ${user.name} (${user.role})`);
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
