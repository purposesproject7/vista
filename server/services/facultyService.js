import Faculty from "../models/facultySchema.js";
import bcrypt from "bcryptjs";
import { logger } from "../utils/logger.js";

export class FacultyService {
  /**
   * Validate faculty data
   */
  static validateFacultyData(data) {
    const errors = [];

    if (!data.emailId?.endsWith("@vit.ac.in")) {
      errors.push("Only college emails allowed.");
    }

    if (
      !data.phoneNumber ||
      !/^(\+91[- ]?)?[6-9]\d{9}$/.test(data.phoneNumber)
    ) {
      errors.push("Invalid Indian phone number format.");
    }

    if (data.password) {
      if (
        data.password.length < 8 ||
        !/[A-Z]/.test(data.password) ||
        !/[a-z]/.test(data.password) ||
        !/[0-9]/.test(data.password) ||
        !/[^A-Za-z0-9]/.test(data.password)
      ) {
        errors.push(
          "Password must be at least 8 characters with uppercase, lowercase, number, and special character.",
        );
      }
    }

    if (!data.school || typeof data.school !== "string") {
      errors.push("School must be a string.");
    }

    if (
      data.role === "faculty" &&
      (!data.specialization || typeof data.specialization !== "string")
    ) {
      errors.push("Faculty must have a specialization.");
    }

    return errors;
  }

  /**
   * Check if faculty exists by email, employeeId, or phone
   */
  static async checkDuplicate(
    emailId,
    employeeId,
    phoneNumber,
    excludeId = null,
  ) {
    const query = {
      $or: [
        { emailId: emailId?.trim().toLowerCase() },
        { employeeId: employeeId?.trim().toUpperCase() },
        { phoneNumber: phoneNumber?.trim() },
      ],
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    return await Faculty.findOne(query);
  }

  /**
   * Create faculty with validation and duplicate check
   */
  static async createFaculty(data, createdBy = null) {
    // Validate
    const validationErrors = this.validateFacultyData(data);
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(", "));
    }

    // Check duplicate
    const existing = await this.checkDuplicate(
      data.emailId,
      data.employeeId,
      data.phoneNumber,
    );
    if (existing) {
      throw new Error(
        "Faculty with this email, employee ID, or phone number already exists.",
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // Create faculty
    const newFaculty = new Faculty({
      imageUrl: data.imageUrl || "",
      name: data.name.trim(),
      emailId: data.emailId.trim().toLowerCase(),
      password: hashedPassword,
      employeeId: data.employeeId.trim().toUpperCase(),
      phoneNumber: data.phoneNumber.trim(),
      role: data.role || "faculty",
      school: data.school.trim(),
      department: data.department ? data.department.trim() : undefined,
      specialization: data.specialization ? data.specialization.trim() : "",
    });

    await newFaculty.save();

    if (createdBy) {
      logger.info("faculty_created", {
        facultyId: newFaculty._id,
        employeeId: newFaculty.employeeId,
        role: newFaculty.role,
        createdBy,
      });
    }

    return newFaculty;
  }

  /**
   * Get faculty with filters
   */
  static async getFacultyList(filters = {}, sortOptions = {}) {
    const query = {};

    if (filters.school && filters.school !== "all") {
      query.school = { $in: [filters.school] };
    }

    if (filters.department && filters.department !== "all") {
      query.department = { $in: [filters.department] };
    }

    if (filters.specialization && filters.specialization !== "all") {
      query.specialization = { $in: [filters.specialization] };
    }

    if (filters.role) {
      query.role = filters.role;
    }

    if (filters.academicYear) {
      // This might be used to filter by academic year context
      query.school = { $in: [filters.school] };
      query.department = { $in: [filters.department] };
    }

    const sort = sortOptions.sortBy
      ? { [sortOptions.sortBy]: sortOptions.sortOrder === "desc" ? -1 : 1 }
      : { name: 1 };

    return await Faculty.find(query).sort(sort).select("-password").lean();
  }

  /**
   * Update faculty
   */
  static async updateFaculty(employeeId, updates, updatedBy = null) {
    const faculty = await Faculty.findOne({
      employeeId: employeeId.trim().toUpperCase(),
    });

    if (!faculty) {
      throw new Error("Faculty not found.");
    }

    // Validate updated data
    if (updates.emailId && !updates.emailId.endsWith("@vit.ac.in")) {
      throw new Error("Only college emails allowed.");
    }

    if (
      updates.phoneNumber &&
      !/^(\+91[- ]?)?[6-9]\d{9}$/.test(updates.phoneNumber)
    ) {
      throw new Error("Invalid phone number format.");
    }

    // Check duplicate for changed fields
    if (updates.emailId && updates.emailId !== faculty.emailId) {
      const emailExists = await Faculty.findOne({
        emailId: updates.emailId,
        _id: { $ne: faculty._id },
      });
      if (emailExists) {
        throw new Error("Another faculty with this email already exists.");
      }
    }

    if (updates.phoneNumber && updates.phoneNumber !== faculty.phoneNumber) {
      const phoneExists = await Faculty.findOne({
        phoneNumber: updates.phoneNumber,
        _id: { $ne: faculty._id },
      });
      if (phoneExists) {
        throw new Error(
          "Another faculty with this phone number already exists.",
        );
      }
    }

    // Update password if provided
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      faculty.password = await bcrypt.hash(updates.password, salt);
    }

    // Update other fields
    if (updates.name) faculty.name = updates.name;
    if (updates.emailId) faculty.emailId = updates.emailId.trim().toLowerCase();
    if (updates.phoneNumber) faculty.phoneNumber = updates.phoneNumber;
    if (updates.role) faculty.role = updates.role;
    if (updates.school) faculty.school = updates.school;
    if (updates.department) faculty.department = updates.department;
    if (updates.specialization) faculty.specialization = updates.specialization;
    if (updates.imageUrl !== undefined) faculty.imageUrl = updates.imageUrl;

    await faculty.save();

    if (updatedBy) {
      logger.info("faculty_updated", {
        facultyId: faculty._id,
        employeeId: faculty.employeeId,
        updatedBy,
      });
    }

    return faculty;
  }

  /**
   * Delete faculty
   */
  static async deleteFaculty(employeeId, deletedBy = null) {
    const faculty = await Faculty.findOneAndDelete({
      employeeId: employeeId.trim().toUpperCase(),
    });

    if (!faculty) {
      throw new Error("Faculty not found.");
    }

    if (deletedBy) {
      logger.info("faculty_deleted", {
        facultyId: faculty._id,
        employeeId: faculty.employeeId,
        deletedBy,
      });
    }

    return faculty;
  }

  /**
   * Get faculty details in bulk
   */
  static async getFacultyDetailsBulk(employeeIds) {
    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return [];
    }

    const uniqueIds = [...new Set(employeeIds.map((id) => id.trim().toUpperCase()))];

    const faculties = await Faculty.find({
      employeeId: { $in: uniqueIds },
    })
      .select("name emailId employeeId school department specialization")
      .lean();

    return faculties;
  }
}
