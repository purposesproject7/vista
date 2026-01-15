
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Panel from './models/panelSchema.js';

dotenv.config();

const debugPanels = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Get unique academic years in Panel collection
        const years = await Panel.distinct('academicYear');
        console.log("Unique Academic Years in Panels:", years);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

debugPanels();
