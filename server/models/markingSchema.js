import mongoose from "mongoose";

const subComponentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    weight: { type: Number, required: true },
    description: { type: String },
    isPredefined: { type: Boolean, default: false },
  },
  { _id: false },
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
    description: { type: String },
  },
  { _id: false },
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
  { _id: false },
);

const markingSchemaModel = new mongoose.Schema(
  {
    school: { type: String, required: true },
    department: { type: String, required: true },
    academicYear: { type: String, required: true },
    semester: {
      type: String,
      required: true,
      enum: ["Fall Semester", "Winter Semester"],
    },

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
  { timestamps: true },
);

markingSchemaModel.index(
  { school: 1, department: 1, academicYear: 1, semester: 1 },
  { unique: true },
);

const MarkingSchemaModel = mongoose.model("MarkingSchema", markingSchemaModel);
export default MarkingSchemaModel;
