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
    // console.log("Conn");
    const schemas = await MarkingSchema.find({});

    const output = schemas.map((s) => ({
      id: s._id,
      school: s.school,
      department: s.department,
      reviews: s.reviews.map((r) => ({
        name: r.reviewName,
        deadline: r.deadline,
      })),
    }));

    console.log(JSON.stringify(output, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
};

run();
