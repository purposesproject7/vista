// Set every faculty's `program` list to all programmes configured for their
// school in master data (by name). New faculty and programme changes keep this
// in step; this script backfills existing faculty.
//
//   node scripts/syncFacultyPrograms.js            # dry run
//   node scripts/syncFacultyPrograms.js --apply
//
// Uses the db in server/.env.
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const apply = process.argv.includes("--apply");

await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
const db = mongoose.connection.db;
console.log(`db: ${db.databaseName}${apply ? "" : "   (dry run — pass --apply to write)"}\n`);

const master = await db.collection("masterdatas").findOne({}, { projection: { schools: 1, programs: 1 } });
const faculties = db.collection("faculties");

for (const school of master?.schools || []) {
  const names = (master.programs || []).filter((p) => p.school === school.code).map((p) => p.name);
  // Faculty whose list isn't already exactly this set
  const filter = { school: school.code, $nor: [{ program: { $all: names, $size: names.length } }] };
  const n = await faculties.countDocuments(filter);
  console.log(`${school.code}: ${n} faculty -> [${names.join(", ")}]`);
  if (apply && n) await faculties.updateMany(filter, { $set: { program: names } });
}

const orphans = await faculties.countDocuments({ school: { $nin: (master?.schools || []).map((s) => s.code) } });
if (orphans) console.log(`\n${orphans} faculty have a school not in master data; left as is`);

await mongoose.disconnect();
