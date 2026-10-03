import mongoose from "mongoose";
import dotenv from "dotenv";
import Project from "../models/projectSchema.js";

dotenv.config();

const listIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const indexes = await Project.collection.indexes();
        console.log("Indexes on 'projects' collection:");
        console.dir(indexes, { depth: null });

        // Check Faculty indexes too
        const Faculty = (await import("../models/facultySchema.js")).default;
        const facultyIndexes = await Faculty.collection.indexes();
        console.log("Indexes on 'faculties' collection:");
        console.dir(facultyIndexes, { depth: null });

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error listing indexes:", error);
        process.exit(1);
    }
};

listIndexes();
