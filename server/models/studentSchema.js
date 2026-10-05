import { validateStudentAssignment } from "../utils/assignmentContext.js";
import { academicContextPlugin, contextError } from "../utils/academicContext.js";
import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    regNo: { type: String, required: true },
    name: { type: String, required: true },
    emailId: { type: String, required: true },
    phoneNumber: { type: String },

    PAT: { type: Boolean, default: false },

    school: { type: String, required: true },
    program: { type: String, required: true },
    academicYear: { type: String, required: true },

    isActive: { type: Boolean, default: true },

    // Auth fields (mirrors facultySchema.js)
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student"],
      default: "student",
      lowercase: true,
      trim: true,
    },
    isDefaultPassword: { type: Boolean, default: true },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },

    // In-flight title/abstract submission, pending team consensus
    titleAbstractSubmission: {
      title: { type: String, trim: true },
      abstract: { type: String },
      submittedAt: { type: Date },
    },

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
  { timestamps: true }
);

studentSchema.index({ regNo: 1, academicYear: 1 }, { unique: true });
studentSchema.index({ school: 1, program: 1, academicYear: 1 });
studentSchema.index({ emailId: 1 }, { unique: true });

// regNo is unique per academic year, not globally. Never select an arbitrary
// semester for reads or mutations when the same registration number repeats.
studentSchema.pre(['findOne', 'findOneAndUpdate', 'updateOne', 'deleteOne', 'findOneAndDelete'], async function() {
  const query = this.getFilter();
  if (query._id || query.academicYear || (!query.regNo && !query.emailId)) return;
  const matches = await this.model.collection.find(query).project({ _id: 1 }).limit(2).toArray();
  if (matches.length > 1) throw contextError('Student identity spans multiple academic years. Select the academic year or use the student ID.');
});

studentSchema.plugin(academicContextPlugin);
studentSchema.pre("validate", validateStudentAssignment);
studentSchema.pre("save", validateStudentAssignment);

const Student = mongoose.model("Student", studentSchema);
export default Student;
