import mongoose from "mongoose";
import dotenv from "dotenv";
import ProjectCoordinator from "./models/projectCoordinatorSchema.js";
import Faculty from "./models/facultySchema.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const coordinators = await ProjectCoordinator.find({});
        console.log(`Found ${coordinators.length} coordinators. Updating permissions...`);

        const futureDate = new Date("2030-12-31T23:59:59.000Z");

        for (const c of coordinators) {
            if (!c.permissions) c.permissions = {};

            const features = [
                "student_management",
                "faculty_management",
                "project_management",
                "panel_management"
            ];

            let updated = false;
            for (const feature of features) {
                if (c.permissions[feature] && c.permissions[feature].enabled) {
                    c.permissions[feature].deadline = futureDate;
                    updated = true;
                    console.log(`Updated deadline for ${feature} for coordinator ${c._id}`);
                }
            }

            if (updated) {
                c.markModified("permissions");
                await c.save();
            }
        }

        console.log("Update complete.");

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

run();
