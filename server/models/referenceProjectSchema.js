import mongoose from "mongoose";

// Commonly done student projects (server/data/referenceProjects.json), seeded
// by scripts/backfillEmbeddings.js. A baseline for the duplicate-project check
// so it has something to compare against before any projects are approved.
// Matches against these only flag a submission for the guide, never reject it:
// doing a common project is allowed, copying another team's is not.
const referenceProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, unique: true },
    abstract: { type: String, required: true },
    domain: { type: String, default: "" },
    abstractEmbedding: { type: [Number], select: false, default: undefined },
    abstractEmbeddingModel: { type: String, default: undefined },
  },
  { timestamps: true }
);

const ReferenceProject = mongoose.model("ReferenceProject", referenceProjectSchema);

export default ReferenceProject;
