/**
 * fix-marks-index.js
 *
 * One-time migration script to:
 * 1. Drop the old unique index { student, reviewType, faculty }
 * 2. Create the corrected unique index { student, project, reviewType, faculty }
 *
 * Run with: node fix-marks-index.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI;

async function fixIndex() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('marks');

        // List existing indexes
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes.map(i => ({ name: i.name, key: i.key })));

        // Drop the old index if it exists
        const oldIndexName = 'student_1_reviewType_1_faculty_1';
        const oldIndexExists = indexes.some(i => i.name === oldIndexName);

        if (oldIndexExists) {
            await collection.dropIndex(oldIndexName);
            console.log(`✅ Dropped old index: ${oldIndexName}`);
        } else {
            console.log(`ℹ️  Old index "${oldIndexName}" not found (may already be removed)`);
        }

        // Create the new index
        await collection.createIndex(
            { student: 1, project: 1, reviewType: 1, faculty: 1 },
            { unique: true, name: 'student_1_project_1_reviewType_1_faculty_1' }
        );
        console.log('✅ Created new index: student_1_project_1_reviewType_1_faculty_1');

        const updatedIndexes = await collection.indexes();
        console.log('Updated indexes:', updatedIndexes.map(i => ({ name: i.name, key: i.key })));

        console.log('\n✅ Index migration complete!');
    } catch (err) {
        console.error('❌ Error during migration:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

fixIndex();
