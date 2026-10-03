import { pipeline } from "@huggingface/transformers";
import Project from "../models/projectSchema.js";
import ReferenceProject from "../models/referenceProjectSchema.js";
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

const REFERENCE_LABEL = "Common project";

/**
 * Score every approved project (other than this one) and every reference
 * project that has an embedding from the current model. Each match is
 * { project, title, academicYear, score, source } with score 0-100;
 * source is "project" or "reference".
 */
export async function findSimilar(vector, excludeProjectId) {
  // ponytail: brute-force scan over all stored vectors; fine for tens of
  // thousands of projects, switch to a vector index beyond that.
  const [projects, references] = await Promise.all([
    Project.find({ _id: { $ne: excludeProjectId }, abstractEmbeddingModel: MODEL })
      .select("+abstractEmbedding name academicYear")
      .lean(),
    ReferenceProject.find({ abstractEmbeddingModel: MODEL })
      .select("+abstractEmbedding title")
      .lean(),
  ]);
  const score = (v) => Math.max(0, Math.round(dot(vector, v) * 100));

  return [
    ...projects.map((p) => ({
      project: p._id,
      title: p.name,
      academicYear: p.academicYear,
      score: score(p.abstractEmbedding),
      source: "project",
    })),
    ...references.map((r) => ({
      title: r.title,
      academicYear: REFERENCE_LABEL,
      score: score(r.abstractEmbedding),
      source: "reference",
    })),
  ].sort((a, b) => b.score - a.score);
}

/**
 * Embed a title/abstract and find the closest matches. projectScore is the top
 * match among approved projects (can reject); referenceScore the top match
 * among common reference projects (can only flag). Both null when there is
 * nothing of that kind to compare against.
 */
export async function checkSimilarity(title, abstract, projectId) {
  const vector = await embed(embeddingText(title, abstract));
  const matches = await findSimilar(vector, projectId);
  const top = (source) => matches.find((m) => m.source === source)?.score ?? null;
  const projectScore = top("project");
  const referenceScore = top("reference");
  const similarityScore = matches[0]?.score ?? null;
  const similarProjects = matches.slice(0, TOP_K).map(({ source, ...m }) => m);

  logger.info("similarity_check_completed", {
    projectId,
    model: MODEL,
    similarityScore,
    projectScore,
    referenceScore,
    compared: matches.length,
  });

  return { vector, similarityScore, projectScore, referenceScore, similarProjects };
}
