import mongoose from "mongoose";

const subComponentMarkSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    marks: { type: Number, required: true },
    maxMarks: { type: Number, required: true },
    isPredefined: { type: Boolean, default: false },
  },
  { _id: false }
);

const componentMarkSchema = new mongoose.Schema(
  {
    componentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    }, // Reference to ComponentLibrary
    componentName: { type: String, required: true },

    // If no subcomponents
    marks: { type: Number },
    maxMarks: { type: Number },

    // If has subcomponents
    subComponents: [subComponentMarkSchema],

    // Total for this component
    componentTotal: { type: Number, required: true },
    componentMaxTotal: { type: Number, required: true },

    remarks: { type: String },
  },
  { _id: false }
);

const marksSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    reviewType: {
      type: String,
      required: true,
    },

    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
      index: true,
    },

    facultyType: {
      type: String,
      enum: ["guide", "panel"],
      required: true,
    },

    academicYear: {
      type: String,
      required: true,
      index: true,
    },

    school: { type: String, required: true },
    program: { type: String, required: true },

    componentMarks: [componentMarkSchema],

    totalMarks: { type: Number, required: true },
    maxTotalMarks: { type: Number, required: true },

    remarks: { type: String },

    isSubmitted: { type: Boolean, default: false },
    submittedAt: { type: Date },
  },
  { timestamps: true }
);

marksSchema.index({ student: 1, reviewType: 1, faculty: 1 }, { unique: true });
marksSchema.index({ project: 1, reviewType: 1 });
marksSchema.index({ faculty: 1, academicYear: 1, isSubmitted: 1 });
marksSchema.index({ student: 1, academicYear: 1 });
marksSchema.index({ student: 1, reviewType: 1, facultyType: 1 });

// Pre-save validation
marksSchema.pre("save", async function () {
  if (this.facultyType === "guide" && this.isNew) {
    const existingGuideMark = await this.constructor.findOne({
      student: this.student,
      reviewType: this.reviewType,
      facultyType: "guide",
      _id: { $ne: this._id },
    });

    if (existingGuideMark) {
      throw new Error(
        `Guide has already submitted marks for this student in ${this.reviewType}`
      );
    }
  }
});

const Marks = mongoose.model("Marks", marksSchema);
export default Marks;
