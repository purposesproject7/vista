import mongoose from 'mongoose';
import AccessRequest from './server/models/accessRequestSchema.js';
import Faculty from './server/models/facultySchema.js';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const checkReferences = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const requests = await AccessRequest.find().lean();
        console.log(`Found ${requests.length} access requests.`);

        for (const req of requests) {
            const faculty = await Faculty.findById(req.requestedBy);
            if (!faculty) {
                console.error(`Request ID ${req._id} references unknown Faculty ID: ${req.requestedBy}`);
            } else {
                console.log(`Request ID ${req._id} references valid Faculty: ${faculty.name}`);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkReferences();
