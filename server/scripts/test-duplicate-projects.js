import mongoose from "mongoose";
import dotenv from "dotenv";
import Project from "../models/projectSchema.js";
import Student from "../models/studentSchema.js";
import Faculty from "../models/facultySchema.js";
import { ProjectService } from "../services/projectService.js";

dotenv.config();

const testDuplicate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const createdBy = new mongoose.Types.ObjectId();
        const academicYear = "2025-26 TEST";

        // --- Create a dummy Faculty ---
        const faculty = new Faculty({
            name: "Test Faculty",
            emailId: `test.faculty.${Date.now()}@example.com`,
            employeeId: `TEST_${Date.now()}`,
            school: "SCOPE",
            program: "B.Tech CSE",
            role: "faculty",
            password: "password",
            specialization: "Test Spec",
            phoneNumber: "1234567890" // Required
        });
        await faculty.save();
        console.log("Created dummy Faculty:", faculty.employeeId);

        // --- Create dummy Students ---
        const student1 = new Student({
            regNo: `TEST_S1_${Date.now()}`,
            name: "Test Student 1",
            emailId: `test.student1.${Date.now()}@example.com`,
            school: "SCOPE",
            program: "B.Tech CSE",
            academicYear: academicYear, // Required
            password: "password",
            phoneNumber: "1234567890"
        });
        await student1.save();
        console.log("Created dummy Student 1:", student1.regNo);

        const student2 = new Student({
            regNo: `TEST_S2_${Date.now()}`,
            name: "Test Student 2",
            emailId: `test.student2.${Date.now()}@example.com`,
            school: "SCOPE",
            program: "B.Tech CSE",
            academicYear: academicYear, // Required
            password: "password",
            phoneNumber: "1234567890"
        });
        await student2.save();
        console.log("Created dummy Student 2:", student2.regNo);

        // --- Create Projects ---

        const projectData1 = {
            name: "DUPLICATE NAME",
            students: [student1.regNo],
            guideFacultyEmpId: faculty.employeeId,
            academicYear: academicYear,
            school: "SCOPE",
            program: "B.Tech CSE",
            specialization: "Test Spec",
            type: "software",
        };

        console.log("Creating first project...");
        const p1 = await ProjectService.createProject(projectData1, createdBy);
        console.log("Created Project 1:", p1._id);

        const projectData2 = {
            name: "DUPLICATE NAME",
            students: [student2.regNo],
            guideFacultyEmpId: faculty.employeeId,
            academicYear: academicYear,
            school: "SCOPE",
            program: "B.Tech CSE",
            specialization: "Test Spec",
            type: "software",
        };

        console.log("Creating second project with SAME name...");
        const p2 = await ProjectService.createProject(projectData2, createdBy);
        console.log("Created Project 2:", p2._id);

        console.log("SUCCESS: Both projects created with duplicate name.");

        // Cleanup
        console.log("Cleaning up...");
        await Project.deleteMany({ academicYear: academicYear });
        await Student.deleteMany({ _id: { $in: [student1._id, student2._id] } });
        await Faculty.deleteMany({ _id: faculty._id });
        console.log("Cleanup done.");

        await mongoose.disconnect();
    } catch (error) {
        console.error("TEST FAILED:", error);
        if (error.code === 11000) {
            console.error("Caught expected Duplicate Key Error! Review index status.");
        }
        process.exit(1);
    }
};

testDuplicate();
