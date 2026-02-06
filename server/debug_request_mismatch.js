import mongoose from "mongoose";
import Request from "./models/requestSchema.js";
import Student from "./models/studentSchema.js";
import ProjectCoordinator from "./models/projectCoordinatorSchema.js";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/vista";

async function debugRequests() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        // 1. Get the most recent request
        const request = await Request.findOne().sort({ createdAt: -1 });
        if (!request) {
            console.log("No requests found in DB.");
            return;
        }
        console.log("Latest Request ID:", request._id);
        console.log("Request Context:", {
            academicYear: request.academicYear,
            school: request.school,
            program: request.program,
            requestType: request.requestType,
            status: request.status,
            createdAt: request.createdAt,
        });

        // 2. Get the student
        const student = await Student.findById(request.student);
        if (student) {
            console.log("Student Context:", {
                regNo: student.regNo,
                academicYear: student.academicYear,
                school: student.school,
                program: student.program,
            });

            // Check for exact match
            console.log("Request matches Student?",
                request.academicYear === student.academicYear &&
                request.school === student.school &&
                request.program === student.program
            );
        } else {
            console.log("Student not found for this request.");
        }

        // 3. Get Project Coordinators
        const coordinators = await ProjectCoordinator.find({ isActive: true });
        console.log(`Found ${coordinators.length} active coordinators.`);

        let visibleToAny = false;
        for (const coord of coordinators) {
            const matchYear = coord.academicYear === request.academicYear;
            const matchSchool = coord.school === request.school;
            const matchProgram = coord.program === request.program;

            const isMatch = matchYear && matchSchool && matchProgram;
            if (isMatch) visibleToAny = true;

            console.log(`Coordinator ${coord._id}:`, {
                academicYear: coord.academicYear,
                school: coord.school,
                program: coord.program,
                MATCH: isMatch
            });

            if (!isMatch) {
                if (!matchYear) console.log(`  -> Mismatch Year: '${coord.academicYear}' vs '${request.academicYear}'`);
                if (!matchSchool) console.log(`  -> Mismatch School: '${coord.school}' vs '${request.school}'`);
                if (!matchProgram) console.log(`  -> Mismatch Program: '${coord.program}' vs '${request.program}'`);
            }
        }

        if (!visibleToAny) {
            console.log("\n❌ CONCLUSION: The request is NOT visible to any currrently active Project Coordinator due to context mismatch.");
        } else {
            console.log("\n✅ CONCLUSION: The request SHOULD be visible to at least one Project Coordinator.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

debugRequests();
