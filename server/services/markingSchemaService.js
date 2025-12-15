import MarkingSchema from "../models/markingSchema.js";
import { logger } from "../utils/logger.js";

export class MarkingSchemaService {
  /**
   * Validate marking schema structure
   */
  static validateMarkingSchema(data) {
    const { school, department, academicYear, reviews, requiresContribution } =
      data;
    const errors = [];

    if (!school || !department || !academicYear) {
      errors.push("School, department, and academic year are required.");
    }

    if (!Array.isArray(reviews) || reviews.length === 0) {
      errors.push("At least one review is required.");
    }

    // Validate requiresContribution
    if (
      requiresContribution !== undefined &&
      typeof requiresContribution !== "boolean"
    ) {
      errors.push("requiresContribution must be a boolean.");
    }

    let totalWeight = 0;

    reviews?.forEach((review, index) => {
      // Required fields
      if (!review.reviewName || !review.displayName) {
        errors.push(
          `Review ${index + 1}: reviewName and displayName are required.`,
        );
      }

      if (
        !review.facultyType ||
        !["guide", "panel", "both"].includes(review.facultyType)
      ) {
        errors.push(
          `Review ${index + 1}: facultyType must be 'guide', 'panel', or 'both'.`,
        );
      }

      // Deadline validation
      if (!review.deadline?.from || !review.deadline?.to) {
        errors.push(
          `Review ${index + 1}: deadline with 'from' and 'to' dates is required.`,
        );
      } else {
        const fromDate = new Date(review.deadline.from);
        const toDate = new Date(review.deadline.to);

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
          errors.push(`Review ${index + 1}: Invalid date format.`);
        }

        if (fromDate >= toDate) {
          errors.push(
            `Review ${index + 1}: 'from' date must be before 'to' date.`,
          );
        }
      }

      // Components validation
      if (review.components && Array.isArray(review.components)) {
        let reviewWeight = 0;
        review.components.forEach((comp, cIndex) => {
          if (!comp.name || typeof comp.weight !== "number") {
            errors.push(
              `Review ${index + 1}, Component ${cIndex + 1}: name and weight are required.`,
            );
          }

          if (comp.weight < 0) {
            errors.push(
              `Review ${index + 1}, Component ${cIndex + 1}: weight cannot be negative.`,
            );
          }

          reviewWeight += comp.weight || 0;

          // Validate subcomponents
          if (comp.subComponents && Array.isArray(comp.subComponents)) {
            let subWeight = 0;
            comp.subComponents.forEach((sub, sIndex) => {
              if (!sub.name || typeof sub.weight !== "number") {
                errors.push(
                  `Review ${index + 1}, Component ${cIndex + 1}, SubComponent ${sIndex + 1}: name and weight required.`,
                );
              }
              subWeight += sub.weight || 0;
            });

            if (Math.abs(subWeight - comp.weight) > 0.01) {
              errors.push(
                `Review ${index + 1}, Component ${cIndex + 1}: subcomponent weights don't match component weight.`,
              );
            }
          }
        });

        totalWeight += reviewWeight;
      }
    });

    // Total weight validation (optional, can be configured)
    if (totalWeight > 0 && Math.abs(totalWeight - 100) > 0.01) {
      errors.push(
        `Total weight across all reviews must equal 100. Current: ${totalWeight}`,
      );
    }

    return errors;
  }

  /**
   * Create or update marking schema
   */
  static async createOrUpdateMarkingSchema(data, createdBy = null) {
    const {
      school,
      department,
      academicYear,
      reviews,
      requiresContribution,
      contributionTypes,
      totalWeightage,
    } = data;

    // Validate
    const validationErrors = this.validateMarkingSchema(data);
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join("; "));
    }

    // Clean reviews (remove requiresContribution from individual reviews if present)
    const cleanedReviews = reviews.map((review) => ({
      reviewName: review.reviewName,
      displayName: review.displayName || review.reviewName,
      facultyType: review.facultyType,
      components: review.components || [],
      deadline: review.deadline,
      pptRequired: review.pptRequired || false,
      draftRequired: review.draftRequired || false,
      order: review.order || 0,
      isActive: review.isActive !== undefined ? review.isActive : true,
    }));

    const schemaData = {
      school,
      department,
      academicYear,
      reviews: cleanedReviews,
      requiresContribution: requiresContribution || false,
      contributionTypes: contributionTypes || [],
      totalWeightage: totalWeightage || 100,
    };

    const existingSchema = await MarkingSchema.findOne({
      school,
      department,
      academicYear,
    });

    let schema;
    if (existingSchema) {
      Object.assign(existingSchema, schemaData);
      schema = await existingSchema.save();
    } else {
      schema = new MarkingSchema(schemaData);
      await schema.save();
    }

    if (createdBy) {
      logger.info("marking_schema_updated", {
        schemaId: schema._id,
        academicYear,
        school,
        department,
        reviewCount: cleanedReviews.length,
        updatedBy: createdBy,
      });
    }

    return schema;
  }

  /**
   * Get marking schema
   */
  static async getMarkingSchema(academicYear, school, department) {
    const schema = await MarkingSchema.findOne({
      academicYear,
      school,
      department,
    }).lean();

    if (!schema) {
      throw new Error("Marking schema not found.");
    }

    return schema;
  }

  /**
   * Update deadlines for reviews
   */
  static async updateDeadlines(
    academicYear,
    school,
    department,
    deadlines,
    updatedBy = null,
  ) {
    const schema = await MarkingSchema.findOne({
      academicYear,
      school,
      department,
    });

    if (!schema) {
      throw new Error("Marking schema not found.");
    }

    deadlines.forEach(({ reviewName, deadline }) => {
      const review = schema.reviews.find((r) => r.reviewName === reviewName);
      if (review) {
        review.deadline = deadline;
      }
    });

    await schema.save();

    if (updatedBy) {
      logger.info("marking_schema_deadlines_updated", {
        schemaId: schema._id,
        academicYear,
        school,
        department,
        updatedBy,
      });
    }

    return schema;
  }
}
