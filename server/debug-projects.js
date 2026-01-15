import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ProjectService } from './services/projectService.js';
import Project from './models/projectSchema.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Find the specific project
        const projectName = "AI Based Traffic Management";
        const project = await Project.findOne({ name: projectName });

        if (!project) {
            console.log(`Project "${projectName}" not found in DB.`);
            return;
        }

        console.log('--- Project Details ---');
        console.log('ID:', project._id);
        console.log('Guide:', project.guideFaculty);
        console.log('AcademicYear:', project.academicYear);
        console.log('School:', project.school);
        console.log('Program:', project.program);
        console.log('Status:', project.status);

        const guideId = project.guideFaculty;

        // 2. Test getFacultyProjects with NO filters
        console.log('\n--- Test 1: No Filters ---');
        const res1 = await ProjectService.getFacultyProjects(guideId, {});
        console.log('Guide Projects Found:', res1.guideProjects.length);

        // 3. Test getFacultyProjects with EXACT filters from project
        console.log('\n--- Test 2: Exact Filters ---');
        const filters2 = {
            academicYear: project.academicYear,
            school: project.school,
            program: project.program
        };
        console.log('Filters:', filters2);
        const res2 = await ProjectService.getFacultyProjects(guideId, filters2);
        console.log('Guide Projects Found:', res2.guideProjects.length);

        // 4. Test getFacultyProjects with POTENTIAL UI filters
        console.log('\n--- Test 3: UI Filters (Guessing mismatch) ---');
        // Guessing UI sends "2024-2025" instead of "2024-2025 winter"
        const filters3 = {
            academicYear: "2024-2025",
            school: project.school,
            program: project.program
        };
        console.log('Filters:', filters3);
        const res3 = await ProjectService.getFacultyProjects(guideId, filters3);
        console.log('Guide Projects Found:', res3.guideProjects.length);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
