import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

// Models
import Faculty from "../models/facultySchema.js";
import ProjectCoordinator from "../models/projectCoordinatorSchema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const createUsers = async () => {
  await connectDB();

  try {
    // 1. Create Admin
    const adminPassword = await bcrypt.hash("Vitadmin@123", 10);
    const adminData = {
      name: "System Admin",
      emailId: "admin@vit.ac.in",
      employeeId: "ADMIN001",
      phoneNumber: "9999999999",
      password: adminPassword,
      role: "admin",
      school: "SCOPE",
      program: "B.Tech CSE", // Optional but providing default
      isActive: true,
      isProjectCoordinator: false,
    };

    const admin = await Faculty.findOneAndUpdate(
      { emailId: "admin@vit.ac.in" },
      { $set: adminData },
      { new: true, upsert: true }
    );
    console.log(`Upserted Admin: ${admin.emailId}`);

    // 2. Create Project Coordinator
    const pcPassword = await bcrypt.hash("password123", 10);
    const pcData = {
      name: "Project Coordinator",
      emailId: "pc@vista.com",
      employeeId: "PC001",
      phoneNumber: "8888888888",
      password: pcPassword,
      role: "faculty", // Base role is faculty
      school: "SCOPE",
      program: "B.Tech CSE",
      isActive: true,
      isProjectCoordinator: true,
    };

    const pc = await Faculty.findOneAndUpdate(
      { emailId: "pc@vista.com" },
      { $set: pcData },
      { new: true, upsert: true }
    );
    console.log(`Upserted Faculty (PC): ${pc.emailId}`);

    // Also update ProjectCoordinator collection
    await ProjectCoordinator.findOneAndUpdate(
      { faculty: pc._id },
      {
        $set: {
          faculty: pc._id,
          school: pcData.school,
          program: pcData.program,
          academicYear: "2024-2025",
          isPrimary: true,
          isActive: true,
        },
      },
      { upsert: true }
    );
    console.log(`Upserted ProjectCoordinator record for: ${pc.emailId}`);

    console.log("User creation completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("User creation failed:", error);
    process.exit(1);
  }
};

createUsers();
