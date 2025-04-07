import apiClient from './apiClient';

/**
 * Authentication Service - Handles user login, registration, and session management
 */
const authService = {
  /**
   * Log in a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} firstName - User first name (optional, for registration-style login)
   * @param {string} lastName - User last name (optional, for registration-style login)
   * @returns {Promise} - Resolves to user data on success
   */
  login: async (email, password, firstName = '', lastName = '') => {
    try {
      const response = await apiClient.post('/api/auth/login', {
        email,
        password,
        firstName,
        lastName
      });
      
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      
      return { 
        success: true, 
        user: response.user 
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  },
  
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} - Resolves to user data on success
   */
  register: async (userData) => {
    try {
      const response = await apiClient.post('/api/auth/register', userData);
      
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      
      return { 
        success: true, 
        user: response.user 
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  },
  
  /**
   * Log out the current user
   * @returns {Promise} - Resolves when logout is complete
   */
  logout: async () => {
    try {
      // Call logout endpoint to invalidate the token on the server
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Always clear local storage regardless of API success
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
    
    return { success: true };
  },
  
  /**
   * Get the currently logged in user's info
   * @returns {Promise} - Resolves to user data
   */
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/api/auth/me');
      return {
        success: true,
        user: response.user
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get user information'
      };
    }
  },
  
  /**
   * Check if the current authentication token is valid
   * @returns {Promise<boolean>} - Resolves to true if token is valid
   */
  verifyToken: async () => {
    try {
      const response = await apiClient.get('/api/auth/verify-token');
      return response.valid === true;
    } catch (error) {
      return false;
    }
  }
};

export default authService; 