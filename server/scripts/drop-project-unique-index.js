import mongoose from "mongoose";
import dotenv from "dotenv";
import Project from "../models/projectSchema.js";

dotenv.config();

const dropIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const collection = Project.collection;
        const indexName = "name_1_academicYear_1";

        const indexExists = await collection.indexExists(indexName);

        if (indexExists) {
            console.log(`Index '${indexName}' exists. Dropping it...`);
            await collection.dropIndex(indexName);
            console.log("Index dropped successfully.");
        } else {
            console.log(`Index '${indexName}' does not exist.`);
        }

        console.log("Disconnecting...");
        await mongoose.disconnect();
    } catch (error) {
        console.error("Error dropping index:", error);
        process.exit(1);
    }
};

dropIndex();
