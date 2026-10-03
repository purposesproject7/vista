// Sync the comparison corpus with approved title/abstracts:
//  1. drop embeddings from projects mid-submission (pending, rejected, ...),
//     which older versions stored at submit time;
//  2. embed every project with an approved abstract but no embedding from the
//     current model — past projects, imports, acceptances whose embedding
//     failed, and everything after an EMBEDDING_MODEL change.
// Uses project.name + project.abstract, the fields a guide's acceptance locks;
// never the proposed (unapproved) ones. Also downloads/warms the model, so it
// runs on every deploy. Safe to re-run.
//   node scripts/backfillEmbeddings.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Project from "../models/projectSchema.js";
import { embed, embeddingText, MODEL } from "../services/similarityService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);

// not_started/unset = never submitted, so any embedding came from an approved abstract.
const { modifiedCount } = await Project.updateMany(
  {
    titleAbstractStatus: { $nin: ["accepted", "not_started", null] },
    "abstractEmbedding.0": { $exists: true },
  },
  { $unset: { abstractEmbedding: 1 } }
);
console.log(`Removed ${modifiedCount} embeddings of unapproved submissions.`);

const projects = await Project.find({
  $or: [{ "abstractEmbedding.0": { $exists: false } }, { abstractEmbeddingModel: { $ne: MODEL } }],
  abstract: { $nin: [null, ""] },
})
  .select("name abstract")
  .lean();

console.log(`Embedding ${projects.length} projects with ${MODEL}...`);
let done = 0;
for (const p of projects) {
  const text = embeddingText(p.name, p.abstract);
  await Project.updateOne(
    { _id: p._id },
    { abstractEmbedding: await embed(text), abstractEmbeddingModel: MODEL }
  );
  if (++done % 100 === 0) console.log(`  ${done}/${projects.length}`);
}

console.log(`Done: ${done} projects embedded.`);
await mongoose.connection.close();
