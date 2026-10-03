import { pipeline } from "@huggingface/transformers";
import Project from "../models/projectSchema.js";
import { logger } from "../utils/logger.js";

// Runs locally on CPU; the model downloads once to the transformers cache.
// Chosen by benchmark (see SIMILARITY_CHECK.md): reads up to 8192 tokens, so a
// full 500-word abstract counts; 512-token models silently drop the tail.
export const MODEL = process.env.EMBEDDING_MODEL || "Snowflake/snowflake-arctic-embed-m-v2.0";
const TOP_K = 3;

let extractorPromise = null;

function getExtractor() {
  extractorPromise ??= pipeline("feature-extraction", MODEL, { dtype: "q8" });
  return extractorPromise;
}

export function embeddingText(title, abstract) {
  return `${title}\n${abstract}`;
}

/** Normalized embedding vector (plain array), so cosine similarity = dot product. */
export async function embed(text) {
  const extractor = await getExtractor();
  // CLS pooling: what arctic-embed (and BGE) are trained with.
  const output = await extractor(text, { pooling: "cls", normalize: true });
  return Array.from(output.data);
}

function dot(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

/**
 * Top matches among every other project that has an embedding (approved
 * title/abstracts only, see acceptTitleAbstract and the backfill), as
 * { project, title, academicYear, score } with score 0-100.
 */
export async function findSimilar(vector, excludeProjectId) {
  // ponytail: brute-force scan over all stored vectors; fine for tens of
  // thousands of projects, switch to a vector index beyond that.
  const candidates = await Project.find({
    _id: { $ne: excludeProjectId },
    abstractEmbeddingModel: MODEL,
  })
    .select("+abstractEmbedding name academicYear")
    .lean();

  return candidates
    .map((p) => ({
      project: p._id,
      title: p.name,
      academicYear: p.academicYear,
      score: Math.max(0, Math.round(dot(vector, p.abstractEmbedding) * 100)),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);
}

/** Embed a title/abstract and find the closest existing projects. */
export async function checkSimilarity(title, abstract, projectId) {
  const vector = await embed(embeddingText(title, abstract));
  const similarProjects = await findSimilar(vector, projectId);
  const similarityScore = similarProjects[0]?.score ?? 0;

  logger.info("similarity_check_completed", {
    projectId,
    model: MODEL,
    similarityScore,
    compared: similarProjects.length,
  });

  return { vector, similarityScore, similarProjects };
}
