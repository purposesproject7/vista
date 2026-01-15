import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import ProjectCoordinator from "./models/projectCoordinatorSchema.js";
import AccessRequest from "./models/accessRequestSchema.js";
import Faculty from "./models/facultySchema.js";

dotenv.config();

const run = async () => {
    let output = "";
    const log = (msg) => {
        console.log(msg);
        output += msg + "\n";
    };

    try {
        await mongoose.connect(process.env.MONGO_URI);
        log("Connected to MongoDB");

        const coordinators = await ProjectCoordinator.find({}).populate("faculty");
        log(`Found ${coordinators.length} coordinators`);

        for (const c of coordinators) {
            log(`\nCoordinator: ${c.faculty?.name} (${c.faculty?.emailId})`);
            log(`Context: ${c.school} | ${c.program} | ${c.academicYear}`);
            log("Permissions: " + JSON.stringify(c.permissions, null, 2));
        }

        const requests = await AccessRequest.find({}).sort({ submittedAt: -1 }).limit(5).populate("requestedBy");
        log(`\nLast 5 Access Requests:`);
        for (const r of requests) {
            log(`- Status: ${r.status}, Feature: ${r.featureName}, User: ${r.requestedBy?.emailId} (${r.requestedBy?._id})`);
        }

        fs.writeFileSync("debug_perms.txt", output);

    } catch (err) {
        console.error(err);
        fs.writeFileSync("debug_perms.txt", "Error: " + err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

run();
