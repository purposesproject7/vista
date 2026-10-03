import mongoose from "mongoose";
import dotenv from "dotenv";
import Project from "../models/projectSchema.js";
import Student from "../models/studentSchema.js";
import Faculty from "../models/facultySchema.js";
import { ProjectService } from "../services/projectService.js";

dotenv.config();

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const collection = Project.collection;
        const indexName = "name_1_academicYear_1";

        // 1. Check and Drop Index
        const indexes = await collection.indexes();
        const existingIndex = indexes.find(i => i.name === indexName);

        if (existingIndex) {
            console.log(`Index '${indexName}' found. Unique: ${existingIndex.unique}`);
            console.log("Dropping index...");
            await collection.dropIndex(indexName);
            console.log("Index dropped.");
        } else {
            console.log(`Index '${indexName}' not found.`);
        }

        // 2. Verify Removal
        const indexesAfter = await collection.indexes();
        if (indexesAfter.find(i => i.name === indexName)) {
            console.error("CRITICAL: Index still exists after drop!");
            // Proceeding anyway to see what happens
        } else {
            console.log("Verified: Index is gone from collection.");
        }

        // 3. Create Duplicates
        const createdBy = new mongoose.Types.ObjectId();
        const academicYear = "2025-26 TEST";

        // Dummy Data
        const faculty = new Faculty({
            name: "Test Faculty",
            emailId: `test.faculty.${Date.now()}@example.com`,
            employeeId: `TEST_${Date.now()}`,
            school: "SCOPE",
            program: "B.Tech CSE",
            role: "faculty",
            password: "password",
            specialization: "Test Spec",
            phoneNumber: "1234567890"
        });
        await faculty.save();

        const student1 = new Student({
            regNo: `TEST_S1_${Date.now()}`,
            name: "Test Student 1",
            emailId: `test.student1.${Date.now()}@example.com`,
            school: "SCOPE",
            program: "B.Tech CSE",
            academicYear: academicYear,
            password: "password",
            phoneNumber: "1234567890"
        });
        await student1.save();

        const student2 = new Student({
            regNo: `TEST_S2_${Date.now()}`,
            name: "Test Student 2",
            emailId: `test.student2.${Date.now()}@example.com`,
            school: "SCOPE",
            program: "B.Tech CSE",
            academicYear: academicYear,
            password: "password",
            phoneNumber: "1234567890"
        });
        await student2.save();

        console.log("Creating first project...");
        await ProjectService.createProject({
            name: "DUPLICATE NAME",
            students: [student1.regNo],
            guideFacultyEmpId: faculty.employeeId,
            academicYear: academicYear,
            school: "SCOPE",
            program: "B.Tech CSE",
            specialization: "Test Spec",
            type: "software",
        }, createdBy);
        console.log("First project created.");

        console.log("Creating second project...");
        await ProjectService.createProject({
            name: "DUPLICATE NAME",
            students: [student2.regNo],
            guideFacultyEmpId: faculty.employeeId,
            academicYear: academicYear,
            school: "SCOPE",
            program: "B.Tech CSE",
            specialization: "Test Spec",
            type: "software",
        }, createdBy);
        console.log("Second project created.");

        console.log("SUCCESS: Test passed.");

        // Cleanup
        await Project.deleteMany({ academicYear: academicYear });
        await Student.deleteMany({ _id: { $in: [student1._id, student2._id] } });
        await Faculty.deleteMany({ _id: faculty._id });

        await mongoose.disconnect();
    } catch (error) {
        console.error("TEST FAILED:", error);
        process.exit(1);
    }
};

runTest();
