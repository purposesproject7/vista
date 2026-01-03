import api from '../../../services/api';
import { toServerLoginPayload, fromServerUser } from './authAdapter';

/**
 * Login user
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} - { user, token }
 */
export const loginUser = async (credentials) => {
  try {
    const payload = toServerLoginPayload(credentials);
    console.log('Login payload:', payload);
    const response = await api.post('/auth/login', payload);
    
    if (response.data.success) {
      return {
        user: fromServerUser(response.data.data),
        token: response.data.token
      };
    }
    throw new Error(response.data.message || 'Login failed');
  } catch (error) {
    throw error.response?.data?.message || error.message || 'Login failed';
  }
};

/**
 * Get current user profile
 * @returns {Promise<Object>} - User object
 */
export const getCurrentUser = async () => {
  try {
    // Using faculty profile endpoint as it seems to cover admin/faculty
    // If role-specific endpoints are needed, we might need to check the token role first
    const response = await api.get('/faculty/profile');
    
    if (response.data.success) {
      return fromServerUser(response.data.data);
    }
    throw new Error(response.data.message || 'Failed to fetch profile');
  } catch (error) {
    throw error.response?.data?.message || error.message || 'Failed to fetch profile';
  }
};
