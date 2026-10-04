// Sync the comparison corpus with approved title/abstracts:
//  1. drop embeddings from projects mid-submission (pending, rejected, ...),
//     which older versions stored at submit time;
//  2. embed every project with an approved abstract but no embedding from the
//     current model — past projects, imports, acceptances whose embedding
//     failed, and everything after an EMBEDDING_MODEL change.
//  3. seed the common reference projects (data/referenceProjects.json) and
//     embed them, so the check has a baseline before anything is approved.
// Uses project.name + project.abstract, the fields a guide's acceptance locks;
// never the proposed (unapproved) ones. Also downloads/warms the model, so it
// runs on every deploy. Safe to re-run.
//   node scripts/backfillEmbeddings.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import Project from "../models/projectSchema.js";
import ReferenceProject from "../models/referenceProjectSchema.js";
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

// 3. Reference projects: add new ones, update changed text (re-embedded
// below), then embed any without a current-model embedding.
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/referenceProjects.json"), "utf8"));
let added = 0, changed = 0;
for (const r of seed) {
  const existing = await ReferenceProject.findOne({ title: r.title }).lean();
  if (!existing) {
    await ReferenceProject.create({ title: r.title, abstract: r.abstract, domain: r.domain });
    added++;
  } else if (existing.abstract !== r.abstract || existing.domain !== r.domain) {
    await ReferenceProject.updateOne(
      { _id: existing._id },
      { $set: { abstract: r.abstract, domain: r.domain }, $unset: { abstractEmbeddingModel: 1 } }
    );
    changed++;
  }
}
const refs = await ReferenceProject.find({ abstractEmbeddingModel: { $ne: MODEL } }).select("title abstract").lean();
for (const r of refs) {
  await ReferenceProject.updateOne(
    { _id: r._id },
    { abstractEmbedding: await embed(embeddingText(r.title, r.abstract)), abstractEmbeddingModel: MODEL }
  );
}
console.log(`Reference projects: ${seed.length} in seed file, ${added} added, ${changed} updated, ${refs.length} embedded.`);
await mongoose.connection.close();
