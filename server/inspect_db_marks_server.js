
import mongoose from "mongoose";
import Marks from "./models/marksSchema.js";
import Student from "./models/studentSchema.js";
import Project from "./models/projectSchema.js";
import dotenv from "dotenv";

dotenv.config();



const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/vista";


async function inspect() {
    try {
        await mongoose.connect(MONGO_URI, { dbName: 'faculty-vista' });
        console.log("Connected to DB (faculty-vista)");

        // Find M.Tech Integrated Program
        console.log("\n--- SEARCHING FOR M.TECH INTEGRATED ---");
        const mtechStudent = await Student.findOne({ program: { $regex: /Integrated/i } }).lean();

        if (mtechStudent) {
            console.log("Found M.Tech Integrated Student:");
            console.log(`- Name: ${mtechStudent.name}, ID: ${mtechStudent._id}, Program: ${mtechStudent.program}`);

            // Find a project for this student
            const project = await Project.findOne({ students: mtechStudent._id }).lean();
            if (project) {
                console.log("Found Project for Student:");
                console.log(`- Name: ${project.name}, ID: ${project._id}`);
                console.log(`- Review Panels:`, JSON.stringify(project.reviewPanels));

                // Check for existing marks
                const marks = await Marks.find({ student: mtechStudent._id }).lean();
                console.log(`- Existing Marks Count: ${marks.length}`);
                marks.forEach(m => console.log(`  - Review: ${m.reviewType}, Submitted: ${m.isSubmitted}, ID: ${m._id}`));

            } else {
                console.log("No project found for this student.");
            }
        } else {
            console.log("No M.Tech Integrated student found. Listing distinct programs...");
            const programs = await Student.distinct("program");
            console.log("Programs:", programs.join(", "));
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
