import mongoose from "mongoose";
import dotenv from "dotenv";
import Request from "../../models/requestSchema.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

async function clearRequests() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear all requests
    const result = await Request.deleteMany({});
    console.log(`Deleted ${result.deletedCount} requests.`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

clearRequests();
