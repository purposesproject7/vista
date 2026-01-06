import mongoose from "mongoose";

const accessRequestSchema = new mongoose.Schema(
  {
    featureName: {
      type: String,
      enum: [
        "faculty_management",
        "project_management",
        "student_management",
        "panel_management",
      ],
      required: true,
    },

    reason: { type: String, required: true },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    requiredDeadline: { type: Date },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // Requester information
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty", // Project coordinator
      required: true,
    },

    school: { type: String, required: true },
    program: { type: String },

    // Admin response
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty", // Admin who approved
    },

    approvalReason: { type: String },

    rejectionReason: { type: String },

    // Timeline
    submittedAt: { type: Date, default: Date.now },

    resolvedAt: { type: Date },

    // Approval deadline
    approvalDeadline: { type: Date },

    // Grant duration (if approved)
    grantStartTime: { type: Date },
    grantEndTime: { type: Date },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes for efficient queries
accessRequestSchema.index({ requestedBy: 1, status: 1 });
accessRequestSchema.index({ school: 1, status: 1 });
accessRequestSchema.index({ featureName: 1, status: 1 });
accessRequestSchema.index({ priority: 1, status: 1 });
accessRequestSchema.index({ submittedAt: -1 });
accessRequestSchema.index({ approvalDeadline: 1 });

const AccessRequest = mongoose.model("AccessRequest", accessRequestSchema);
export default AccessRequest;
