import mongoose from "mongoose";
import dotenv from "dotenv";
import Faculty from "./models/facultySchema.js";
import Student from "./models/studentSchema.js";
import Project from "./models/projectSchema.js";
import Panel from "./models/panelSchema.js";
import MarkingSchemaModel from "./models/markingSchema.js";
import MasterData from "./models/masterDataSchema.js";
import ComponentLibrary from "./models/componentLibrarySchema.js";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;

const verify = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected for verification.");

        const counts = {
            masterData: await MasterData.countDocuments(),
            faculty: await Faculty.countDocuments(),
            students: await Student.countDocuments(),
            projects: await Project.countDocuments(),
            panels: await Panel.countDocuments(),
            componentLibraries: await ComponentLibrary.countDocuments(),
            markingSchemas: await MarkingSchemaModel.countDocuments(),
        };

        console.table(counts);

        // Specific checks
        const admin = await Faculty.findOne({ role: "admin" });
        console.log("Admin exists:", !!admin);

        const project = await Project.findOne();
        console.log("Project name:", project?.name);
        console.log("Project program:", project?.program); // Added check
        console.log("Project reviews:", project?.reviewPanels?.length);

        console.log("Verification Complete.");
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

verify();
