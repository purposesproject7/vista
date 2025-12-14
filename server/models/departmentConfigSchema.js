import mongoose from "mongoose";

const featureLockSchema = new mongoose.Schema(
  {
    featureName: {
      type: String,
      enum: [
        "faculty_creation",
        "panel_creation",
        "student_upload",
        "marking_schema_edit",
        "guide_assignment",
        "panel_assignment",
        "guide_reassignment",
        "team_merging",
      ],
      required: true,
    },
    deadline: { type: Date, required: true }, // Global deadline
    isLocked: { type: Boolean, default: false },
  },
  { _id: false },
);

const departmentConfigSchema = new mongoose.Schema(
  {
    academicYear: { type: String, required: true },
    school: { type: String, required: true },
    department: { type: String, required: true },

    // Team size constraints
    maxTeamSize: { type: Number, required: true, default: 4, min: 1, max: 10 },
    minTeamSize: { type: Number, required: true, default: 1, min: 1 },

    // Panel size constraints
    maxPanelSize: { type: Number, required: true, default: 5, min: 1, max: 10 },
    minPanelSize: { type: Number, required: true, default: 3, min: 1 },

    // Feature locks with deadlines for project coordinators
    featureLocks: [featureLockSchema],
  },
  { timestamps: true },
);

departmentConfigSchema.index(
  { academicYear: 1, school: 1, department: 1 },
  { unique: true },
);

// Validation: minPanelSize <= maxPanelSize
departmentConfigSchema.pre("save", function (next) {
  if (this.minPanelSize > this.maxPanelSize) {
    return next(new Error("minPanelSize cannot be greater than maxPanelSize"));
  }
  next();
});

// Validation: minTeamSize <= maxTeamSize
departmentConfigSchema.pre("save", function (next) {
  if (this.minTeamSize > this.maxTeamSize) {
    return next(new Error("minTeamSize cannot be greater than maxTeamSize"));
  }
  next();
});

const departmentConfig = mongoose.model(
  "departmentConfig",
  departmentConfigSchema,
);
export default departmentConfig;
