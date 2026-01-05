import mongoose from "mongoose";
import dotenv from "dotenv";
import BroadcastMessage from "../models/broadcastMessageSchema.js";

dotenv.config();

async function checkBroadcasts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const now = new Date();
    
    // Check all active broadcasts
    const activeBlockingBroadcasts = await BroadcastMessage.find({
      action: "block",
      isActive: true,
      expiresAt: { $gt: now },
    });

    console.log("\n=== Active Blocking Broadcasts ===");
    if (activeBlockingBroadcasts.length === 0) {
      console.log("No active blocking broadcasts found.");
    } else {
      activeBlockingBroadcasts.forEach((broadcast, index) => {
        console.log(`\nBroadcast ${index + 1}:`);
        console.log(`  ID: ${broadcast._id}`);
        console.log(`  Title: ${broadcast.title}`);
        console.log(`  Action: ${broadcast.action}`);
        console.log(`  Is Active: ${broadcast.isActive}`);
        console.log(`  Expires At: ${broadcast.expiresAt}`);
        console.log(`  Target Schools: ${JSON.stringify(broadcast.targetSchools)}`);
        console.log(`  Target Departments: ${JSON.stringify(broadcast.targetDepartments)}`);
      });
    }

    // Check all broadcasts (including inactive)
    const allBroadcasts = await BroadcastMessage.find({});
    console.log(`\n\nTotal broadcasts in database: ${allBroadcasts.length}`);

    await mongoose.connection.close();
    console.log("\nConnection closed");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

checkBroadcasts();
