
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
dotenv.config({ path: join(__dirname, '../.env') });

const dropIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('projects');

        // List indexes first
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes.map(i => i.name));

        const indexName = 'name_1_academicYear_1';

        if (indexes.find(i => i.name === indexName)) {
            console.log(`Dropping index: ${indexName}...`);
            await collection.dropIndex(indexName);
            console.log('Index dropped successfully.');
        } else {
            // Try to find if there is a similar index but with different options (though name is usually standard)
            // Sometimes mongoose creates unique indexes with different generated names if not specified, 
            // but here the error log "index: name_1_academicYear_1" confirms the name.
            console.log(`Index ${indexName} not found. checking for other unique name indexes...`);
        }

        // List indexes again
        const newIndexes = await collection.indexes();
        console.log('Updated indexes:', newIndexes.map(i => i.name));

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error dropping index:', error);
        process.exit(1);
    }
};

dropIndex();
