import mongoose from "mongoose";

const predefinedSubComponentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    weight: { type: Number },
  },
  { _id: true },
);

const componentLibraryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "Research",
        "Implementation",
        "Documentation",
        "Presentation",
        "Testing",
        "Design",
        "Analysis",
        "Other",
      ],
      default: "Other",
    },
    description: { type: String },
    suggestedWeight: { type: Number },

    // Predefined subcomponents
    predefinedSubComponents: [predefinedSubComponentSchema],

    allowCustomSubComponents: { type: Boolean, default: true },

    isActive: { type: Boolean, default: true },

    applicableFor: {
      type: [String],
      enum: ["hardware", "software", "both"],
      default: ["both"],
    },
  },
  { _id: true },
);

const componentLibrarySchema = new mongoose.Schema(
  {
    academicYear: { type: String, required: true },
    school: { type: String, required: true },
    department: { type: String, required: true },

    components: [componentLibraryItemSchema],
  },
  { timestamps: true },
);

componentLibrarySchema.index(
  { academicYear: 1, school: 1, department: 1 },
  { unique: true },
);
componentLibrarySchema.index({ "components.name": 1 });
componentLibrarySchema.index({ "components.category": 1 });

const ComponentLibrary = mongoose.model(
  "ComponentLibrary",
  componentLibrarySchema,
);
export default ComponentLibrary;
