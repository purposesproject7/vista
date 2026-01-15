
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Panel from './models/panelSchema.js';

dotenv.config();

const debugPanels = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const filter = { school: 'T1', program: 'BTECH-CSE' };
        console.log("Searching with filter:", filter);

        const panels = await Panel.find(filter).lean();
        console.log(`Found ${panels.length} matching panels.`);

        if (panels.length > 0) {
            console.log("First Panel Detail:");
            console.log("ID:", panels[0]._id);
            console.log("Name:", panels[0].panelName);
            console.log("School:", panels[0].school);
            console.log("Program:", panels[0].program);
            console.log("AcademicYear:", panels[0].academicYear);
            console.log("IsActive:", panels[0].isActive);
        } else {
            console.log("No panels found matching T1 and BTECH-CSE.");
            // List all distinct schools/programs
            const schools = await Panel.distinct('school');
            const programs = await Panel.distinct('program');
            console.log("Available Schools:", schools);
            console.log("Available Programs:", programs);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

debugPanels();
