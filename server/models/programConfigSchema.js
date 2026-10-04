import mongoose from "mongoose";

const featureLockSchema = new mongoose.Schema(
  {
    featureName: {
      type: String,
      enum: [
        "student_management",
        "faculty_management",
        "project_management",
        "panel_management",
      ],
      required: true,
    },
    deadline: { type: Date, required: true },
    isLocked: { type: Boolean, default: false },
  },
  { _id: false }
);

const programConfigSchema = new mongoose.Schema(
  {
    academicYear: { type: String, required: true },
    school: { type: String, required: true },
    program: { type: String, required: true },

    // Team size constraints
    minTeamSize: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      validate: {
        validator: function (value) {
          return value <= this.maxTeamSize;
        },
        message: "minTeamSize cannot be greater than maxTeamSize",
      },
    },
    maxTeamSize: {
      type: Number,
      required: true,
      default: 4,
      min: 1,
      max: 10,
    },


    // Panel size constraints
    minPanelSize: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      validate: {
        validator: function (value) {
          return value <= this.maxPanelSize;
        },
        message: "minPanelSize cannot be greater than maxPanelSize",
      },
    },
    maxPanelSize: {
      type: Number,
      required: true,
      default: 5,
      min: 1,
      max: 10,
    },

    // Project limits
    maxProjectsPerGuide: { type: Number, required: true, default: 8, min: 1 },
    maxProjectsPerPanel: { type: Number, required: true, default: 10, min: 1 },

    // Feature locks with deadlines
    featureLocks: [featureLockSchema],

    // Plagiarism/AI-content scoring. Off until a real provider is wired into
    // PlagiarismService (the built-in one is a mock that returns hash-derived
    // scores). Off = those scores are not computed and never flag/reject; the
    // duplicate-project similarity check runs regardless.
    plagiarismCheckEnabled: { type: Boolean, default: false },
    // Duplicate-project (similarity/RAG) check on submission. Off = no score,
    // never flags/rejects. Approved projects are still embedded on acceptance,
    // so turning it back on compares against the complete set.
    similarityCheckEnabled: { type: Boolean, default: true },
    // On = a team stays out of every guide/panel review until its guide accepts
    // the title & abstract. Off (default) = reviews behave as before.
    requireTitleAbstractApproval: { type: Boolean, default: false },

    // Title/abstract content-check thresholds, applied to both the plagiarism
    // and AI-generated-content scores. A score above flagThreshold is flagged
    // for the guide's attention (guide can still accept). A score above
    // autoRejectThreshold blocks the submission outright — the student cannot
    // submit it and must revise the content.
    flagThreshold: {
      type: Number,
      required: true,
      default: 60,
      min: 0,
      max: 100,
    },
    autoRejectThreshold: {
      type: Number,
      required: true,
      default: 85,
      min: 0,
      max: 100,
      validate: {
        validator: function (value) {
          return value >= this.flagThreshold;
        },
        message: "autoRejectThreshold cannot be less than flagThreshold",
      },
    },
  },
  { timestamps: true }
);

programConfigSchema.index(
  { academicYear: 1, school: 1, program: 1 },
  { unique: true }
);

const ProgramConfig = mongoose.model("ProgramConfig", programConfigSchema);

export default ProgramConfig;
