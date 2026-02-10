import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ProjectService } from '../services/projectService.js';
import Project from '../models/projectSchema.js';
import Student from '../models/studentSchema.js';
import Faculty from '../models/facultySchema.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
    try {
        console.log('Connecting to DB...');
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

        // Create 3 dummy students
        // S1 in P1 (Single)
        // S2, S3 in P2 (Team)
        const studentsData = [
            { regNo: 'MERGE_TEST_S1', name: 'S1', emailId: 's1@test.com' },
            { regNo: 'MERGE_TEST_S2', name: 'S2', emailId: 's2@test.com' },
            { regNo: 'MERGE_TEST_S3', name: 'S3', emailId: 's3@test.com' }
        ];

        await Student.deleteMany({ regNo: { $in: studentsData.map(s => s.regNo) } });
        await Project.deleteMany({ name: { $in: ['Project A', 'Project B', 'Merged Result'] } });

        const program = Array.isArray(guide.program) ? guide.program[0] : (guide.program || 'TEST');

        const students = [];
        for (const data of studentsData) {
            const s = new Student({
                ...data,
                school: guide.school,
                program: program,
                academicYear: '2024-2025'
            });
            await s.save();
            students.push(s);
        }

        const [s1, s2, s3] = students;

        // Project A: S1
        const p1 = new Project({
            name: 'Project A',
            students: [s1._id],
            guideFaculty: guide._id,
            academicYear: '2024-2025',
            school: guide.school,
            program: program,
            specialization: 'Test Spec',
            type: 'software',
            teamSize: 1,
            status: 'active'
        });
        await p1.save();

        // Project B: S2, S3
        const p2 = new Project({
            name: 'Project B',
            students: [s2._id, s3._id],
            guideFaculty: guide._id,
            academicYear: '2024-2025',
            school: guide.school,
            program: program,
            specialization: 'Test Spec',
            type: 'software',
            teamSize: 2,
            status: 'active'
        });
        await p2.save();

        console.log('Created Project A:', p1._id, 'with S1');
        console.log('Created Project B:', p2._id, 'with S2, S3');

        // 2. Simulate User Request: Merge S1 (from P1 - Solo) and S2 (from P2 - Pair). 
        // Expected Result:
        // - New Project created with S1 and S2.
        // - P1 is now empty -> Should be DELETED.
        // - P2 still has S3 -> Should REMAIN ACTIVE.

        console.log('\n--- New Logic Simulation ---');
        console.log('Merging S1 and S2...');
        console.log('Calling ProjectService.mergeProjects...');

        try {
            const merged = await ProjectService.mergeProjects(
                [s1._id, s2._id], // Passing Student IDs now
                'Merged Result',
                guide._id
            );
            console.log('Merge complete. Result:', merged._id);

            console.log('Merged Project Students:', merged.students.length); // Should be 2 (S1, S2)

            const checkP1 = await Project.findById(p1._id);
            console.log('Old Project A (was S1 only) Exists? :', !!checkP1); // Should be false (deleted)

            const checkP2 = await Project.findById(p2._id);
            console.log('Old Project B (was S2, S3) Exists? :', !!checkP2); // Should be true (has S3)

            if (checkP2) {
                const p2Data = await Project.findById(p2._id).populate('students');
                console.log('Old Project B Students Count:', p2Data.students.length); // Should be 1 (S3)
                console.log('Old Project B Student:', p2Data.students[0].name);
            }

            if (!checkP1 && checkP2 && merged.students.length === 2) {
                console.log('VERIFIED: New logic handles partial merge and conditional deletion correctly!');
            } else {
                console.log('FAILED: Verification checks failed.');
            }

            // Cleanup
            await Student.deleteMany({ regNo: { $in: studentsData.map(s => s.regNo) } });
            await Project.deleteMany({ _id: { $in: [p1._id, p2._id, merged._id] } });

        } catch (err) {
            console.error('Merge failed with error:', err);
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
