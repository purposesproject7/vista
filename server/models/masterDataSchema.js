import mongoose from "mongoose";

const schoolSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { _id: true },
);

const departmentSchema = new mongoose.Schema(
  {
    school: { type: String, required: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    specializations: [String],
    isActive: { type: Boolean, default: true },
  },
  { _id: true },
);

const academicYearSchema = new mongoose.Schema(
  {
    year: { type: String, required: true, unique: true }, // "2024-2025"
    isActive: { type: Boolean, default: true },
    isCurrent: { type: Boolean, default: false },
  },
  { _id: true },
);

const masterDataSchema = new mongoose.Schema(
  {
    schools: [schoolSchema],
    departments: [departmentSchema],
    academicYears: [academicYearSchema],
  },
  { timestamps: true },
);

masterDataSchema.index({ "schools.name": 1 });
masterDataSchema.index({ "schools.code": 1 });
masterDataSchema.index({ "departments.school": 1, "departments.name": 1 });

const MasterData = mongoose.model("MasterData", masterDataSchema);
export default MasterData;
