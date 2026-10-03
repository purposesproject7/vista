import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

// Models
import Faculty from "../models/facultySchema.js";
import Student from "../models/studentSchema.js";
import ProjectCoordinator from "../models/projectCoordinatorSchema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

import dns from "dns";
// Fix for "querySrv ECONNREFUSED" error with MongoDB Atlas
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (err) {
  console.warn("Failed to set DNS servers:", err.message);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const school = process.env.TEST_ACCOUNTS_SCHOOL || "SCOPE";
const program = process.env.TEST_ACCOUNTS_PROGRAM || "CSE";
const academicYear = process.env.TEST_ACCOUNTS_ACADEMIC_YEAR || "2024-2025";

async function upsertFaculty({ email, password, name, employeeId, isProjectCoordinator }) {
  if (!email || !password) return null;

  const hashedPassword = await bcrypt.hash(password, 10);

  const faculty = await Faculty.findOneAndUpdate(
    { employeeId },
    {
      $set: {
        name,
        emailId: email,
        employeeId,
        phoneNumber: "9999999998",
        password: hashedPassword,
        role: "faculty",
        school,
        program: [program],
        specialization: "General",
        isActive: true,
        isProjectCoordinator,
        // Burner test accounts should be immediately usable — no forced setup-password step.
        isDefaultPassword: false,
      },
    },
    { returnDocument: "after", upsert: true, runValidators: true }
  );

  console.log(`  Faculty: ${faculty.name} <${faculty.emailId}> (${faculty.employeeId})`);
  return faculty;
}

async function upsertCoordinatorAssignment(facultyDoc) {
  if (!facultyDoc) return;

  // isPrimary left false so this never collides with a real primary coordinator
  // that may already be assigned to this school/program/academicYear in a shared DB
  // (ProjectCoordinator has a unique partial index on isPrimary:true per context).
  const enabled = { enabled: true, deadline: null };

  await ProjectCoordinator.findOneAndUpdate(
    { faculty: facultyDoc._id, school, program, academicYear },
    {
      $set: {
        faculty: facultyDoc._id,
        school,
        program,
        academicYear,
        isPrimary: false,
        isActive: true,
        permissions: {
          student_management: enabled,
          faculty_management: enabled,
          project_management: enabled,
          panel_management: enabled,
        },
      },
    },
    { returnDocument: "after", upsert: true, runValidators: true }
  );

  console.log(`  Coordinator assignment: ${facultyDoc.emailId} -> ${school}/${program}/${academicYear}`);
}

async function upsertStudent({ email, password, name, regNo }) {
  if (!email || !password) return null;

  const hashedPassword = await bcrypt.hash(password, 10);

  const student = await Student.findOneAndUpdate(
    { regNo, academicYear },
    {
      $set: {
        regNo,
        name,
        emailId: email,
        phoneNumber: "9999999997",
        PAT: false,
        school,
        program,
        academicYear,
        isActive: true,
        password: hashedPassword,
        role: "student",
        // Burner test accounts should be immediately usable — no forced setup-password step.
        isDefaultPassword: false,
      },
    },
    { returnDocument: "after", upsert: true, runValidators: true }
  );

  console.log(`  Student: ${student.name} <${student.emailId}> (${student.regNo})`);
  return student;
}

const setupTestAccounts = async () => {
  await connectDB();

  try {
    console.log("\n=== Creating/Updating dummy test accounts ===");
    console.log(`Context: ${school} / ${program} / ${academicYear}`);
    console.log("These are burner credentials for QA/testing only.\n");

    console.log("Faculty:");
    await upsertFaculty({
      email: process.env.TEST_FACULTY1_EMAIL,
      password: process.env.TEST_FACULTY1_PASSWORD,
      name: process.env.TEST_FACULTY1_NAME || "Test Faculty One",
      employeeId: process.env.TEST_FACULTY1_EMPLOYEE_ID || "TESTFAC001",
      isProjectCoordinator: false,
    });
    await upsertFaculty({
      email: process.env.TEST_FACULTY2_EMAIL,
      password: process.env.TEST_FACULTY2_PASSWORD,
      name: process.env.TEST_FACULTY2_NAME || "Test Faculty Two",
      employeeId: process.env.TEST_FACULTY2_EMPLOYEE_ID || "TESTFAC002",
      isProjectCoordinator: false,
    });

    console.log("\nProject Coordinator:");
    const coordinatorFaculty = await upsertFaculty({
      email: process.env.TEST_COORDINATOR_EMAIL,
      password: process.env.TEST_COORDINATOR_PASSWORD,
      name: process.env.TEST_COORDINATOR_NAME || "Test Project Coordinator",
      employeeId: process.env.TEST_COORDINATOR_EMPLOYEE_ID || "TESTPC001",
      isProjectCoordinator: true,
    });
    await upsertCoordinatorAssignment(coordinatorFaculty);

    console.log("\nStudents:");
    await upsertStudent({
      email: process.env.TEST_STUDENT1_EMAIL,
      password: process.env.TEST_STUDENT1_PASSWORD,
      name: process.env.TEST_STUDENT1_NAME || "Test Student One",
      regNo: process.env.TEST_STUDENT1_REGNO || "23TESTCSE001",
    });
    await upsertStudent({
      email: process.env.TEST_STUDENT2_EMAIL,
      password: process.env.TEST_STUDENT2_PASSWORD,
      name: process.env.TEST_STUDENT2_NAME || "Test Student Two",
      regNo: process.env.TEST_STUDENT2_REGNO || "23TESTCSE002",
    });

    console.log("\n✅ SUCCESS: Dummy test accounts created/updated.");
    console.log("   (Credentials are read from your .env — see .env.docker.example for the variable list.)\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR: Failed to set up test accounts");
    console.error(error);
    process.exit(1);
  }
};

setupTestAccounts();
