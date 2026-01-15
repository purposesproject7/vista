// models/facultySchema.js
import mongoose from "mongoose";

const facultySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    emailId: { type: String, required: true, unique: true },
    employeeId: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true }, // Now required
    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["admin", "faculty"],
      default: "faculty",
    },

    school: { type: String, required: true },
    program: { type: String }, // Now optional
    specialization: { type: String },

    // Project coordinator flag
    isProjectCoordinator: {
      type: Boolean,
      default: false,
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Faculty = mongoose.model("Faculty", facultySchema);
export default Faculty;
