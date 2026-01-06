import MarkingSchema from "../models/markingSchema.js";
import ComponentLibrary from "../models/componentLibrarySchema.js";
import { logger } from "../utils/logger.js";

export class MarkingSchemaService {
  /**
   * Validate marking schema data
   */
  static validateMarkingSchema(data) {
    const errors = [];

    if (!data.academicYear) {
      errors.push("Academic year is required");
    }

    if (!data.school) {
      errors.push("School is required");
    }

    if (!data.program) {
      errors.push("Program is required");
    }

    if (
      !data.reviews ||
      !Array.isArray(data.reviews) ||
      data.reviews.length === 0
    ) {
      errors.push("At least one review is required");
    }

    // Validate reviews
    if (data.reviews) {
      data.reviews.forEach((review, index) => {
        const reviewNum = index + 1;

        if (!review.reviewName) {
          errors.push(`Review ${reviewNum}: reviewName is required`);
        }

        if (!review.displayName) {
          errors.push(`Review ${reviewNum}: displayName is required`);
        }

        // ✅ Keep facultyType
        if (!review.facultyType) {
          errors.push(`Review ${reviewNum}: facultyType is required`);
        } else if (!["guide", "panel", "both"].includes(review.facultyType)) {
          errors.push(
            `Review ${reviewNum}: facultyType must be 'guide', 'panel', or 'both'`
          );
        }

        // Validate components
        if (!review.components || !Array.isArray(review.components)) {
          errors.push(`Review ${reviewNum}: components array is required`);
        } else if (review.components.length === 0) {
          errors.push(
            `Review ${reviewNum}: at least one component is required`
          );
        } else {
          review.components.forEach((comp, compIndex) => {
            const compNum = compIndex + 1;

            if (!comp.name) {
              errors.push(
                `Review ${reviewNum}, Component ${compNum}: name is required`
              );
            }

            // ✅ Changed from weight to maxMarks
            if (comp.maxMarks === undefined || comp.maxMarks === null) {
              errors.push(
                `Review ${reviewNum}, Component ${compNum}: maxMarks is required`
              );
            } else if (typeof comp.maxMarks !== "number" || comp.maxMarks < 0) {
              errors.push(
                `Review ${reviewNum}, Component ${compNum}: maxMarks must be a positive number`
              );
            }

            // Validate componentId if provided
            if (
              comp.componentId &&
              !comp.componentId.match(/^[0-9a-fA-F]{24}$/)
            ) {
              errors.push(
                `Review ${reviewNum}, Component ${compNum}: invalid componentId format`
              );
            }
          });
        }

        // Validate deadline if provided
        if (review.deadline) {
          if (review.deadline.from && review.deadline.to) {
            const from = new Date(review.deadline.from);
            const to = new Date(review.deadline.to);

            if (from >= to) {
              errors.push(
                `Review ${reviewNum}: deadline 'from' must be before 'to'`
              );
            }
          }
        }
      });
    }

    return errors;
  }

