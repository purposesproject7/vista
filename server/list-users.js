import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Faculty from './models/facultySchema.js';

dotenv.config();

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const faculty = await Faculty.find({}, 'name emailId role');

        console.log('\n--- Registered Users ---');
        if (faculty.length === 0) {
            console.log('No users found in the database.');
        } else {
            faculty.forEach(f => {
                console.log(`Name: ${f.name} | Email: ${f.emailId} | Role: ${f.role}`);
            });
        }
        console.log('------------------------\n');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

listUsers();
