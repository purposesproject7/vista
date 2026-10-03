// Self-check for the similarity vector cache (no DB or model needed):
//   node scripts/similarityCacheCheck.js
import assert from "assert";
import Project from "../models/projectSchema.js";
import ReferenceProject from "../models/referenceProjectSchema.js";
import { findSimilar, rememberProject } from "../services/similarityService.js";

// Fake the two collections and count how often they are read.
let reads = 0, failNext = false;
const v = (x, y) => [x, y]; // 2-d "embeddings" are enough to test scoring
const query = (rows) => ({ select: () => ({ lean: async () => {
  if (failNext) { failNext = false; throw new Error("db down"); }
  reads++; return rows;
} }) });
let projects = [
  { _id: "p1", name: "Irrigation", academicYear: "2026", abstractEmbedding: v(1, 0) },
  { _id: "p2", name: "Drowsiness", academicYear: "2026", abstractEmbedding: v(0, 1) },
];
Project.find = () => query(projects);
ReferenceProject.find = () => query([{ _id: "r1", title: "Common dimmer", abstractEmbedding: v(0.6, 0.8) }]);

// First check loads both collections; scores and sources come out right.
let m = await findSimilar([1, 0], null);
assert.equal(reads, 2, "first check reads both collections once");
assert.deepEqual(m.map((x) => [x.title, x.score, x.source]),
  [["Irrigation", 100, "project"], ["Common dimmer", 60, "reference"], ["Drowsiness", 0, "project"]]);

// Later checks are served from memory, and the submitting project is excluded.
m = await findSimilar([1, 0], "p1");
assert.equal(reads, 2, "no DB read on the second check");
assert(!m.some((x) => x.title === "Irrigation"), "own project excluded");

// An accepted project is compared against immediately, without a reload.
rememberProject("p3", "Sign language", "2026", [0.8, 0.6]);
m = await findSimilar([0.8, 0.6], null);
assert.equal(m[0].title, "Sign language");
assert.equal(reads, 2);

// After the TTL: the stale copy is served at once while a refresh runs.
const realNow = Date.now;
Date.now = () => realNow() + 11 * 60 * 1000;
projects = [{ _id: "p9", name: "Fresh from DB", academicYear: "2026", abstractEmbedding: v(1, 0) }];
m = await findSimilar([1, 0], null);
assert(m.some((x) => x.title === "Irrigation"), "stale copy served during refresh");
await new Promise((r) => setTimeout(r, 10));
m = await findSimilar([1, 0], null);
assert.equal(m[0].title, "Fresh from DB", "refreshed copy used afterwards");

// A failed refresh keeps the previous copy instead of breaking checks.
Date.now = () => realNow() + 30 * 60 * 1000;
failNext = true;
m = await findSimilar([1, 0], null);
await new Promise((r) => setTimeout(r, 10));
m = await findSimilar([1, 0], null);
assert.equal(m[0].title, "Fresh from DB", "kept last good copy after a failed refresh");
Date.now = realNow;

console.log("ok");
process.exit(0);
