// Rename a program value everywhere it is stored, e.g. fold "B.TECH(ALL)"
// into "B.Tech". Changes only that value: no document is deleted, and no
// other field is touched (raw collection writes, so no hooks or updatedAt).
//
//   node scripts/renameProgram.js "B.TECH(ALL)" "B.Tech"           # dry run
//   node scripts/renameProgram.js "B.TECH(ALL)" "B.Tech" --apply
//
// - single-value `program` fields: renamed in place
// - faculty `program` lists: old value swapped for the new one (no duplicate)
// - master data programs list: the old entry is removed
// - where a unique index already holds the new value (one config / marking
//   schema / primary coordinator per school+program+year), the document is
//   left as is and reported; a clashing coordinator assignment is set
//   isActive:false instead, so it stops appearing in the program dropdown
// - activity logs are history and are not rewritten
// Matching is exact but case-insensitive. Uses the db in server/.env.
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const [from, to] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const apply = process.argv.includes("--apply");
if (!from || !to) {
  console.error('usage: node scripts/renameProgram.js "<from>" "<to>" [--apply]');
  process.exit(1);
}

const match = new RegExp(`^${from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
const SINGLE = [
  "students", "projects", "panels", "marks", "requests", "accessrequests",
  "markingschemas", "componentlibraries", "programconfigs", "projectcoordinators",
];

await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
const db = mongoose.connection.db;
const existing = new Set((await db.listCollections().toArray()).map((c) => c.name));
console.log(`db: ${db.databaseName}   "${from}" -> "${to}"${apply ? "" : "   (dry run — pass --apply to write)"}\n`);

const isDuplicateKey = (e) => e?.code === 11000;

// One record per school+program+year in these (unique indexes). Renaming one
// onto an existing "<to>" record would clash; the dry run lists those first,
// because e.g. the "<to>" marking schema would then apply to renamed students.
const UNIQUE = {
  markingschemas: (d) => ({ school: d.school, academicYear: d.academicYear }),
  componentlibraries: (d) => ({ school: d.school, academicYear: d.academicYear }),
  programconfigs: (d) => ({ school: d.school, academicYear: d.academicYear }),
  projectcoordinators: (d) => (d.isPrimary ? { school: d.school, academicYear: d.academicYear, isPrimary: true } : null),
};

for (const name of SINGLE) {
  if (!existing.has(name)) continue;
  const col = db.collection(name);
  const docs = await col.find({ program: match }, { projection: { _id: 1, school: 1, academicYear: 1, isPrimary: 1 } }).toArray();
  if (!docs.length) continue;
  if (UNIQUE[name]) {
    for (const d of docs) {
      const key = UNIQUE[name](d);
      if (key && (await col.countDocuments({ ...key, program: to }))) {
        console.log(`  CLASH ${name} ${d._id} (${d.school}, ${d.academicYear}): a "${to}" record already exists` +
          (name === "projectcoordinators" ? " -> will be set inactive" : " -> will be left unchanged"));
      }
    }
  }
  let renamed = 0, deactivated = 0, skipped = 0;
  if (apply) {
    for (const { _id } of docs) {
      try {
        await col.updateOne({ _id }, { $set: { program: to } });
        renamed++;
      } catch (e) {
        if (!isDuplicateKey(e)) throw e;
        if (name === "projectcoordinators") {
          await col.updateOne({ _id }, { $set: { isActive: false } });
          deactivated++;
        } else {
          skipped++;
          console.log(`  ${name} ${_id}: a "${to}" record already exists for the same school/year; left unchanged`);
        }
      }
    }
  }
  console.log(`${name.padEnd(20)} ${docs.length} found` +
    (apply ? `  -> renamed ${renamed}${deactivated ? `, deactivated ${deactivated} (already had "${to}")` : ""}${skipped ? `, left ${skipped}` : ""}` : ""));
}

// Faculty belong to several programs: swap the value inside the list.
if (existing.has("faculties")) {
  const col = db.collection("faculties");
  const docs = await col.find({ program: match }, { projection: { program: 1 } }).toArray();
  if (docs.length) {
    if (apply) {
      for (const d of docs) {
        const list = (Array.isArray(d.program) ? d.program : [d.program]).map((p) => (match.test(p) ? to : p));
        await col.updateOne({ _id: d._id }, { $set: { program: [...new Set(list)] } });
      }
    }
    console.log(`${"faculties".padEnd(20)} ${docs.length} found${apply ? `  -> value replaced in ${docs.length}` : ""}`);
  }
}

// Master data: drop the program from the list of choices.
if (existing.has("masterdatas")) {
  const col = db.collection("masterdatas");
  const n = await col.countDocuments({ "programs.name": match });
  if (n) {
    if (apply) await col.updateMany({}, { $pull: { programs: { name: match } } });
    console.log(`${"masterdatas".padEnd(20)} ${n} found${apply ? "  -> removed from the programs list" : ""}`);
  }
}

console.log(apply ? "\nDone." : "\nNothing written. Re-run with --apply.");
await mongoose.disconnect();
