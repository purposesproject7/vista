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
  },
  { timestamps: true }
);

programConfigSchema.index(
  { academicYear: 1, school: 1, program: 1 },
  { unique: true }
);

const ProgramConfig = mongoose.model("ProgramConfig", programConfigSchema);

export default ProgramConfig;
