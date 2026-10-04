// Self-check for ProjectService.markReviewsLocked (no DB needed).
import assert from "node:assert";
import ProgramConfig from "../models/programConfigSchema.js";
import { ProjectService } from "../services/projectService.js";

ProgramConfig.find = () => ({ select: () => ({ lean: async () => [{ academicYear: "2026", school: "SCOPE", program: "BTech" }] }) });
const ctx = { academicYear: "2026", school: "SCOPE" };
const p = [
  { ...ctx, program: "BTech", titleAbstractStatus: "pending_review" }, // gated, not accepted
  { ...ctx, program: "BTech", titleAbstractStatus: "accepted" },       // gated, accepted
  { ...ctx, program: "MTech", titleAbstractStatus: "not_started" },    // program not gated
];
await ProjectService.markReviewsLocked(p);
assert.deepStrictEqual(p.map((x) => x.reviewsLocked), [true, false, false]);
console.log("markReviewsLocked OK");
process.exit(0);
