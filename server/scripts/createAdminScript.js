import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "../utils/db.js";
import Faculty from "../models/facultySchema.js";

// ✅ Load .env BEFORE accessing process.env
dotenv.config({ path: "C:/Users/irk/Desktop/CPMS - Refactored/server/.env" });

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI missing. Check .env and path.");
  process.exit(1);
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME;
const ADMIN_EMPLOYEE_ID = process.env.ADMIN_EMPLOYEE_ID;
const ADMIN_SCHOOL = process.env.ADMIN_SCHOOL;
const ADMIN_DEPARTMENT = process.env.ADMIN_DEPARTMENT;

const createAdmin = async () => {
  console.log("Connecting to database...");
  await connectDB();

  try {
    console.log(`Checking if admin user ${ADMIN_EMAIL} already exists...`);
    const existingAdmin = await Faculty.findOne({ emailId: ADMIN_EMAIL });

    if (existingAdmin) {
      console.log(`✅ Admin user ${ADMIN_EMAIL} already exists. No action taken.`);
      return;
    }

    console.log("Hashing admin password...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // ✅ FIX: Remove arrays, use strings directly
    const adminUser = new Faculty({
      name: ADMIN_NAME,
      emailId: ADMIN_EMAIL,
      password: hashedPassword,
      employeeId: ADMIN_EMPLOYEE_ID,
      role: "admin",
      school: ADMIN_SCHOOL,              // ✅ String, not array
      department: ADMIN_DEPARTMENT,      // ✅ String, not array
      phoneNumber: "9940573903",
      specialization: "",                // ✅ Empty string or omit entirely
      isProjectCoordinator: false,
      isActive: true,
    });

    await adminUser.save();
    console.log(`✅ Successfully created admin user: ${ADMIN_NAME} (${ADMIN_EMAIL})`);
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
  } finally {
    console.log("Disconnecting from database...");
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
};

createAdmin();
