import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import Models
import Faculty from "../models/facultySchema.js";
import Student from "../models/studentSchema.js";
import Project from "../models/projectSchema.js";
import Panel from "../models/panelSchema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const addProject = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        // 1. Get Faculty
        const faculty = await Faculty.findOne({ emailId: "faculty1@test.com" });
        if (!faculty) {
            console.error("Faculty1 not found! Run fix_db_state.js first.");
            process.exit(1);
        }
        console.log(`Found Faculty: ${faculty.name}`);

        // 2. Create/Get Students
        const students = await Student.insertMany([
            {
                regNo: "TEST001",
                name: "Alpha Student",
                emailId: "alpha@student.com",
                school: "SCOPE",
                program: "B.Tech CSE",
                academicYear: "2024-2025"
            },
            {
                regNo: "TEST002",
                name: "Beta Student",
                emailId: "beta@student.com",
                school: "SCOPE",
                program: "B.Tech CSE",
                academicYear: "2024-2025"
            }
        ]); // Note: insertMany might fail if dupes, but for test logic we assume clean or ignore. 
        // Better to use upsert for robustness? Let's assume clean for now or handling catch.
        // Actually, let's use findOneAndUpdate in loop to be safe.

        const s1 = await Student.findOneAndUpdate({ regNo: "TEST001" }, { $set: { name: "Alpha Student", emailId: "alpha@student.com", school: "SCOPE", academicYear: "2024-2025" } }, { upsert: true, new: true });
        const s2 = await Student.findOneAndUpdate({ regNo: "TEST002" }, { $set: { name: "Beta Student", emailId: "beta@student.com", school: "SCOPE", academicYear: "2024-2025" } }, { upsert: true, new: true });

        console.log("Students ready:", s1._id, s2._id);

        // 3. Create/Get Panel
        const panel = await Panel.findOneAndUpdate(
            { panelName: "Test Panel Alpha" },
            {
                $set: {
                    members: [{ faculty: faculty._id, facultyEmployeeId: faculty.employeeId }],
                    academicYear: "2024-2025",
                    school: "SCOPE",
                    isActive: true
                }
            },
            { upsert: true, new: true }
        );
        console.log("Panel ready:", panel.panelName);

        // 4. Create Project
        const project = await Project.findOneAndUpdate(
            { name: "Test Project Alpha" },
            {
                $set: {
                    students: [s1._id, s2._id],
                    guideFaculty: faculty._id,
                    panel: panel._id,
                    // IMPORTANT: Review Panels configuration so it shows up in dashboard
                    reviewPanels: [
                        { reviewType: "Review 1", panel: panel._id },
                        { reviewType: "Review 2", panel: panel._id }
                    ],
                    academicYear: "2024-2025",
                    school: "SCOPE",
                    program: "B.Tech CSE",
                    status: "active",
                    teamSize: 2
                }
            },
            { upsert: true, new: true }
        );

        console.log(`✅ Project Created: "${project.name}"`);
        console.log(`   Assigned to Guide: ${faculty.name}`);
        console.log(`   Students: ${s1.name}, ${s2.name}`);

    } catch (err) {
        console.error("Error adding project:", err);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

addProject();