  /**
   * Validate component IDs exist in component library
   */
  static async validateComponentIds(components, academicYear, school, program) {
    const library = await ComponentLibrary.findOne({
      academicYear,
      school,
      program,
    });

    if (!library) {
      throw new Error(
        "Component library not found for this program. Please create component library first."
      );
    }

    const validComponentIds = library.components.map((c) => c._id.toString());
    const errors = [];

    for (const comp of components) {
      if (comp.componentId) {
        if (!validComponentIds.includes(comp.componentId.toString())) {
          errors.push(
            `Component "${comp.name}" with ID ${comp.componentId} not found in library`
          );
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join("; "));
    }

    return true;
  }

  /**
   * Create or update marking schema
   */
  static async createOrUpdateMarkingSchema(data, createdBy = null) {
    const {
      school,
      program,
      academicYear,
      reviews,
      requiresContribution,
      contributionType,
    } = data;

    // Auto-generate reviewName if missing
    reviews.forEach((review) => {
      if (!review.reviewName && review.displayName) {
        review.reviewName =
          review.displayName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "") +
          "_" +
          Date.now().toString().slice(-4);
      } else if (!review.reviewName) {
        review.reviewName = `review_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 5)}`;
      }
    });

    // Validate basic structure
    const validationErrors = this.validateMarkingSchema(data);
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join("; "));
    }

    // Validate component IDs if provided
    for (const review of reviews) {
      if (review.components && review.components.length > 0) {
        const hasComponentIds = review.components.some((c) => c.componentId);
        if (hasComponentIds) {
          await this.validateComponentIds(
            review.components,
            academicYear,
            school,
            program
          );
        }
      }
    }

    // Clean and prepare reviews
    const cleanedReviews = reviews.map((review, index) => ({
      reviewName: review.reviewName,
      displayName: review.displayName || review.reviewName,
      facultyType: review.facultyType, // ✅ Keep facultyType
      components: (review.components || []).map((comp) => ({
        componentId: comp.componentId || null,
        name: comp.name,
        maxMarks: comp.maxMarks, // ✅ Changed from weight to maxMarks
        description: comp.description || "",
        subComponents: (comp.subComponents || []).map((sub) => ({
          name: sub.name,
          weight: sub.weight,
          description: sub.description,
          isPredefined: sub.isPredefined || false,
        })),
      })),
      deadline: review.deadline || null,
      order: review.order !== undefined ? review.order : index,
      isActive: review.isActive !== undefined ? review.isActive : true,
    }));

    const schemaData = {
      school,
      program,
      academicYear,
      reviews: cleanedReviews,
      requiresContribution: requiresContribution || false,
      contributionType: contributionType || "none",
      isActive: true,
    };

    // Check if schema already exists
    const existingSchema = await MarkingSchema.findOne({
      school,
      program,
      academicYear,
    });

    let schema;
    if (existingSchema) {
      // Update existing schema
      Object.assign(existingSchema, schemaData);
      schema = await existingSchema.save();

      if (createdBy) {
        logger.info("marking_schema_updated", {
          schemaId: schema._id,
          academicYear,
          school,
          program,
          reviewCount: cleanedReviews.length,
          updatedBy: createdBy,
        });
      }
    } else {
      // Create new schema
      schema = new MarkingSchema(schemaData);
      await schema.save();

      if (createdBy) {
        logger.info("marking_schema_created", {
          schemaId: schema._id,
          academicYear,
          school,
          program,
          reviewCount: cleanedReviews.length,
          createdBy,
        });
      }
    }

    return schema;
  }

  /**
   * Get marking schema
   */
  static async getMarkingSchema(academicYear, school, program) {
    const schema = await MarkingSchema.findOne({
      academicYear,
      school,
      program,
      isActive: true,
    }).lean();

    if (!schema) {
      throw new Error("Marking schema not found for this program.");
    }

    return schema;
  }

  /**
   * Get all marking schemas with filters
   */
  static async getMarkingSchemas(filters = {}) {
    const query = { isActive: true };

    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.school) query.school = filters.school;
    if (filters.program) query.program = filters.program;

    return await MarkingSchema.find(query).sort({ createdAt: -1 }).lean();
  }

  /**
   * Update marking schema
   */
  static async updateMarkingSchema(id, updates, updatedBy = null) {
    const schema = await MarkingSchema.findById(id);

    if (!schema) {
      throw new Error("Marking schema not found.");
    }

    // Validate if reviews are being updated
    if (updates.reviews) {
      const validationData = {
        academicYear: schema.academicYear,
        school: schema.school,
        program: schema.program,
        reviews: updates.reviews,
      };

      const validationErrors = this.validateMarkingSchema(validationData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join("; "));
      }

      // Validate component IDs if provided
      for (const review of updates.reviews) {
        if (review.components && review.components.length > 0) {
          const hasComponentIds = review.components.some((c) => c.componentId);
          if (hasComponentIds) {
            await this.validateComponentIds(
              review.components,
              schema.academicYear,
              schema.school,
              schema.program
            );
          }
        }
      }
    }

    // Apply updates
    Object.assign(schema, updates);
    await schema.save();

    if (updatedBy) {
      logger.info("marking_schema_updated", {
        schemaId: id,
        updatedFields: Object.keys(updates),
        updatedBy,
      });
    }

    return schema;
  }

  /**
   * Delete marking schema
   */
  static async deleteMarkingSchema(id, deletedBy = null) {
    const schema = await MarkingSchema.findById(id);

    if (!schema) {
      throw new Error("Marking schema not found.");
    }

    // Soft delete
    schema.isActive = false;
    await schema.save();

    if (deletedBy) {
      logger.info("marking_schema_deleted", {
        schemaId: id,
        deletedBy,
      });
    }

    return schema;
  }
}
