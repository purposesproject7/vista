import mongoose from "mongoose";

const projectHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        "created",
        "updated",
        "guide_reassigned",
        "panel_reassigned",
        "review_panel_assigned",
        "team_merged",
        "deactivated",
        "archived", // Add archived just in case
      ],
      required: true,
    },
    reviewType: { type: String }, // For review-specific panel changes
    previousGuideFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
    },
    newGuideFaculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
    previousPanel: { type: mongoose.Schema.Types.ObjectId, ref: "Panel" },
    newPanel: { type: mongoose.Schema.Types.ObjectId, ref: "Panel" },
    mergedWithProject: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    reason: String,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
    performedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const reviewPanelAssignmentSchema = new mongoose.Schema(
  {
    reviewType: { type: String, required: true },
    panel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Panel",
      required: true,
    },
    assignedAt: { type: Date, default: Date.now },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
  },
  { _id: false }
);

const contentCheckSchema = new mongoose.Schema(
  {
    plagiarismScore: { type: Number, default: null },
    aiScore: { type: Number, default: null },
    checkedAt: { type: Date, default: null },
    flagged: { type: Boolean, default: false },
    rejected: { type: Boolean, default: false },
  },
  { _id: false }
);

const titleAbstractHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["submitted", "discrepancy", "consensus_reached", "rejected", "accepted"],
      required: true,
    },
    title: { type: String },
    abstract: { type: String },
    performedBy: { type: mongoose.Schema.Types.ObjectId, refPath: "titleAbstractHistory.performedByModel" },
    performedByModel: { type: String, enum: ["Student", "Faculty"] },
    performedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 200, trim: true },

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true,
      },
    ],

    guideFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },

    // Main panel (can be used as default)
    panel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Panel",
      default: null,
    },

    // Review-specific panel assignments
    reviewPanels: [reviewPanelAssignmentSchema],

    // Track PPT Approvals for reviews
    pptApprovals: [
      {
        reviewType: { type: String, required: true },
        isApproved: { type: Boolean, default: false },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
        approvedAt: { type: Date },
      },
    ],

    academicYear: { type: String, required: true },
    school: { type: String, required: true },
    program: { type: String, required: true },
    specialization: { type: String, required: false },

    type: {
      type: String,
      required: true,
      enum: ["hardware", "software"],
      lowercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "completed", "archived"],
      default: "active",
      lowercase: true,
      trim: true,
    },

    bestProject: { type: Boolean, default: false },

    teamSize: { type: Number, required: true },

    history: [projectHistorySchema],

    previousProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    sdgGoal: { type: String, default: null },

    description: { type: String },

    // Student-submitted, guide-locked title/abstract workflow
    abstract: { type: String, default: null },
    proposedTitle: { type: String, maxlength: 200, trim: true, default: null },
    proposedAbstract: { type: String, default: null },
    titleAbstractStatus: {
      type: String,
      enum: [
        "not_started",
        "pending_consensus",
        "discrepancy",
        "consensus_reached",
        "rejected",
        "pending_review",
        "accepted",
      ],
      default: "not_started",
    },
    contentCheck: { type: contentCheckSchema, default: () => ({}) },
    titleAbstractAcceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      default: null,
    },
    titleAbstractAcceptedAt: { type: Date, default: null },
    titleAbstractHistory: [titleAbstractHistorySchema],
  },
  { timestamps: true }
);

projectSchema.index({ name: 1, academicYear: 1 });
projectSchema.index({ school: 1, program: 1, academicYear: 1 });
projectSchema.index({ guideFaculty: 1, academicYear: 1 });
projectSchema.index({ panel: 1, academicYear: 1 });
projectSchema.index({ "reviewPanels.panel": 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ specialization: 1, school: 1, program: 1 });

const Project = mongoose.model("Project", projectSchema);
export default Project;
