import mongoose from "mongoose";

const broadcastMessageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "",
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    targetSchools: {
      type: [String],
      default: [],
    },
    targetDepartments: {
      type: [String],
      default: [],
    },
    targetAcademicYears: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
    createdByEmployeeId: {
      type: String,
      required: true,
    },
    createdByName: {
      type: String,
      default: "",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    action: {
      type: String,
      enum: ["notice", "block"],
      default: "notice",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
  },
  { timestamps: true },
);

broadcastMessageSchema.index({ targetSchools: 1 });
broadcastMessageSchema.index({ targetDepartments: 1 });
broadcastMessageSchema.index({ targetAcademicYears: 1 });
broadcastMessageSchema.index({ expiresAt: 1 });
broadcastMessageSchema.index({ createdAt: -1 });
broadcastMessageSchema.index({ isActive: 1, action: 1 });

const BroadcastMessage = mongoose.model(
  "BroadcastMessage",
  broadcastMessageSchema,
);
export default BroadcastMessage;
