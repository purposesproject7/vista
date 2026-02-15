
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

console.log("URI: " + MONGO_URI);

async function listDBs() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected. Listing Databases...");

        const admin = new mongoose.mongo.Admin(mongoose.connection.db);
        const dbs = await admin.listDatabases();
        console.log("Databases Found:");
        dbs.databases.forEach(db => console.log(` - ${db.name} (Size: ${db.sizeOnDisk})`));

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

listDBs();
