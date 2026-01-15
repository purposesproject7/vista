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

    const schemas = await MarkingSchema.find(
      {},
      "school department reviews.reviewName"
    );

    console.log("SCHEMAS_FOUND:", schemas.length);
    schemas.forEach((s) => {
      console.log(
        `ID: ${s._id} | School: ${s.school} | Dept: ${
          s.department
        } | Reviews: ${s.reviews.map((r) => r.reviewName).join(", ")}`
      );
    });
  } catch (e) {
    console.log("ERROR:", e.message);
  } finally {
    await mongoose.disconnect();
  }
};

run();
