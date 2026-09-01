import Faculty from "../models/facultySchema.js";
import bcrypt from "bcryptjs";
import { logger } from "../utils/logger.js";
import { buildCoordinatorFilterQuery, warnOnFilterMismatch } from "../utils/filterHelpers.js";

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
      !/^(\+91[- ]?)?[6-9]\d{9}$/.test(data.phoneNumber.toString().trim())
    ) {
      errors.push("Invalid Indian phone number format.");
    }

    if (data.password) {
      if (data.password.length < 6) {
        errors.push("Password must be at least 6 characters.");
      }
    }

    if (data.school && typeof data.school !== "string") {
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
    excludeId = null
  ) {
    const query = {
      $or: [
        { emailId: emailId?.trim().toLowerCase() },
        { employeeId: employeeId != null ? String(employeeId).trim().toUpperCase() : undefined },
        { phoneNumber: phoneNumber?.toString().trim() },
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
      data.phoneNumber
    );
    const incomingPrograms = Array.isArray(data.program)
      ? data.program.map(p => p.trim())
      : data.program ? [data.program.trim()] : [];

    if (existing) {
      // If faculty already exists, append new programs instead of throwing error
      let updated = false;
      const existingPrograms = Array.isArray(existing.program) ? existing.program : [];
      
      for (const p of incomingPrograms) {
        if (p && !existingPrograms.includes(p)) {
          existingPrograms.push(p);
          updated = true;
        }
      }

      if (updated) {
        existing.program = existingPrograms;
        await existing.save();
        
        if (createdBy) {
          logger.info("faculty_programs_appended", {
            facultyId: existing._id,
            employeeId: existing.employeeId,
            updatedPrograms: existing.program,
            createdBy,
          });
        }
      }
      
      return existing;
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
      employeeId: String(data.employeeId).trim().toUpperCase(),
      phoneNumber: data.phoneNumber?.toString().trim(),
      role: data.role || "faculty",
      school: data.school ? data.school.trim() : "",
      program: Array.isArray(data.program) ? data.program : (data.program ? [data.program.trim()] : []),
      specialization: data.specialization ? data.specialization.trim() : "",
      isDefaultPassword: true,
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
    const CONTEXT = "FacultyService";
    const query = {};

    // Always exclude admins from faculty list
    query.role = "faculty";

    if (filters.name) {
      query.name = filters.name;
    }

    // Build case-insensitive coordinator dimension filters
    const { query: coordQuery, appliedFilters } = buildCoordinatorFilterQuery(filters, CONTEXT);
    // Faculty schema: 'school' is String, 'program' is [String] — $regex works for both
    Object.assign(query, coordQuery);

    if (filters.specialization && filters.specialization !== "all") {
      query.specialization = { $in: [filters.specialization] };
    }

    if (filters.isProjectCoordinator !== undefined) {
      query.isProjectCoordinator = filters.isProjectCoordinator === 'true' || filters.isProjectCoordinator === true;
    }

    // Warn on potential program/school mismatch against actual DB values
    try {
      if (filters.program && filters.program !== "all") {
        const distinctPrograms = await Faculty.distinct("program");
        warnOnFilterMismatch(filters.program, distinctPrograms, "program", CONTEXT);
      }
      if (filters.school && filters.school !== "all") {
        const distinctSchools = await Faculty.distinct("school");
        warnOnFilterMismatch(filters.school, distinctSchools, "school", CONTEXT);
      }
    } catch (e) { /* non-fatal */ }

    const sort = sortOptions.sortBy
      ? { [sortOptions.sortBy]: sortOptions.sortOrder === "desc" ? -1 : 1 }
      : { name: 1 };

    const faculties = await Faculty.find(query).sort(sort).select("-password").lean();

    logger.info(`[${CONTEXT}] Query result`, {
      facultiesFound: faculties.length,
      appliedFilters,
    });
    if (faculties.length === 0) {
      logger.warn(`[${CONTEXT}] Zero faculties returned. Check if coordinator's program/school matches the Faculty collection.`, {
        requestedFilters: { school: filters.school, program: filters.program },
      });
    }

    return faculties;
  }

  /**
   * Get admin list (only for ADMIN001)
   */
  static async getAdminList(filters = {}, sortOptions = {}) {
    const query = { role: "admin" };

    if (filters.school && filters.school !== "all") {
      query.school = { $in: [filters.school] };
    }

    if (filters.program && filters.program !== "all") {
      const progStr = Array.isArray(filters.program)
        ? filters.program.map(p => p.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$\u0026')).join('|')
        : filters.program.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$\u0026');
      query.program = { $regex: new RegExp(`^(${progStr})$`, 'i') };
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
      !/^(\+91[- ]?)?[6-9]\d{9}$/.test(updates.phoneNumber.toString().trim())
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
          "Another faculty with this phone number already exists."
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
    if (updates.program) faculty.program = Array.isArray(updates.program) ? updates.program : [updates.program];
    if (updates.specialization) faculty.specialization = updates.specialization;
    if (updates.imageUrl !== undefined) faculty.imageUrl = updates.imageUrl;
    if (updates.isProjectCoordinator !== undefined) faculty.isProjectCoordinator = updates.isProjectCoordinator;

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
}
