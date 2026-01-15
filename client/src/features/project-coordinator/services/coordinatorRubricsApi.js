// src/features/project-coordinator/services/coordinatorRubricsApi.js
import api from '../../../services/api';

/**
 * Get component library for the coordinator's academic context
 */
export const getComponentLibrary = async (academicYear, school, program) => {
    const response = await api.get('/coordinator/component-library', {
        params: { academicYear, school, program }
    });
    return response.data;
};

/**
 * Get marking schema for the coordinator's academic context
 */
export const getMarkingSchema = async (academicYear, school, program) => {
    const response = await api.get('/coordinator/marking-schema', {
        params: { academicYear, school, program }
    });
    return response.data;
};

/**
 * Update marking schema deadlines (PC can only update deadlines, not full schema structure)
 */
export const updateMarkingSchemaDeadlines = async (schemaId, deadlines) => {
    const response = await api.put(`/coordinator/marking-schema/${schemaId}/deadlines`, deadlines);
    return response.data;
};

/**
 * Create or update marking schema
 * Note: PC should be able to create reviews using predefined components
 */
export const createOrUpdateMarkingSchema = async (data) => {
    // Use admin endpoint for now as PC might need to save reviews
    // This may need adjustment based on backend implementation
    const response = await api.post('/coordinator/marking-schema', data);
    return response.data;
};
