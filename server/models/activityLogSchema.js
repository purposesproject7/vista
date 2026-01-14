import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
    {
        faculty: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Faculty",
            required: true,
        },
        action: {
            type: String,
            required: true,
            enum: [
                "LOGIN",
                "LOGOUT",
                "MARK_ENTRY",
                "MARK_UPDATE",
                "PPT_APPROVAL",
                "DRAFT_APPROVAL",
                "REQUEST_HANDLED",
                "PROJECT_STATUS_UPDATE",
            ],
        },
        // Context
        school: {
            type: String,
            required: true,
        },
        program: {
            type: String,
            required: true,
        },
        academicYear: {
            type: String,
            required: true,
        },
        // Additional info (e.g. which student, which project, what marks)
        details: {
            targetId: { type: mongoose.Schema.Types.ObjectId }, // Generic ref
            targetModel: { type: String }, // 'Student', 'Project', 'Request'
            description: { type: String },
            meta: { type: Object }, // Flexible wrapper for any other data
        },
        ip: {
            type: String,
        },
        userAgent: {
            type: String,
        },
    },
    {
        timestamps: true, // createdAt will be the timestamp
    }
);

// Indexes for faster reporting
activityLogSchema.index({ school: 1, program: 1, academicYear: 1 });
activityLogSchema.index({ faculty: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ createdAt: 1 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

export default ActivityLog;
