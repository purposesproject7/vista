import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './models/projectSchema.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const projectNamesToArchive = [
            'Digital Signal Processor Implementation',
            'Two Factor Authentication System'
        ];

        console.log(`Archiving projects: ${projectNamesToArchive.join(', ')}`);

        const result = await Project.updateMany(
            { name: { $in: projectNamesToArchive }, status: 'active' },
            { $set: { status: 'archived' } }
        );

        console.log(`Matched and Archived: ${result.modifiedCount} projects.`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
