// src/services/componentLibraryApi.js
import api from "./api";

/**
 * Get component library for a specific academic context
 * Backend expects: academicYear (String), school (String), department (String) as query params
 */
export const getComponentLibrary = async (academicYear, school, program) => {
  const response = await api.get("/admin/component-library", {
    params: {
      academicYear: String(academicYear),
      school: String(school),
      program: String(program),
    },
  });
  return response.data;
};

/**
 * Create a new component library
 * Backend expects: { academicYear, school, department, components }
 * components: Array of component objects with structure:
 * {
 *   name: String (required),
 *   category: String (enum: Research, Implementation, Documentation, Presentation, Testing, Design, Analysis, Other),
 *   description: String,
 *   suggestedWeight: Number,
 *   predefinedSubComponents: [{ name: String, description: String, weight: Number }],
 *   allowCustomSubComponents: Boolean,
 *   isActive: Boolean,
 *   applicableFor: Array of Strings (enum: hardware, software, both)
 * }
 */
export const createComponentLibrary = async (data) => {
  // Ensure required fields and proper data types
  const payload = {
    academicYear: String(data.academicYear),
    school: String(data.school),
    program: String(data.program),
    components: Array.isArray(data.components)
      ? data.components.map((comp) => ({
          name: String(comp.name),
          category: comp.category || "Other",
          description: comp.description || "",
          suggestedWeight: Number(comp.suggestedWeight) || 0,
          predefinedSubComponents: Array.isArray(comp.predefinedSubComponents)
            ? comp.predefinedSubComponents.map((sub) => ({
                name: String(sub.name),
                description: sub.description || "",
                weight: Number(sub.weight) || 0,
              }))
            : [],
          allowCustomSubComponents: Boolean(
            comp.allowCustomSubComponents !== false
          ),
          isActive: Boolean(comp.isActive !== false),
          applicableFor: Array.isArray(comp.applicableFor)
            ? comp.applicableFor
            : ["both"],
        }))
      : [],
  };

  const response = await api.post("/admin/component-library", payload);
  return response.data;
};

/**
 * Update an existing component library
 * Backend expects: any valid fields to update (typically { components: [...] })
 */
export const updateComponentLibrary = async (id, data) => {
  // Ensure proper data types for components if provided
  const payload = {};

  if (data.components && Array.isArray(data.components)) {
    payload.components = data.components.map((comp) => ({
      ...(comp._id && { _id: comp._id }), // Preserve _id if it exists
      name: String(comp.name),
      category: comp.category || "Other",
      description: comp.description || "",
      suggestedWeight: Number(comp.suggestedWeight) || 0,
      predefinedSubComponents: Array.isArray(comp.predefinedSubComponents)
        ? comp.predefinedSubComponents.map((sub) => ({
            ...(sub._id && { _id: sub._id }), // Preserve _id if it exists
            name: String(sub.name),
            description: sub.description || "",
            weight: Number(sub.weight) || 0,
          }))
        : [],
      allowCustomSubComponents: Boolean(
        comp.allowCustomSubComponents !== false
      ),
      isActive: Boolean(comp.isActive !== false),
      applicableFor: Array.isArray(comp.applicableFor)
        ? comp.applicableFor
        : ["both"],
    }));
  }

  // Include any other fields from data
  Object.keys(data).forEach((key) => {
    if (key !== "components") {
      payload[key] = data[key];
    }
  });

  const response = await api.put(`/admin/component-library/${id}`, payload);
  return response.data;
};
