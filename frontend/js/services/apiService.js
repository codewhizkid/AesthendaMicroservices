/**
 * API Service for Aesthenda Admin Panel
 * Centralizes API calls, error handling, and authentication
 */

// Get the authentication token from localStorage or sessionStorage
const getAuthToken = () => localStorage.getItem('token') || sessionStorage.getItem('token') || '';

// Base headers with authentication
const getAuthHeaders = (contentType = 'application/json') => {
  const headers = {
    'Authorization': `Bearer ${getAuthToken()}`
  };
  
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  
  return headers;
};

/**
 * Generic API request function
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} - Response data
 */
const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(endpoint, options);
    
    // Check if the response is OK (status in the range 200-299)
    if (!response.ok) {
      // Try to parse error response if available
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // If response isn't JSON, use status text
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }
      
      // Use error message from API if available
      throw new Error(errorData.error || errorData.message || `Request failed: ${response.status}`);
    }
    
    // For 204 No Content responses
    if (response.status === 204) {
      return { success: true };
    }
    
    // Parse the response as JSON
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * GET request
 * @param {string} endpoint - API endpoint
 * @returns {Promise} - Response data
 */
export const get = (endpoint) => {
  return apiRequest(endpoint, {
    method: 'GET',
    headers: getAuthHeaders()
  });
};

/**
 * POST request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @returns {Promise} - Response data
 */
export const post = (endpoint, data) => {
  return apiRequest(endpoint, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
};

/**
 * PUT request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @returns {Promise} - Response data
 */
export const put = (endpoint, data) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
};

/**
 * DELETE request
 * @param {string} endpoint - API endpoint
 * @returns {Promise} - Response data
 */
export const del = (endpoint) => {
  return apiRequest(endpoint, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
};

/**
 * Upload file request
 * @param {string} endpoint - API endpoint
 * @param {FormData} formData - Form data with file
 * @returns {Promise} - Response data
 */
export const uploadFile = (endpoint, formData) => {
  return apiRequest(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
      // No Content-Type header for FormData/file uploads
    },
    body: formData
  });
};

/**
 * Service-specific API helpers
 */

// Salon profile API
export const salonApi = {
  getProfile: () => get('/api/salon/profile'),
  updateProfile: (data) => put('/api/salon/profile', data),
  uploadLogo: (formData) => uploadFile('/api/salon/upload-logo', formData)
};

// Roles API
export const rolesApi = {
  getRoles: () => get('/api/roles'),
  createRole: (role) => post('/api/roles', role),
  updateRole: (roleId, role) => put(`/api/roles/${roleId}`, role),
  deleteRole: (roleId) => del(`/api/roles/${roleId}`)
};

// Staff API
export const staffApi = {
  getStaff: () => get('/api/staff'),
  createStaff: (staff) => post('/api/staff', staff),
  updateStaff: (staffId, staff) => put(`/api/staff/${staffId}`, staff),
  deleteStaff: (staffId) => del(`/api/staff/${staffId}`),
  assignRole: (staffId, roleId) => post(`/api/staff/${staffId}/roles`, { roleId })
};

// Services API
export const servicesApi = {
  getCategories: () => get('/api/service-categories'),
  createCategory: (category) => post('/api/service-categories', category),
  updateCategory: (categoryId, category) => put(`/api/service-categories/${categoryId}`, category),
  deleteCategory: (categoryId) => del(`/api/service-categories/${categoryId}`),
  
  getServices: () => get('/api/services'),
  createService: (service) => post('/api/services', service),
  updateService: (serviceId, service) => put(`/api/services/${serviceId}`, service),
  deleteService: (serviceId) => del(`/api/services/${serviceId}`)
};

export default {
  getAuthToken,
  get,
  post,
  put,
  del,
  uploadFile,
  salonApi,
  rolesApi,
  staffApi,
  servicesApi
}; 