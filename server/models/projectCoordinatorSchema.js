import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    deadline: { type: Date }, // Individual deadline for this coordinator
    useGlobalDeadline: { type: Boolean, default: true }, // If true, use SystemConfig deadline
  },
  { _id: false },
);

const projectCoordinatorSchema = new mongoose.Schema(
  {
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
    school: { type: String, required: true },
    department: { type: String, required: true },
    academicYear: { type: String, required: true },

    isPrimary: { type: Boolean, default: false },

    permissions: {
      canEdit: permissionSchema,
      canView: permissionSchema,
      canCreateFaculty: permissionSchema,
      canCreatePanels: permissionSchema,
      canUploadStudents: permissionSchema,
      canAssignGuides: permissionSchema,
      canReassignGuides: permissionSchema,
      canMergeTeams: permissionSchema,
      canEditMarkingSchema: permissionSchema,
    },

    assignedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

projectCoordinatorSchema.index({ school: 1, department: 1, academicYear: 1 });
projectCoordinatorSchema.index({ faculty: 1, academicYear: 1 });
projectCoordinatorSchema.index(
  { school: 1, department: 1, academicYear: 1, isPrimary: 1 },
  {
    unique: true,
    partialFilterExpression: { isPrimary: true },
  },
);

const ProjectCoordinator = mongoose.model(
  "ProjectCoordinator",
  projectCoordinatorSchema,
);
export default ProjectCoordinator;
