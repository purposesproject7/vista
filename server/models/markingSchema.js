import { assertReviewIdentitiesPreserved } from "../utils/reviewConfiguration.js";
import { academicContextPlugin } from "../utils/academicContext.js";
import mongoose from "mongoose";

const subComponentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    weight: { type: Number, required: true },
    description: { type: String },
    isPredefined: { type: Boolean, default: false },
  },
  { _id: false }
);

const componentSchema = new mongoose.Schema(
  {
    componentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    name: { type: String, required: true },
    maxMarks: { type: Number, required: true },
    subComponents: [subComponentSchema],
    description: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    reviewName: { type: String, required: true }, // "review1", "review2"
    displayName: { type: String, required: true }, // "Review 1 - Proposal Defense"

    facultyType: {
      type: String,
      enum: ["guide", "panel", "both"],
      required: true,
    },

    components: [componentSchema],

    deadline: {
      from: { type: Date, required: true },
      to: { type: Date, required: true },
    },

    pptRequired: { type: Boolean, default: false },
    draftRequired: { type: Boolean, default: false },

    order: { type: Number, required: true },

    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const markingSchemaModel = new mongoose.Schema(
  {
    school: { type: String, required: true },
    program: { type: String, required: true },
    academicYear: { type: String, required: true },

    reviews: [reviewSchema],

    requiresContribution: { type: Boolean, default: false },
    contributionTypes: {
      type: [String],
      enum: [
        "Patent Filed",
        "Journal Publication",
        "Book Chapter Contribution",
      ],
      default: [],
    },

    totalWeightage: { type: Number, default: 100 },
  },
  { timestamps: true }
);

markingSchemaModel.index(
  { school: 1, program: 1, academicYear: 1 },
  { unique: true }
);

// Covers coordinator saves as well as the admin service.
markingSchemaModel.pre("validate", async function() {
  if (!this.isModified('reviews')) return;
  const seen = new Set();
  for (const review of this.reviews) {
    const id = String(review.reviewName).trim().toLowerCase();
    if (seen.has(id)) throw new Error('Duplicate review identifier.');
    seen.add(id);
    if (review.deadline?.from && review.deadline?.to && review.deadline.from >= review.deadline.to) throw new Error("Review window start must be before its end.");
    for (const component of review.components) if (!Number.isFinite(component.maxMarks) || component.maxMarks < 0) throw new Error('Review component maxima must be finite and non-negative.');
  }
  if (!this.isNew) {
    const previous = await this.constructor.collection.findOne({ _id: this._id });
    if (previous) await assertReviewIdentitiesPreserved(previous, this.reviews);
  }
});

markingSchemaModel.plugin(academicContextPlugin, { uniqueContext: true });

const MarkingSchemaModel = mongoose.model("MarkingSchema", markingSchemaModel);
export default MarkingSchemaModel;
