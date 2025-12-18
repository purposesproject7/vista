import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
    facultyType: {
      type: String,
      enum: ["guide", "panel"],
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    semester: {
      type: String,
      required: true,
      enum: ["Fall Semester", "Winter Semester"],
    },
    reviewType: {
      type: String,
      required: true,
    },
    requestType: {
      type: String,
      enum: ["deadline_extension", "mark_edit", "resubmission"],
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
    },
    resolvedAt: {
      type: Date,
    },
    remarks: { type: String },
  },
  {
    timestamps: true,
  },
);

requestSchema.index({ faculty: 1, academicYear: 1, semester: 1 });
requestSchema.index({ student: 1, academicYear: 1, semester: 1 });
requestSchema.index({ status: 1, createdAt: -1 });

const Request = mongoose.model("Request", requestSchema);
export default Request;
