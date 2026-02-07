import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Models
import Faculty from "../../models/facultySchema.js";
import Student from "../../models/studentSchema.js";
import Project from "../../models/projectSchema.js";
import ProjectCoordinator from "../../models/projectCoordinatorSchema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const loadData = async (filename) => {
  const filePath = path.join(__dirname, "data", filename);
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data);
};

const seedFaculty = async () => {
  console.log("Seeding Faculty...");
  const facultyList = await loadData("faculty.json");

  for (const f of facultyList) {
    // Hash password if not already encrypted (assuming simple check or just always hash plain text from json)
    // To allow rerunning, we might need to check if password changed, but for dummy data, let's just hash.
    const hashedPassword = await bcrypt.hash(f.password, 10);

    const facultyData = { ...f, password: hashedPassword };
    delete facultyData.isProjectCoordinator; // Handled separately

    const updatedFaculty = await Faculty.findOneAndUpdate(
      { emailId: f.emailId },
      { $set: facultyData },
      { new: true, upsert: true }
    );
    console.log(`Upserted Faculty: ${updatedFaculty.emailId}`);

    if (f.isProjectCoordinator) {
      await ProjectCoordinator.findOneAndUpdate(
        { faculty: updatedFaculty._id },
        {
          $set: {
            faculty: updatedFaculty._id,
            school: f.school,
            program: f.program,
            academicYear: "2023-2024", // Updated to match dataset
            isPrimary: true, // Defaulting to true for dummy data
            isActive: true,
          },
        },
        { upsert: true }
      );
      console.log(
        `Upserted Project Coordinator for: ${updatedFaculty.emailId}`
      );
    }
  }
};

const seedStudents = async () => {
  console.log("Seeding Students...");
  const studentList = await loadData("students.json");

  for (const s of studentList) {
    const updatedStudent = await Student.findOneAndUpdate(
      { regNo: s.regNo },
      { $set: s },
      { new: true, upsert: true }
    );
    console.log(`Upserted Student: ${updatedStudent.regNo}`);
  }
};

const seedProjects = async () => {
  console.log("Seeding Projects...");
  const projectList = await loadData("projects.json");

  for (const p of projectList) {
    // Resolve guide
    const guide = await Faculty.findOne({ employeeId: p.guideFacultyEmpId });
    if (!guide) {
      console.warn(
        `Guide not found for project ${p.name}: ${p.guideFacultyEmpId}`
      );
      continue;
    }

    // Resolve students
    const studentIds = [];
    // JSON uses "students" array of regNos, not "studentRegNos"
    if (p.students && Array.isArray(p.students)) {
      for (const regNo of p.students) {
        const student = await Student.findOne({ regNo });
        if (student) {
          studentIds.push(student._id);
        } else {
          console.warn(`Student not found for project ${p.name}: ${regNo}`);
        }
      }
    }

    const projectData = {
      ...p,
      guideFaculty: guide._id,
      students: studentIds,
      teamSize: studentIds.length || 1, // Default team size if calc fails, though schema requires it
    };
    delete projectData.guideFacultyEmpId;
    // delete projectData.students; // We overwrite 'students' key but since p has it, spread operator + overwrite handles it.
    // Actually, 'students' key in p is array of strings. We overwrite it with array of ObjectIds in line 116.
    // So we don't strictly need to delete the old key if we overwrite it, but cleaning up is good.
    // However, if we don't delete `guideEmail` (which doesn't exist) nothing happens.
    // We should delete the old properties if they conflict or just let the overwrite happen.
    // p.students (strings) -> projectData.students (ObjectIds). Correct.

    await Project.findOneAndUpdate(
      { name: p.name },
      { $set: projectData },
      { upsert: true }
    );
    console.log(`Upserted Project: ${p.name}`);
  }
};

// Master Data
import MasterData from "../../models/masterDataSchema.js";

const seedMasterData = async () => {
  console.log("Seeding Master Data...");

  // Load raw data to extract master data
  const facultyList = await loadData("faculty.json");
  const studentList = await loadData("students.json");
  const projectList = await loadData("projects.json");

  const schoolsMap = new Map();
  const programsMap = new Map();
  const yearsMap = new Map();

  // Helper to collect data
  const collect = (list) => {
    list.forEach((item) => {
      // Collect Schools
      if (item.school) {
        if (!schoolsMap.has(item.school)) {
          schoolsMap.set(item.school, {
            name: item.school,
            code: item.school, // Use name as code to match JSON references
            isActive: true,
          });
        }
      }

      // Collect Programs
      if (item.program && item.school) {
        const key = `${item.school}|${item.program}`;
        if (!programsMap.has(key)) {
          programsMap.set(key, {
            school: item.school,
            name: item.program,
            code: item.program, // Use name as code to match JSON references
            isActive: true,
          });
        }
      }

      // Collect Academic Years
      if (item.academicYear) {
        if (!yearsMap.has(item.academicYear)) {
          yearsMap.set(item.academicYear, {
            year: item.academicYear,
            isActive: true,
            isCurrent: item.academicYear === "2024-2025",
          });
        }
      }
    });
  };

  collect(facultyList);
  collect(studentList);
  collect(projectList);

  // Check if a Master Data doc exists or create new
  let masterData = await MasterData.findOne();
  if (!masterData) {
    masterData = new MasterData({
      schools: [],
      programs: [],
      academicYears: [],
    });
  }

  // Update Schools
  for (const s of schoolsMap.values()) {
    const exists = masterData.schools.find(
      (ex) => ex.code === s.code || ex.name === s.name
    );
    if (!exists) {
      masterData.schools.push(s);
    }
  }

  // Update Programs
  for (const p of programsMap.values()) {
    const exists = masterData.programs.find(
      (ex) =>
        ex.school === p.school &&
        (ex.code === p.code || ex.name === p.name)
    );
    if (!exists) {
      masterData.programs.push(p);
    }
  }

  // Update Academic Years
  for (const y of yearsMap.values()) {
    const exists = masterData.academicYears.find((ex) => ex.year === y.year);
    if (!exists) {
      masterData.academicYears.push(y);
    } else {
      // Ensure isCurrent is updated if needed
      if (y.isCurrent) {
        // Unset other current years if simple logic, but for now just ensure this one is true
        // Real logic might need to unset others, but let's stick to safe upsert
        exists.isCurrent = true;
      }
    }
  }

  await masterData.save();
  console.log("Master Data Seeded Successfully.");
  console.log(`Schools: ${masterData.schools.length}`);
  console.log(`Programs: ${masterData.programs.length}`);
  console.log(`Years: ${masterData.academicYears.length}`);
};

const seed = async () => {
  await connectDB();
  try {
    console.log("Clearing existing data...");
    await Faculty.deleteMany({});
    await Student.deleteMany({});
    await Project.deleteMany({});
    await ProjectCoordinator.deleteMany({});
    console.log("Data cleared.");

    await seedMasterData();
    await seedFaculty();
    await seedStudents();
    await seedProjects();
    console.log("Seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seed();
