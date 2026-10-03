import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Project from "../models/projectSchema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("DB Connected");
        const projects = await Project.find({}, { name: 1 }).limit(50);
        console.log("Projects in DB:");
        projects.forEach(p => console.log(`"${p.name}"`));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
run();
