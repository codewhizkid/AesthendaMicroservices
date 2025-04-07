import apiClient from './apiClient';

/**
 * Tenant Service - Handles salon and tenant-specific data
 */
const tenantService = {
  /**
   * Get salon data by tenant ID
   * @param {string} tenantId - The tenant ID
   * @returns {Promise} - Resolves to salon data
   */
  getSalonByTenantId: async (tenantId) => {
    try {
      const response = await apiClient.get(`/api/salons/${tenantId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch salon data'
      };
    }
  },
  
  /**
   * Get staff members for a salon
   * @param {string} tenantId - The tenant ID
   * @returns {Promise} - Resolves to staff data array
   */
  getStaffMembers: async (tenantId) => {
    try {
      const response = await apiClient.get(`/api/salons/${tenantId}/staff`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch staff members'
      };
    }
  },

  /**
   * Get appointments for a tenant or specific stylist
   * @param {string} tenantId - The tenant ID
   * @param {string} stylistId - Optional stylist ID to filter by
   * @returns {Promise} - Resolves to appointments data array
   */
  getAppointments: async (tenantId, stylistId = null) => {
    try {
      const endpoint = stylistId 
        ? `/api/salons/${tenantId}/appointments?stylistId=${stylistId}`
        : `/api/salons/${tenantId}/appointments`;
        
      const response = await apiClient.get(endpoint);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch appointments'
      };
    }
  },
  
  /**
   * Get service by ID
   * @param {string} serviceId - The service ID
   * @returns {Promise} - Resolves to service data
   */
  getServiceById: async (serviceId) => {
    try {
      const response = await apiClient.get(`/api/services/${serviceId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch service'
      };
    }
  },
  
  /**
   * Update salon information
   * @param {string} tenantId - The tenant ID
   * @param {Object} salonData - Updated salon data
   * @returns {Promise} - Resolves to updated salon data
   */
  updateSalonInfo: async (tenantId, salonData) => {
    try {
      const response = await apiClient.put(`/api/salons/${tenantId}`, salonData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to update salon information'
      };
    }
  },
  
  /**
   * Update salon branding
   * @param {string} tenantId - The tenant ID
   * @param {Object} brandingData - Updated branding data
   * @returns {Promise} - Resolves to updated salon data
   */
  updateBranding: async (tenantId, brandingData) => {
    try {
      const response = await apiClient.put(`/api/salons/${tenantId}/branding`, brandingData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to update branding'
      };
    }
  }
};

export default tenantService; 