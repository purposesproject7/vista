
import mongoose from 'mongoose';
import Student from '../models/studentSchema.js';
import Project from '../models/projectSchema.js';
import Panel from '../models/panelSchema.js';
import Marks from '../models/marksSchema.js';
import Faculty from '../models/facultySchema.js';
import { StudentService } from '../services/studentService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from server root (one level up from scripts)
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('Connecting to MongoDB...', process.env.MONGO_URI);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        runMismatchTest();
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

async function runMismatchTest() {
    let resources = { student: null, project: null, faculties: [], marks: [] };

    try {
        console.log('--- Starting Averaging Logic Verification ---');

        // 1. Create Mock Data
        const uniqueId = Date.now();
        const regNo = `TEST-${uniqueId}`;

        const student = await Student.create({
            regNo,
            name: `Test Student ${uniqueId}`,
            emailId: `test${uniqueId}@example.com`,
            school: 'SCOPE',
            program: 'B.Tech CSE',
            academicYear: '2025-2026',
            isActive: true,
            phoneNumber: '9876543210'
        });
        resources.student = student;

        const guide = await Faculty.create({
            employeeId: `GUIDE-${uniqueId}`,
            name: 'Test Guide',
            emailId: `guide${uniqueId}@example.com`,
            role: 'faculty',
            school: 'SCOPE',
            program: 'B.Tech CSE',
            password: 'password',
            phoneNumber: '1234567890'
        });
        resources.faculties.push(guide);

        const panel1 = await Faculty.create({
            employeeId: `PANEL1-${uniqueId}`,
            name: 'Test Panel 1',
            emailId: `panel1${uniqueId}@example.com`,
            role: 'faculty',
            school: 'SCOPE',
            program: 'B.Tech CSE',
            password: 'password',
            phoneNumber: '1234567890'
        });
        resources.faculties.push(panel1);

        const panel2 = await Faculty.create({
            employeeId: `PANEL2-${uniqueId}`,
            name: 'Test Panel 2',
            emailId: `panel2${uniqueId}@example.com`,
            role: 'faculty',
            school: 'SCOPE',
            program: 'B.Tech CSE',
            password: 'password',
            phoneNumber: '1234567890'
        });
        resources.faculties.push(panel2);

        const project = await Project.create({
            name: `Project ${uniqueId}`,
            students: [student._id],
            guideFaculty: guide._id,
            school: 'SCOPE',
            program: 'B.Tech CSE',
            academicYear: '2025-2026',
            status: 'active',
            specialization: 'Core', // Required
            type: 'software',       // Required
            teamSize: 1             // Required
        });
        resources.project = project;

        console.log(`Created Student: ${regNo}`);

        // 2. Submit Marks
        const reviewType = 'Review 1';

        // Panel 1 gives 80
        const m1 = await Marks.create({
            student: student._id,
            project: project._id,
            reviewType,
            faculty: panel1._id,
            facultyType: 'panel',
            academicYear: '2025-2026',
            school: 'SCOPE',
            program: 'B.Tech CSE',
            totalMarks: 80,
            maxTotalMarks: 100,
            componentMarks: [{
                componentId: new mongoose.Types.ObjectId(),
                componentName: 'Presentation',
                marks: 40,
                maxMarks: 50,
                componentTotal: 40,
                componentMaxTotal: 50
            }, {
                componentId: new mongoose.Types.ObjectId(),
                componentName: 'Q&A',
                marks: 40,
                maxMarks: 50,
                componentTotal: 40,
                componentMaxTotal: 50
            }],
            isSubmitted: true
        });
        resources.marks.push(m1);

        // Update student reference
        await Student.findByIdAndUpdate(student._id, { $push: { panelMarks: m1._id } });


        // Panel 2 gives 90
        const m2 = await Marks.create({
            student: student._id,
            project: project._id,
            reviewType,
            faculty: panel2._id,
            facultyType: 'panel',
            academicYear: '2025-2026',
            school: 'SCOPE',
            program: 'B.Tech CSE',
            totalMarks: 90,
            maxTotalMarks: 100,
            componentMarks: [{
                componentId: new mongoose.Types.ObjectId(),
                componentName: 'Presentation',
                marks: 45,
                maxMarks: 50,
                componentTotal: 45,
                componentMaxTotal: 50
            }, {
                componentId: new mongoose.Types.ObjectId(),
                componentName: 'Q&A',
                marks: 45,
                maxMarks: 50,
                componentTotal: 45,
                componentMaxTotal: 50
            }],
            isSubmitted: true
        });
        resources.marks.push(m2);

        await Student.findByIdAndUpdate(student._id, { $push: { panelMarks: m2._id } });

        console.log('Submitted marks: Panel 1 = 80, Panel 2 = 90');

        // 3. Invoke StudentService to get processed data
        const result = await StudentService.getStudentByRegNo(regNo);

        console.log(`\n--- Result for ${reviewType} ---`);
        if (!result || !result.reviews || !result.reviews[reviewType]) {
            console.error('Review data not found in result!');
            if (result) console.log(JSON.stringify(result.reviews, null, 2));
        } else {
            const reviewData = result.reviews[reviewType];

            console.log(`Total Marks Displayed: ${reviewData.total}`);
            if (reviewData.marks) {
                console.log(`Component 'Presentation': ${reviewData.marks['Presentation']}`);
                console.log(`Component 'Q&A': ${reviewData.marks['Q&A']}`);
            } else {
                console.log('Component marks not present in reviewData');
            }

            if (reviewData.total === 85) {
                console.log('✅ SUCCESS: Marks are averaged correctly (85).');
            } else {
                console.log(`❌ FAILURE: Marks are NOT averaged. Expected 85, got ${reviewData.total}`);
            }

            if (reviewData.marks && reviewData.marks['Presentation'] === 42.5) {
                console.log('✅ SUCCESS: Component marks are averaged correctly (42.5).');
            } else {
                console.log(`❌ FAILURE: Component marks are NOT averaged. Expected 42.5, got ${reviewData.marks ? reviewData.marks['Presentation'] : 'N/A'}`);
            }
        }

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        console.log('Cleaning up...');
        try {
            if (resources.student) await Student.findByIdAndDelete(resources.student._id);
            if (resources.faculties.length) await Faculty.deleteMany({ _id: { $in: resources.faculties.map(f => f._id) } });
            if (resources.project) await Project.findByIdAndDelete(resources.project._id);
            if (resources.marks.length) await Marks.deleteMany({ _id: { $in: resources.marks.map(m => m._id) } });
            console.log('Cleanup successful');
        } catch (cleanupErr) {
            console.error('Cleanup failed:', cleanupErr);
        }

        console.log('Disconnecting...');
        await mongoose.disconnect();
        console.log('Disconnected');
        process.exit(0);
    }
}
