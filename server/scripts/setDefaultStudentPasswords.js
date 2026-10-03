// Set every student's password to the default Vit<regNo>@123 (bcrypt-hashed).
// Writes ONLY the `password` field — via the raw collection, so no hooks run
// and updatedAt is left as is. Students who set their own password
// (isDefaultPassword === false) are skipped. Uses the db in server/.env.
//   node scripts/setDefaultStudentPasswords.js            # dry run
//   node scripts/setDefaultStudentPasswords.js --apply
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import Student from "../models/studentSchema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const apply = process.argv.includes("--apply");
const defaultPassword = (regNo) => `Vit${regNo}@123`;

await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
console.log(`db: ${mongoose.connection.name}${apply ? "" : "  (dry run — pass --apply to write)"}`);

const students = await Student.collection
  .find({ isDefaultPassword: { $ne: false }, regNo: { $nin: [null, ""] } })
  .project({ regNo: 1 })
  .toArray();

let updated = 0;
for (const s of students) {
  if (apply) {
    const hash = await bcrypt.hash(defaultPassword(s.regNo), 10);
    await Student.collection.updateOne({ _id: s._id }, { $set: { password: hash } });
    // Prove the stored hash logs in exactly the way authController checks it.
    const { password } = await Student.collection.findOne({ _id: s._id }, { projection: { password: 1 } });
    if (!(await bcrypt.compare(defaultPassword(s.regNo), password))) {
      throw new Error(`verify failed for ${s.regNo}`);
    }
  }
  updated++;
  if (apply && updated % 250 === 0) console.log(`  ${updated}/${students.length}`);
}

const skipped = await Student.collection.countDocuments({ isDefaultPassword: false });
console.log(`${apply ? "updated" : "would update"}: ${updated}`);
console.log(`skipped (changed their own password): ${skipped}`);
await mongoose.disconnect();
