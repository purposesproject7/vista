import mongoose from "mongoose";
import dotenv from "dotenv";
import DepartmentConfig from "../../models/departmentConfigSchema.js";
import ProjectCoordinator from "../../models/projectCoordinatorSchema.js";
import connectDB from "../../utils/db.js";

dotenv.config({ path: "./server/.env" });

const updateDeadlines = async () => {
  try {
    await connectDB();
    console.log("Connected to DB");

    const academicYear = "2024-2025";
    const school = "SCOPE";
    const department = "CSE";
    const newDeadline = new Date("2026-05-30T23:59:59.000Z");

    console.log(
      `Updating deadlines for ${school} - ${department} (${academicYear}) to ${newDeadline.toISOString()}...`
    );

    // 1. Update DepartmentConfig
    const config = await DepartmentConfig.findOne({
      academicYear,
      school,
      department,
    });

    if (!config) {
      console.log("DepartmentConfig not found!");
    } else {
      config.featureLocks.forEach((lock) => {
        lock.deadline = newDeadline;
        lock.isLocked = false; // Unlock as well
      });
      await config.save();
      console.log("DepartmentConfig updated.");
    }

    // 2. Update ProjectCoordinators
    const coordinators = await ProjectCoordinator.find({
      academicYear,
      school,
      department,
    });
    console.log(`Found ${coordinators.length} coordinators.`);

    for (const coordinator of coordinators) {
      for (const key in coordinator.permissions) {
        if (
          coordinator.permissions[key] &&
          coordinator.permissions[key].deadline
        ) {
          coordinator.permissions[key].deadline = newDeadline;
        }
      }
      await coordinator.save();
    }
    console.log("ProjectCoordinators updated.");

    console.log("Done.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

updateDeadlines();
