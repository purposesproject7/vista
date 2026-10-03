import mongoose from 'mongoose';
import Request from '../models/requestSchema.js';
import Faculty from '../models/facultySchema.js';
import ProjectCoordinator from '../models/projectCoordinatorSchema.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log("✅ DM Connected");
    } catch (err) {
        console.error("❌ DB Connection Error:", err);
        process.exit(1);
    }
};

const debugRequests = async () => {
    await connectDB();

    console.log("\n--- 1. Checking ALL Requests in DB ---");
    const allRequests = await Request.find({});
    console.log(`Total Requests Found: ${allRequests.length}`);
    allRequests.forEach(r => {
        console.log(`ID: ${r._id}, Status: ${r.status}, School: '${r.school}', Program: '${r.program}', ReqType: '${r.requestType}'`);
    });

    if (allRequests.length === 0) {
        console.log("❌ NO REQUESTS FOUND. The API logs said 201 Created, but DB is empty. Check DB connection strings.");
    } else {
        console.log("✅ Requests exist in DB.");
    }

    console.log("\n--- 2. Checking Coordinators ---");
    const coordinators = await ProjectCoordinator.find({}).populate('faculty');
    console.log(`Total Coordinators: ${coordinators.length}`);

    for (const coord of coordinators) {
        // Handle case where populate might fail or structure is different
        const name = coord.faculty?.name || "Unknown";
        console.log(`Coord: ${name}, School: '${coord.school}', Program: '${coord.program}'`);

        // Check filtering for this coordinator
        const matchedRequests = await Request.find({
            school: coord.school,
            program: coord.program
            // ignoring academicYear for loose check
        });
        console.log(`   -> Visible Requests: ${matchedRequests.length}`);
    }

    process.exit(0);
};

debugRequests();
