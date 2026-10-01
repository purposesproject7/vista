// Embed every project that has a title/abstract but no embedding yet, so past
// projects become the corpus new submissions are compared against.
// Also downloads/warms the model, so run it once on deploy:
//   node scripts/backfillEmbeddings.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Project from "../models/projectSchema.js";
import { embed, embeddingText } from "../services/similarityService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);

const projects = await Project.find({
  "abstractEmbedding.0": { $exists: false },
  $or: [
    { proposedAbstract: { $nin: [null, ""] } },
    { abstract: { $nin: [null, ""] } },
  ],
})
  .select("name proposedTitle proposedAbstract abstract")
  .lean();

console.log(`Embedding ${projects.length} projects...`);
let done = 0;
for (const p of projects) {
  const text = embeddingText(p.proposedTitle || p.name, p.proposedAbstract || p.abstract);
  await Project.updateOne({ _id: p._id }, { abstractEmbedding: await embed(text) });
  if (++done % 100 === 0) console.log(`  ${done}/${projects.length}`);
}

console.log(`Done: ${done} projects embedded.`);
await mongoose.connection.close();
