import mongoose from "mongoose";

const panelMemberSchema = new mongoose.Schema(
  {
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
    facultyEmployeeId: { type: String }, // Store employee ID for quick lookup
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const panelSchema = new mongoose.Schema(
  {
    panelName: { type: String },

    // Array of faculty employee IDs
    facultyEmployeeIds: [{ type: String }],

    // Legacy members array for backward compatibility
    members: [panelMemberSchema],

    venue: { type: String, required: false },

    academicYear: { type: String, required: true },
    semester: { type: String },
    school: { type: String, required: true },
    department: { type: String, required: true },

    specializations: [String],

    type: {
      type: String,
      enum: ["regular", "temporary"],
      default: "regular",
    },

    panelType: {
      type: String,
      enum: ["regular", "temporary"],
      default: "regular",
    },

    maxProjects: { type: Number, default: 10 },
    assignedProjectsCount: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

panelSchema.index({ school: 1, department: 1, academicYear: 1 });
panelSchema.index({ specializations: 1 });
panelSchema.index({ isActive: 1, assignedProjectsCount: 1 });
panelSchema.index({ facultyEmployeeIds: 1 });

const Panel = mongoose.model("Panel", panelSchema);
export default Panel;
