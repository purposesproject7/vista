import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './models/projectSchema.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const projectNames = [
            'Digital Signal Processor Implementation',
            'Two Factor Authentication System',
            'new merged'
        ];

        const projects = await Project.find({ name: { $in: projectNames } }).lean();

        console.log('--- PROJECT STATUS CHECK ---');
        projects.forEach(p => {
            console.log(`Project: "${p.name}"`);
            console.log(`  ID: ${p._id}`);
            console.log(`  Status: ${p.status}`);
            console.log(`  Students Count: ${p.students?.length}`);
            console.log(`  Students IDs: ${p.students}`);
            console.log('------------------------------');
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
