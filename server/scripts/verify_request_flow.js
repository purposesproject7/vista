import mongoose from 'mongoose';
import Request from '../models/requestSchema.js';
import Faculty from '../models/facultySchema.js';
import Student from '../models/studentSchema.js';
import Project from '../models/projectSchema.js';
import ProjectCoordinator from '../models/projectCoordinatorSchema.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function verifyRequestFlow() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected.");

        // 1. Setup Context
        const SCHOOL = "SCOPE_TEST";
        const PROGRAM = "BTECH_TEST";
        const YEAR = "2024-2025";

        // 2. Clear previous test data
        await cleanUp(SCHOOL, PROGRAM);

        // 3. Create Coordinator
        const coordinatorUser = await Faculty.create({
            name: "Test Coordinator",
            emailId: "coord@test.com",
            employeeId: "COORD01",
            role: "admin", // irrelevant for schema but good for auth
            isProjectCoordinator: true,
            school: SCHOOL,
            program: PROGRAM
        });

        const coordinatorProfile = await ProjectCoordinator.create({
            faculty: coordinatorUser._id,
            school: SCHOOL,
            program: PROGRAM,
            academicYear: YEAR,
            isPrimary: true,
            permissions: { canManageFaculty: true, canManageStudents: true, canManageProjects: true }
        });
        console.log(`Created Coordinator: ${coordinatorProfile._id}`);

        // 4. Create Student
        const student = await Student.create({
            name: "Test Student",
            regNo: "20BCE_TEST_01",
            emailId: "student@test.com",
            school: SCHOOL,
            program: PROGRAM,
            academicYear: YEAR
        });
        console.log(`Created Student: ${student._id} (${student.school}, ${student.program})`);

        // 5. Create Faculty (Guide)
        const guide = await Faculty.create({
            name: "Test Guide",
            emailId: "guide@test.com",
            employeeId: "GUIDE01",
            role: "faculty",
            school: SCHOOL,
            program: PROGRAM
        });

        // 6. Create Project
        const project = await Project.create({
            name: "Test Project",
            students: [student._id],
            guideFaculty: guide._id,
            academicYear: YEAR,
            school: SCHOOL,
            program: PROGRAM,
            status: "active"
        });

        // 7. Create Request (Simulate Faculty creating it via API)
        // NOTE: In the controller, we rely on req.user context or body. 
        // We will simulate the Controller logic here: 
        // "Using Student's school/program" as per my hypothesis/plan
        const request = await Request.create({
            faculty: guide._id,
            facultyType: "guide",
            student: student._id,
            project: project._id,
            academicYear: student.academicYear,
            school: student.school,
            program: student.program,
            reviewType: "Review 1",
            requestType: "mark_edit",
            reason: "Correction needed",
            status: "pending"
        });
        console.log(`Created Request: ${request._id}`);
        console.log(`Request Context -> School: ${request.school}, Program: ${request.program}, AC: ${request.academicYear}`);

        // 8. Verify visibility for Coordinator
        // Coordinator typically filters by: school, program, academicYear (sometimes)
        const query = {
            school: SCHOOL,
            program: PROGRAM,
            // academicYear: YEAR // requests often filtered by context, sometimes not year? Let's check typical controller query
        };

        const foundRequest = await Request.findOne(query);

        if (foundRequest) {
            console.log("SUCCESS: Coordinator CAN see the request with standard filters.");
        } else {
            console.error("FAILURE: Coordinator CANNOT see the request.");
            console.log("Query used:", query);
            console.log("Actual Request:", await Request.findById(request._id));
        }

        // 9. Inspect 'getRequests' logic from ProjectCoordinatorController reflection
        // The controller says: const filters = { ...req.query, ...context };
        // context is { academicYear, school, program }
        const controllerQuery = {
            school: coordinatorProfile.school,
            program: coordinatorProfile.program,
            academicYear: coordinatorProfile.academicYear
        };
        console.log("Simulating Controller Query:", controllerQuery);

        const strictFind = await Request.findOne(controllerQuery);
        if (strictFind) {
            console.log("SUCCESS: Strict controller query found the request.");
        } else {
            console.error("FAILURE: Strict controller query MISSED the request.");
            // Debug why
            if (request.academicYear !== controllerQuery.academicYear) console.log(`Mismatch Year: Req(${request.academicYear}) vs Coord(${controllerQuery.academicYear})`);
            if (request.school !== controllerQuery.school) console.log(`Mismatch School: Req(${request.school}) vs Coord(${controllerQuery.school})`);
            if (request.program !== controllerQuery.program) console.log(`Mismatch Program: Req(${request.program}) vs Coord(${controllerQuery.program})`);
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

async function cleanUp(school, program) {
    await Student.deleteMany({ regNo: "20BCE_TEST_01" });
    await Faculty.deleteMany({ emailId: { $in: ["coord@test.com", "guide@test.com"] } });
    await ProjectCoordinator.deleteMany({ school: "SCOPE_TEST" });
    await Project.deleteMany({ name: "Test Project" });
    // Cleanup requests linked to these test entities would be ideal too, but unique enough
}

verifyRequestFlow();
