import mongoose from "mongoose";
import dotenv from "dotenv";
import Request from "../../models/requestSchema.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

async function checkRequests() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const requests = await Request.find({});
    console.log(`Found ${requests.length} requests in the database.`);
    if (requests.length > 0) {
      console.log("Sample request:", JSON.stringify(requests[0], null, 2));
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

checkRequests();
