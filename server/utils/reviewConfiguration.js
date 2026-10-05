import Marks from "../models/marksSchema.js";
import Project from "../models/projectSchema.js";
import Request from "../models/requestSchema.js";
import { reviewNamesMatch } from "./reviewIdentity.js";

export async function assertReviewIdentitiesPreserved(schema, nextReviews) {
    const removed = (schema.reviews || []).filter(review => !nextReviews.some(next => next.reviewName === review.reviewName));
    if (!removed.length) return;
    const context = { school: schema.school, program: schema.program, academicYear: schema.academicYear };
    const projects = await Project.find(context).select('_id reviewPanels pptApprovals').lean();
    const projectIds = projects.map(project => project._id);
    const records = await Promise.all([
      Marks.find({ $or: [context, { project: { $in: projectIds } }] }).select('reviewType').lean(),
      Request.find({ $or: [context, { project: { $in: projectIds } }] }).select('reviewType').lean(),
    ]);
    const references = [...records.flat().map(record => record.reviewType), ...projects.flatMap(project => [...(project.reviewPanels || []), ...(project.pptApprovals || [])].map(record => record.reviewType))];
    if (removed.some(review => references.some(value => reviewNamesMatch(value, review.reviewName)))) throw new Error("A review ID with marks, requests or panel/PPT assignments cannot be renamed or removed. Keep its ID and edit its display name, or deactivate the review.");
}
