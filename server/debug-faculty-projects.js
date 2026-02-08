import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ProjectService } from './services/projectService.js';
import Faculty from './models/facultySchema.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Find a faculty member - let's try to find one with projects
        // We can search for a faculty who is a guide for at least one project
        // Or just pick the first one

        // Strategy: Find a project, get its guide, then query for that guide
        const Project = (await import('./models/projectSchema.js')).default;
        const project = await Project.findOne({ status: 'active' });

        if (!project) {
            console.log('No active projects found.');
            return;
        }

        const guideId = project.guideFaculty;
        const faculty = await Faculty.findById(guideId);

        if (!faculty) {
            console.log('Faculty not found for project', project.name);
            return;
        }

        console.log(`Testing with Faculty: ${faculty.name} (${faculty.employeeId})`);
        console.log(`Expected Project: ${project.name}`);

        const results = await ProjectService.getFacultyProjects(faculty._id, {
            academicYear: project.academicYear, // match context
            school: project.school,
            program: project.program
        });

        console.log('--- Guide Projects ---');
        console.log(JSON.stringify(results.guideProjects.map(p => ({
            id: p._id,
            name: p.name,
            academicYear: p.academicYear,
            school: p.school,
            program: p.program
        })), null, 2));

        console.log('--- Panel Projects ---');
        console.log(JSON.stringify(results.panelProjects.map(p => ({
            id: p._id,
            name: p.name,
            panel: p.panel
        })), null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
