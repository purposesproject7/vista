import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import MarkingSchema from "../models/markingSchema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const schema = await MarkingSchema.findOne({
      school: "SCOPE",
      department: "CSE",
    });

    if (schema) {
      console.log("SCHEMA_FOUND");
      console.log("ID:", schema._id);
      console.log(
        "REVIEWS:",
        JSON.stringify(schema.reviews.map((r) => r.reviewName))
      );
    } else {
      console.log("SCHEMA_NOT_FOUND");
    }
  } catch (e) {
    console.log("ERROR:", e.message);
  } finally {
    await mongoose.disconnect();
  }
};

run();
