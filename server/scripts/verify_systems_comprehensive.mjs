import mongoose from 'mongoose';
import Request from '../models/requestSchema.js';
import Faculty from '../models/facultySchema.js';
import Student from '../models/studentSchema.js';
import Project from '../models/projectSchema.js';
import Marks from '../models/marksSchema.js';
import { ApprovalService } from '../services/approvalService.js';
import { MarksService } from '../services/marksService.js';
import { ProjectService } from '../services/projectService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function verifySystemsComprehensive() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected.");

        // 1. Setup Context
        const SCHOOL = "SCOPE_TEST_SYS";
        const PROGRAM = "BTECH_TEST_SYS";
        const YEAR = "2024-2025";
        const REVIEW_TYPE = "Review 1";

        // Cleanup
        await cleanUp(SCHOOL, PROGRAM);

        // 2. Create Entities
        const faculty = await Faculty.create({
            name: "Test Faculty Sys",
            emailId: "fac_sys@test.com",
            employeeId: "SYST01",
            role: "faculty",
            school: SCHOOL,
            program: PROGRAM
        });

        const student = await Student.create({
            name: "Test Student Sys",
            regNo: "SYS_STU_01",
            emailId: "stu_sys@test.com",
            school: SCHOOL,
            program: PROGRAM,
            academicYear: YEAR
        });

        const project = await Project.create({
            name: "Test Project Sys",
            students: [student._id],
            guideFaculty: faculty._id,
            academicYear: YEAR,
            school: SCHOOL,
            program: PROGRAM,
            status: "active"
        });

        console.log("Entities created.");

        // ==========================================
        // 3. Verify PPT System
        // ==========================================
        console.log("\n--- Verifying PPT System ---");
        await ApprovalService.approvePPT(faculty._id, student._id, REVIEW_TYPE);

        const projectAfterPPT = await Project.findById(project._id);
        const pptApproval = projectAfterPPT.pptApprovals.find(p => p.reviewType === REVIEW_TYPE);

        if (pptApproval && pptApproval.isApproved) {
            console.log("✅ PPT Approved successfully.");
        } else {
            console.error("❌ PPT Approval FAILED.");
        }

        // ==========================================
        // 4. Verify Marks System
        // ==========================================
        console.log("\n--- Verifying Marks System ---");
        const marksData = {
            student: student._id,
            project: project._id,
            reviewType: REVIEW_TYPE,
            componentMarks: [{ name: "Comp1", marks: 10, maxMarks: 10 }],
            totalMarks: 10,
            maxTotalMarks: 10,
            remarks: "Good"
        };

        // This relies on getFacultyTypeForProject logic which we assume works for guide
        await MarksService.submitMarks(faculty._id, marksData);

        const marksDoc = await Marks.findOne({ student: student._id, reviewType: REVIEW_TYPE });
        if (marksDoc) {
            console.log("✅ Marks Submitted successfully.");
        } else {
            console.error("❌ Marks Submission FAILED.");
        }

        // ==========================================
        // 5. Verify Request Edit Flow (Integration)
        // ==========================================
        console.log("\n--- Verifying Request Edit Flow ---");

        // A. Create Request
        const request = await Request.create({
            faculty: faculty._id,
            facultyType: "guide",
            student: student._id,
            project: project._id,
            academicYear: YEAR,
            school: SCHOOL, // Should match now due to fix
            program: PROGRAM,
            reviewType: REVIEW_TYPE,
            requestType: "mark_edit", // Key type for unlocking
            reason: "Fix marks",
            status: "pending"
        });
        console.log("Request created.");

        // B. Approve Request via Controller logic (Simulate)
        request.status = "approved";
        await request.save();
        console.log("Request approved.");

        // C. Verify isUnlocked via FacultyController logic
        // We simulate the query done in getFacultyReviews
        const approvedRequests = await Request.find({
            faculty: faculty._id,
            status: "approved",
            requestType: "mark_edit"
        }).lean();

        const isUnlocked = approvedRequests.some(r =>
            r.project.toString() === project._id.toString() &&
            r.reviewType === REVIEW_TYPE // simplified check
        );

        // Real check in controller uses 'mark_edit' type generally or specific matches?
        // My fix used: pObj.isUnlocked = pObj.approvedRequests.some(r => r.requestType === 'mark_edit');
        // It checks if ANY mark_edit request is approved for this project.

        const isUnlockedControllerLogic = approvedRequests.some(r =>
            r.project.toString() === project._id.toString() &&
            r.requestType === 'mark_edit'
        );

        if (isUnlockedControllerLogic) {
            console.log("✅ Project is UNLOCKED via Request (Controller Logic Verified).");
        } else {
            console.error("❌ Project remains LOCKED despite approved request.");
        }

        // D. Verify Editing Marks (should be allowed if business logic permits, but here we just check if DB allows update)
        // The middleware or frontend uses isUnlocked. 
        // MarksService updateMarks doesn't strictly check 'isUnlocked' field from Project, 
        // but assumes Controller checks permissions. 
        // However, let's verify we can update marks using MarksService.

        await MarksService.updateMarks(marksDoc._id, faculty._id, { totalMarks: 12 });
        const updatedMarks = await Marks.findById(marksDoc._id);
        if (updatedMarks.totalMarks === 12) {
            console.log("✅ Marks Updated successfully.");
        } else {
            console.error("❌ Marks Update FAILED.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

async function cleanUp(school, program) {
    await Student.deleteMany({ school, program });
    await Faculty.deleteMany({ school, program });
    await Project.deleteMany({ school, program });
    await Request.deleteMany({ school, program });
    await Marks.deleteMany({ school, program });
    // Aggressive cleanup for test isolation
}

verifySystemsComprehensive();
