import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MarkingSchema from './models/markingSchema.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const context = {
            school: 'SCOPE',
            program: 'BTECH-AIML',
            academicYear: '2024-2025'
        };

        console.log('Fetching schema for:', context);

        const schema = await MarkingSchema.findOne(context).lean();

        if (!schema) {
            console.log('No marking schema found.');
        } else {
            console.log('Found schema with', schema.reviews.length, 'reviews');
            schema.reviews.forEach(r => {
                console.log(`- ${r.displayName} (${r.reviewName})`);
                console.log(`  Type: ${r.facultyType}`);
                console.log(`  Deadline: ${r.deadline.from} to ${r.deadline.to}`);
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
