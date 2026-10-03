import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Marks from "./models/marksSchema.js";
import Project from "./models/projectSchema.js";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const unsubmitted = await Marks.find({ isSubmitted: false });
  console.log(`Unsubmitted marks: ${unsubmitted.length}`);
  if (unsubmitted.length > 0) {
    console.log(unsubmitted[0]);
  }

  // check if any duplicate students in any project
  const projects = await Project.find();
  let hasDuplicates = false;
  for (const p of projects) {
    const sids = p.students.map(s => s.toString());
    const unique = new Set(sids);
    if (sids.length !== unique.size) {
      console.log(`Project ${p._id} has duplicate students:`, sids);
      hasDuplicates = true;
    }
  }
  if (!hasDuplicates) console.log("No duplicate students in projects.");

  await mongoose.disconnect();
}
run();
