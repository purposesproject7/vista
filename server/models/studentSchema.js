import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    regNo: { type: String, required: true },
    name: { type: String, required: true },
    emailId: { type: String, required: true },

    PAT: { type: Boolean, default: false },

    school: { type: String, required: true },
    department: { type: String, required: true },
    academicYear: { type: String, required: true },
    semester: {
      type: String,
      required: true,
      enum: ["Fall Semester", "Winter Semester"],
    },

    isActive: { type: Boolean, default: true },

    // References to Marks documents (JIT created)
    guideMarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Marks",
      },
    ],

    panelMarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Marks",
      },
    ],

    // Approval tracking per review
    approvals: {
      type: Map,
      of: {
        ppt: {
          approved: { type: Boolean, default: false },
          locked: { type: Boolean, default: false },
          approvedAt: Date,
        },
        draft: {
          approved: { type: Boolean, default: false },
          locked: { type: Boolean, default: false },
          approvedAt: Date,
        },
      },
    },
  },
  { timestamps: true },
);

studentSchema.index({ regNo: 1, academicYear: 1, semester: 1 }, { unique: true });
studentSchema.index({ school: 1, department: 1, academicYear: 1, semester: 1 });
studentSchema.index({ emailId: 1 });

const Student = mongoose.model("Student", studentSchema);
export default Student;
