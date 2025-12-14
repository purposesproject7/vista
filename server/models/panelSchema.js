import mongoose from "mongoose";

const panelMemberSchema = new mongoose.Schema(
  {
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
    role: {
      type: String,
      enum: ["chair", "member"],
      default: "member",
    },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const panelSchema = new mongoose.Schema(
  {
    panelName: { type: String },

    members: [panelMemberSchema],

    venue: { type: String, required: false },

    academicYear: { type: String, required: true },
    school: { type: String, required: true },
    department: { type: String, required: true },

    specializations: [String],

    maxProjects: { type: Number, default: 10 },
    assignedProjectsCount: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

panelSchema.index({ school: 1, department: 1, academicYear: 1 });
panelSchema.index({ specializations: 1 });
panelSchema.index({ isActive: 1, assignedProjectsCount: 1 });

const Panel = mongoose.model("Panel", panelSchema);
export default Panel;
