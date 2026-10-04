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

// In-memory copy of every comparison vector, so a check scores against memory
// instead of re-reading all embeddings from MongoDB (~6 KB each). Loaded on
// first use, refreshed in the background every CACHE_TTL_MS to pick up changes
// made elsewhere (deletions, renames, a manual backfill), and updated at once
// when a guide accepts a project (rememberProject).
// ponytail: one cache per process; fine while the API runs as a single pm2
// process. Clustered workers would each hold their own copy.
const CACHE_TTL_MS = 10 * 60 * 1000;
let cache = null; // { at, entries: Map<key, entry> }
let refreshing = null;

async function loadCache() {
  const [projects, references] = await Promise.all([
    Project.find({ abstractEmbeddingModel: MODEL }).select("+abstractEmbedding name academicYear").lean(),
    ReferenceProject.find({ abstractEmbeddingModel: MODEL }).select("+abstractEmbedding title").lean(),
  ]);
  const entries = new Map();
  for (const p of projects) {
    entries.set(`p:${p._id}`, {
      project: p._id, title: p.name, academicYear: p.academicYear, source: "project",
      vec: Float32Array.from(p.abstractEmbedding),
    });
  }
  for (const r of references) {
    entries.set(`r:${r._id}`, {
      title: r.title, academicYear: REFERENCE_LABEL, source: "reference",
      vec: Float32Array.from(r.abstractEmbedding),
    });
  }
  cache = { at: Date.now(), entries };
  logger.info("similarity_cache_loaded", { projects: projects.length, references: references.length });
  return cache;
}

async function getCache() {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache;
  refreshing ??= loadCache().finally(() => { refreshing = null; });
  if (!cache) return refreshing; // first load: wait for it
  // Stale: serve the current copy while the refresh runs; keep it if that fails.
  refreshing.catch((error) => logger.error("similarity_cache_refresh_failed", { error: error.message }));
  return cache;
}

/** Add (or replace) an approved project's vector without waiting for a refresh. */
export function rememberProject(projectId, name, academicYear, vector) {
  cache?.entries.set(`p:${projectId}`, {
    project: projectId, title: name, academicYear, source: "project",
    vec: Float32Array.from(vector),
  });
}

/**
 * Score every approved project (other than this one) and every reference
 * project that has an embedding from the current model. Each match is
 * { project, title, academicYear, score, source } with score 0-100;
 * source is "project" or "reference".
 */
export async function findSimilar(vector, excludeProjectId) {
  const { entries } = await getCache();
  const exclude = excludeProjectId ? `p:${excludeProjectId}` : null;
  const matches = [];
  for (const [key, { vec, ...m }] of entries) {
    if (key === exclude) continue;
    matches.push({ ...m, score: Math.max(0, Math.round(dot(vector, vec) * 100)) });
  }
  return matches.sort((a, b) => b.score - a.score);
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
