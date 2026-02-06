
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ DM Connected");
    } catch (err) {
        console.error("❌ DB Connection Error:", err);
        process.exit(1);
    }
};

const debugRequests = async () => {
    await connectDB();

    console.log("\n--- 1. Checking ALL Requests in DB (Raw Query) ---");
    // Access collection directly to avoid Model schema import issues
    const collection = mongoose.connection.collection('requests');
    const allRequests = await collection.find({}).toArray();

    console.log(`Total Requests Found: ${allRequests.length}`);
    allRequests.forEach(r => {
        console.log(`ID: ${r._id}, Status: ${r.status}, School: '${r.school}', Program: '${r.program}', ReqType: '${r.requestType}'`);
    });

    if (allRequests.length === 0) {
        console.log("❌ NO REQUESTS FOUND.");
    } else {
        console.log("✅ Requests exist in DB.");
    }

    console.log("\n--- 2. Checking Coordinators (Raw Query) ---");
    const coordCollection = mongoose.connection.collection('projectcoordinators');
    const coordinators = await coordCollection.find({}).toArray();

    console.log(`Total Coordinators: ${coordinators.length}`);

    for (const coord of coordinators) {
        console.log(`Coord ID: ${coord._id}, School: '${coord.school}', Program: '${coord.program}'`);

        // Check filtering
        const matchedRequests = allRequests.filter(r =>
            r.school === coord.school &&
            r.program === coord.program
        );
        console.log(`   -> Visible Requests: ${matchedRequests.length}`);
    }

    process.exit(0);
};

debugRequests();
