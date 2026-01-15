import mongoose from "mongoose";
import dotenv from "dotenv";
import Project from "./models/projectSchema.js";
import Student from "./models/studentSchema.js";
import Faculty from "./models/facultySchema.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        // 1. Define Context (Matching the schema the user provided/wants)
        const context = {
            school: "T1",
            program: "BTECH-CSE", // Using Code as per fix
            academicYear: "2024-2025 winter",
            specialization: "Artificial Intelligence",
        };

        // 2. Find Faculty (Guide)
        // You can hardcode an ID if known, or find one.
        // Let's try to find an existing one or use the one from user's snippet if possible, or fallback.
        let guide = await Faculty.findOne({
            "employeeId": "FAC_001" // Example ID, replace if needed or finding any faculty
        });

        if (!guide) {
            // Fallback or create mock
            console.log("FAC_001 not found, finding any faculty...");
            guide = await Faculty.findOne();
        }

        if (!guide) {
            console.error("No faculty found to assign as guide.");
            return;
        }
        console.log(`Using Guide: ${guide.name} (${guide._id})`);

        // 3. Create New Student
        const newStudentRegNo = "24BCE1000"; // New unique RegNo
        let student = await Student.findOne({ regNo: newStudentRegNo });

        if (!student) {
            student = new Student({
                name: "Test Student Jan",
                regNo: newStudentRegNo,
                emailId: "test.student.jan@example.com",
                password: "password123",
                school: context.school,
                program: context.program,
                academicYear: context.academicYear,
                isActive: true,
            });
            await student.save();
            console.log(`Created Student: ${student.name} (${student._id})`);
        } else {
            console.log(`Using Existing Student: ${student.name} (${student._id})`);
        }

        // 4. Create Project
        const newProject = new Project({
            name: "Traffic Management AI - Test Jan Deadline",
            students: [student._id],
            guideFaculty: guide._id,
            academicYear: context.academicYear,
            school: context.school,
            program: context.program,
            specialization: context.specialization,
            type: "software",
            status: "active",
            teamSize: 1,
            history: [
                {
                    action: "created",
                    performedBy: guide._id, // Assume created by guide
                    performedAt: new Date()
                }
            ]
        });

        await newProject.save();

        console.log("Project created successfully!");
        console.log("Project ID:", newProject._id);
        console.log("Context:", context);
        console.log("Note: Ensure the MarkingSchema for this context has the deadline 10th-11th Jan 2026.");

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
