import api from '../../../services/api';

/**
 * Get master data (schools, programs, years)
 */
export const getMasterData = async () => {
    try {
        const response = await api.get('/faculty/master-data');
        return response.data.data;
    } catch (error) {
        console.error("Failed to fetch master data:", error);
        throw error;
    }
};

/**
 * Get faculty profile
 */
export const getProfile = async () => {
    try {
        const response = await api.get('/faculty/profile');
        return response.data.data;
    } catch (error) {
        console.error("Failed to fetch profile:", error);
        throw error;
    }
};
