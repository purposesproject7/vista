import mongoose from 'mongoose';
import { ApprovalService } from './services/approvalService.js';
import { ProjectService } from './services/projectService.js';
import Project from './models/projectSchema.js';
import Student from './models/studentSchema.js';
import Faculty from './models/facultySchema.js';
import dotenv from 'dotenv';

// Load env
dotenv.config();

async function verifyPPT() {
    try {
        console.log("Connecting to:", process.env.MONGODB_URI);
        if (!process.env.MONGODB_URI) throw new Error("No Mongo URI");

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        // 1. Setup Data
        // Find a guide
        let guide = await Faculty.findOne({ role: 'faculty' });
        if (!guide) {
            console.log("No faculty found, creating temp one");
            guide = await Faculty.create({
                name: "Temp Guide",
                emailId: "tempguide@test.com",
                role: "faculty",
                employeeId: "TEMP001",
                school: "SCOPE",
                program: "B.Tech CSE"
            });
        }

        // Find or create student
        let student = await Student.findOne();
        if (!student) {
            console.log("No student found, creating temp one");
            student = await Student.create({
                name: "Temp Student",
                regNo: "20BCE0000",
                emailId: "tempstudent@test.com",
                school: "SCOPE",
                program: "B.Tech CSE",
                academicYear: "2024-2025"
            });
        }

        console.log("Using Guide:", guide._id, "Student:", student._id);

        // Clean up any existing project for this student
        await Project.deleteMany({ students: student._id });

        // Create Project
        const project = new Project({
            name: "Test PPT Project",
            students: [student._id],
            guideFaculty: guide._id,
            academicYear: "2024-2025",
            school: "SCOPE",
            program: "B.Tech CSE",
            specialization: "Core",
            type: "software",
            status: "active",
            pptApprovals: []
        });
        await project.save();
        console.log(`Created Project: ${project._id}`);

        // 2. Test Approve PPT
        const reviewType = 'Review 1';
        console.log(`Approving PPT...`);

        await ApprovalService.approvePPT(guide._id, student._id, reviewType);

        // 3. Verify Update
        const updatedProject = await Project.findById(project._id);
        const approval = updatedProject.pptApprovals ? updatedProject.pptApprovals.find(p => p.reviewType === reviewType) : null;

        console.log("PPT Approval Status in DB:", JSON.stringify(approval, null, 2));

        if (!approval || !approval.isApproved) {
            console.error("FAILED: Approval not found in Project!");
        } else {
            console.log("SUCCESS: Project updated correctly.");
        }

        // 4. Verify ProjectService retrieval
        const facultyProjects = await ProjectService.getFacultyProjects(guide._id);
        // Look in guideProjects
        const retrievedProject = facultyProjects.guideProjects.find(p => p._id.toString() === project._id.toString());

        console.log("Retrieved Project Name:", retrievedProject?.name);
        console.log("Retrieved PPT Approvals:", JSON.stringify(retrievedProject?.pptApprovals));

        if (retrievedProject && retrievedProject.pptApprovals && retrievedProject.pptApprovals.some(p => p.reviewType === reviewType && p.isApproved)) {
            console.log("SUCCESS: ProjectService returns pptApprovals.");
        } else {
            console.error("FAILED: ProjectService did not return pptApprovals or they are incorrect.");
        }

        // Cleanup
        await Project.deleteOne({ _id: project._id });

    } catch (error) {
        console.error("Verification Error:", error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

verifyPPT();
