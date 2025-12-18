import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    deadline: { type: Date }, // Individual deadline for this coordinator
    useGlobalDeadline: { type: Boolean, default: true }, // If true, use DepartmentConfig deadline
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
    semester: {
      type: String,
      required: true,
      enum: ["Fall Semester", "Winter Semester"],
    },

    isPrimary: { type: Boolean, default: false },

    permissions: {
      // Basic permissions
      canEdit: permissionSchema,
      canView: permissionSchema,

      // Faculty management
      canCreateFaculty: permissionSchema,

      // Panel management
      canCreatePanels: permissionSchema,
      canAssignPanels: permissionSchema,

      // Student management
      canUploadStudents: permissionSchema,
      canModifyStudents: permissionSchema,

      // Project management
      canCreateProjects: permissionSchema,

      // Guide management
      canAssignGuides: permissionSchema,
      canReassignGuides: permissionSchema,

      // Team management
      canMergeTeams: permissionSchema,
      canSplitTeams: permissionSchema,

      // Schema management
      canEditMarkingSchema: permissionSchema,
    },

    assignedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

projectCoordinatorSchema.index({ school: 1, department: 1, academicYear: 1, semester: 1 });
projectCoordinatorSchema.index({ faculty: 1, academicYear: 1, semester: 1 });
projectCoordinatorSchema.index(
  { school: 1, department: 1, academicYear: 1, semester: 1, isPrimary: 1 },
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
