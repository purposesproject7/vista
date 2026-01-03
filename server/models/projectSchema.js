import mongoose from "mongoose";

const projectHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        "created",
        "guide_reassigned",
        "panel_reassigned",
        "review_panel_assigned",
        "team_merged",
        "deactivated",
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
  { _id: true },
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
  { _id: false },
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

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

    academicYear: { type: String, required: true },
    school: { type: String, required: true },
    program: { type: String },
    department: { type: String, required: true },
    specialization: { type: String, required: true },

    type: {
      type: String,
      required: true,
      enum: ["hardware", "software"],
    },

    status: {
      type: String,
      enum: ["active", "inactive", "completed", "archived"],
      default: "active",
    },

    bestProject: { type: Boolean, default: false },

    teamSize: { type: Number, required: true },

    history: [projectHistorySchema],

    previousProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
  },
  { timestamps: true },
);

projectSchema.index({ name: 1, academicYear: 1 }, { unique: true });
projectSchema.index({ school: 1, program: 1, department: 1, academicYear: 1 });
projectSchema.index({ guideFaculty: 1, academicYear: 1 });
projectSchema.index({ panel: 1, academicYear: 1 });
projectSchema.index({ "reviewPanels.panel": 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ specialization: 1, school: 1, department: 1 });

const Project = mongoose.model("Project", projectSchema);
export default Project;
