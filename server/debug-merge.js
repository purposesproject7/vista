import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ProjectService } from './services/projectService.js';
import Project from './models/projectSchema.js';
import Student from './models/studentSchema.js';
import Faculty from './models/facultySchema.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Setup Data
        // Find a faculty to be the guide
        const guide = await Faculty.findOne({ role: 'faculty' });
        if (!guide) {
            console.log('No faculty found.');
            return;
        }
        console.log('Using Guide:', guide.name);

        // Create 2 dummy students
        const s1 = new Student({
            regNo: 'TEST_MERGE_1',
            name: 'Test Student Merge 1',
            emailId: 'test.merge1@example.com',
            school: guide.school,
            program: guide.program || 'TEST_PROG',
            academicYear: '2024-2025'
        });
        const s2 = new Student({
            regNo: 'TEST_MERGE_2',
            name: 'Test Student Merge 2',
            emailId: 'test.merge2@example.com',
            school: guide.school,
            program: guide.program || 'TEST_PROG',
            academicYear: '2024-2025'
        });

        // Clean up previous runs
        await Student.deleteMany({ regNo: { $in: ['TEST_MERGE_1', 'TEST_MERGE_2'] } });
        await Project.deleteMany({ name: { $in: ['Test Project A', 'Test Project B', 'Merged Test Project'] } });

        await s1.save();
        await s2.save();

        // Create 2 dummy projects
        const p1 = new Project({
            name: 'Test Project A',
            students: [s1._id],
            guideFaculty: guide._id,
            academicYear: '2024-2025',
            school: guide.school,
            program: guide.program || 'TEST_PROG',
            specialization: 'Test Spec',
            type: 'software',
            teamSize: 1,
            status: 'active'
        });
        const p2 = new Project({
            name: 'Test Project B',
            students: [s2._id],
            guideFaculty: guide._id,
            academicYear: '2024-2025',
            school: guide.school,
            program: guide.program || 'TEST_PROG',
            specialization: 'Test Spec',
            type: 'software',
            teamSize: 1,
            status: 'active'
        });

        await p1.save();
        await p2.save();

        console.log('Created Projects:', p1._id, p2._id);

        // 2. Perform Merge
        console.log('Merging...');
        const mergedProject = await ProjectService.mergeProjects(
            [p1._id, p2._id],
            'Merged Test Project',
            guide._id
        );

        console.log('Merge Successful!');
        console.log('New Project ID:', mergedProject._id);
        console.log('New Project Name:', mergedProject.name);
        console.log('New Project Students:', mergedProject.students.length);

        if (mergedProject.students.length !== 2) {
            console.error('FAILED: New project should have 2 students.');
        }

        // 3. Verify Old Projects
        const oldP1 = await Project.findById(p1._id);
        const oldP2 = await Project.findById(p2._id);

        console.log('Old Project A Status:', oldP1.status);
        console.log('Old Project B Status:', oldP2.status);

        if (oldP1.status !== 'archived' || oldP2.status !== 'archived') {
            console.error('FAILED: Old projects should be archived.');
        }

        // Clean up
        await Student.deleteMany({ regNo: { $in: ['TEST_MERGE_1', 'TEST_MERGE_2'] } });
        await Project.deleteMany({ _id: { $in: [p1._id, p2._id, mergedProject._id] } });

    } catch (e) {
        console.error('Merge Verification Failed:', e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
