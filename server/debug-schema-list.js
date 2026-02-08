import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MarkingSchema from './models/markingSchema.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const schemas = await MarkingSchema.find({}).select('school program academicYear').lean();

        console.log('Available Schemas:', schemas.length);
        schemas.forEach(s => {
            console.log(`- ${s.school} | ${s.program} | ${s.academicYear}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
