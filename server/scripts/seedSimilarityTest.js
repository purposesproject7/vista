// Test data for trying the title/abstract + duplicate-project flow by hand:
// one guide and 5 one-student teams (one per test abstract), all guided by
// that guide, in a school/program/year that has a marking schema (without
// one the guide dashboard shows no teams).
//
//   TEST_PASSWORD='...' node scripts/seedSimilarityTest.js          # create
//   TEST_PASSWORD='...' node scripts/seedSimilarityTest.js --school SCOPE --program IDP --year "Fall Semester 2026-27"
//   node scripts/seedSimilarityTest.js --remove                     # delete it all
//
// Logins: test.guide@vit.ac.in and testsim1..5@vitstudent.ac.in, all with
// TEST_PASSWORD. Re-running is safe: existing test records are kept, and every
// run (re)sets all six test logins to TEST_PASSWORD. Uses the db in server/.env.
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import Faculty from "../models/facultySchema.js";
import Student from "../models/studentSchema.js";
import Project from "../models/projectSchema.js";
import MarkingSchema from "../models/markingSchema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const school = arg("school", "SCOPE");
const program = arg("program", "IDP");
const academicYear = arg("year", "Fall Semester 2026-27");
const TEAMS = 5;

const GUIDE = { emailId: "test.guide@vit.ac.in", employeeId: "TESTGUIDE01" };
const student = (i) => ({ regNo: `TESTSIM0${i}`, emailId: `testsim${i}@vitstudent.ac.in` });
const projectName = (i) => `Similarity Test Team ${i}`;

await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
console.log(`db: ${mongoose.connection.name}`);

if (process.argv.includes("--remove")) {
  const guide = await Faculty.findOne({ employeeId: GUIDE.employeeId });
  const p = await Project.deleteMany({
    name: { $in: [...Array(TEAMS)].map((_, i) => projectName(i + 1)) },
    ...(guide ? { guideFaculty: guide._id } : {}),
  });
  const s = await Student.deleteMany({ regNo: { $in: [...Array(TEAMS)].map((_, i) => student(i + 1).regNo) } });
  const f = await Faculty.deleteOne({ employeeId: GUIDE.employeeId });
  console.log(`removed: ${p.deletedCount} projects, ${s.deletedCount} students, ${f.deletedCount} guide`);
  await mongoose.disconnect();
  process.exit(0);
}

const password = process.env.TEST_PASSWORD;
if (!password || password.length < 8) {
  console.error("Set TEST_PASSWORD (8+ characters) for the test logins.");
  process.exit(1);
}

// The guide dashboard needs a marking schema for the context to list teams.
if (!(await MarkingSchema.exists({ school, program, academicYear }))) {
  const options = await MarkingSchema.find({}, { school: 1, program: 1, academicYear: 1, _id: 0 }).lean();
  console.error(`No marking schema for ${school} / ${program} / ${academicYear}. Pick one of:`);
  options.forEach((o) => console.error(`  --school "${o.school}" --program "${o.program}" --year "${o.academicYear}"`));
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);

let guide = await Faculty.findOne({ employeeId: GUIDE.employeeId });
if (guide) {
  await Faculty.updateOne({ _id: guide._id }, { $set: { password: hash, isActive: true, isDefaultPassword: false } });
} else {
  guide = await Faculty.create({
    ...GUIDE,
    name: "Test Guide",
    phoneNumber: "0000000000",
    password: hash,
    role: "faculty",
    school,
    program: [program],
    isDefaultPassword: false,
  });
}

for (let i = 1; i <= TEAMS; i++) {
  let s = await Student.findOne({ regNo: student(i).regNo });
  if (s) {
    await Student.updateOne({ _id: s._id }, { $set: { password: hash, isActive: true, isDefaultPassword: false } });
  } else {
    s = await Student.create({
      ...student(i),
      name: `Test Student ${i}`,
      school,
      program,
      academicYear,
      password: hash,
      isDefaultPassword: false,
      isActive: true,
    });
  }
  if (!(await Project.exists({ name: projectName(i), guideFaculty: guide._id }))) {
    await Project.create({
      name: projectName(i),
      students: [s._id],
      guideFaculty: guide._id,
      school,
      program,
      academicYear,
      type: "software",
      teamSize: 1,
    });
  }
}

console.log(`Context: ${school} / ${program} / ${academicYear}`);
console.log(`Guide:    ${GUIDE.emailId}`);
for (let i = 1; i <= TEAMS; i++) console.log(`Team ${i}:   ${student(i).emailId}  (${projectName(i)})`);
// Prove the stored hash accepts the password, the same way login checks it.
const stored = await Faculty.findOne({ employeeId: GUIDE.employeeId }).select("+password").lean();
if (!(await bcrypt.compare(password, stored.password))) throw new Error("password check failed after seeding");
console.log("All use TEST_PASSWORD (verified). Remove everything later with --remove.");
await mongoose.disconnect();
