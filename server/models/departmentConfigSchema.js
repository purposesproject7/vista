import mongoose from "mongoose";

const featureLockSchema = new mongoose.Schema(
  {
    featureName: {
      type: String,
      enum: [
        "faculty_creation",
        "panel_creation",
        "student_upload",
        "student_modification",
        "project_creation",
        "marking_schema_edit",
        "guide_assignment",
        "panel_assignment",
        "guide_reassignment",
        "team_merging",
        "team_splitting",
      ],
      required: true,
    },
    deadline: { type: Date, required: true },
    isLocked: { type: Boolean, default: false },
  },
  { _id: false },
);

const departmentConfigSchema = new mongoose.Schema(
  {
    academicYear: { type: String, required: true },
    semester: {
      type: String,
      required: true,
      enum: ["Fall Semester", "Winter Semester"],
    },
    school: { type: String, required: true },
    department: { type: String, required: true },

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
      default: 3,
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
  },
  { timestamps: true },
);

departmentConfigSchema.index(
  { academicYear: 1, school: 1, department: 1 },
  { unique: true },
);

const DepartmentConfig = mongoose.model(
  "DepartmentConfig",
  departmentConfigSchema,
);

export default DepartmentConfig;
