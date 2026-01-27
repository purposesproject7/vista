import mongoose from 'mongoose';
import { ApprovalService } from './server/services/approvalService.js';
import { ProjectService } from './server/services/projectService.js';
import Project from './server/models/projectSchema.js';
import Student from './server/models/studentSchema.js';
import Faculty from './server/models/facultySchema.js';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

async function verifyPPT() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        // 1. Setup Data
        // Find a guide
        const guide = await Faculty.findOne({ role: 'faculty' });
        if (!guide) throw new Error("No faculty found");

        const student = await Student.findOne();
        if (!student) throw new Error("No student found");

        // Clean up any existing project for this student for test purity
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
            status: "active"
        });
        await project.save();
        console.log(`Created Project: ${project._id}`);

        // 2. Test Approve PPT
        console.log(`Approving PPT for student ${student._id} (Guide: ${guide._id}) with reviewType: 'Review 1'`);

        await ApprovalService.approvePPT(guide._id, student._id, 'Review 1');

        // 3. Verify Update
        const updatedProject = await Project.findById(project._id);
        const approval = updatedProject.pptApprovals.find(p => p.reviewType === 'Review 1');

        console.log("PPT Approval Status in DB:", JSON.stringify(approval, null, 2));

        if (!approval || !approval.isApproved) {
            console.error("FAILED: Approval not found in Project!");
        } else {
            console.log("SUCCESS: Project updated correctly.");
        }

        // 4. Verify ProjectService retrieval
        const facultyProjects = await ProjectService.getFacultyProjects(guide._id);
        const retrievedProject = facultyProjects.guideProjects.find(p => p._id.toString() === project._id.toString());

        console.log("Retrieved Project PPT Approvals:", JSON.stringify(retrievedProject.pptApprovals, null, 2));

        if (retrievedProject && retrievedProject.pptApprovals && retrievedProject.pptApprovals.length > 0) {
            console.log("SUCCESS: ProjectService returns pptApprovals.");
        } else {
            console.error("FAILED: ProjectService did not return pptApprovals.");
        }

        // Cleanup
        await Project.deleteOne({ _id: project._id });

    } catch (error) {
        console.error("Verification Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

verifyPPT();
