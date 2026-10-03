import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Marks from "./models/marksSchema.js";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const studentId = new mongoose.Types.ObjectId();
  const projectId = new mongoose.Types.ObjectId();
  const facultyId = new mongoose.Types.ObjectId();
  
  const m1 = new Marks({
    student: studentId,
    project: projectId,
    reviewType: "review_1",
    faculty: facultyId,
    facultyType: "guide",
    academicYear: "2023",
    school: "SCOPE",
    program: "BTECH",
    totalMarks: 10,
    maxTotalMarks: 20
  });

  const m2 = new Marks({
    student: studentId,
    project: projectId,
    reviewType: "review_1",
    faculty: facultyId,
    facultyType: "guide",
    academicYear: "2023",
    school: "SCOPE",
    program: "BTECH",
    totalMarks: 15,
    maxTotalMarks: 20
  });

  try {
    await Promise.all([m1.save(), m2.save()]);
    console.log("Saved both");
  } catch (err) {
    console.error("Error:", err.message);
  }

  await mongoose.disconnect();
}
run();
