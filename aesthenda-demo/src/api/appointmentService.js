import apiClient from './apiClient';
import { ENABLE_MOCK_API } from '../config';

/**
 * Appointment Service - Handles all operations related to salon appointments
 */
const appointmentService = {
  /**
   * Get appointments with pagination and filtering
   * @param {string} tenantId - The tenant ID
   * @param {Object} filters - Filter options (date, stylistId, status, etc.)
   * @param {number} page - Page number for pagination
   * @param {number} limit - Number of appointments per page
   * @returns {Promise} - Resolves to appointments data with pagination info
   */
  getAppointments: async (tenantId, filters = {}, page = 1, limit = 10) => {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        page,
        limit,
        ...filters
      }).toString();
      
      const response = await apiClient.get(`/api/salons/${tenantId}/appointments?${queryParams}`);
      return {
        success: true,
        data: response.data.appointments,
        pagination: response.data.pagination
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch appointments'
      };
    }
  },
  
  /**
   * Get a specific appointment by ID
   * @param {string} appointmentId - The appointment ID
   * @returns {Promise} - Resolves to appointment data
   */
  getAppointmentById: async (appointmentId) => {
    try {
      const response = await apiClient.get(`/api/appointments/${appointmentId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch appointment details'
      };
    }
  },
  
  /**
   * Create a new appointment
   * @param {Object} appointmentData - The appointment data
   * @returns {Promise} - Resolves to created appointment data
   */
  createAppointment: async (appointmentData) => {
    try {
      const response = await apiClient.post('/api/appointments', appointmentData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to create appointment'
      };
    }
  },
  
  /**
   * Create a recurring appointment series
   * @param {Object} recurringData - Recurring appointment data with pattern
   * @returns {Promise} - Resolves to created appointment series data
   */
  createRecurringAppointments: async (recurringData) => {
    try {
      const response = await apiClient.post('/api/appointments/recurring', recurringData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to create recurring appointments'
      };
    }
  },
  
  /**
   * Update an existing appointment
   * @param {string} appointmentId - The appointment ID
   * @param {Object} updateData - Updated appointment data
   * @returns {Promise} - Resolves to updated appointment data
   */
  updateAppointment: async (appointmentId, updateData) => {
    try {
      const response = await apiClient.put(`/api/appointments/${appointmentId}`, updateData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to update appointment'
      };
    }
  },
  
  /**
   * Reschedule an appointment to a new time
   * @param {string} appointmentId - The appointment ID
   * @param {Object} rescheduleData - New time and optional notes
   * @returns {Promise} - Resolves to rescheduled appointment data
   */
  rescheduleAppointment: async (appointmentId, rescheduleData) => {
    try {
      const response = await apiClient.put(`/api/appointments/${appointmentId}/reschedule`, rescheduleData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to reschedule appointment'
      };
    }
  },
  
  /**
   * Cancel an appointment
   * @param {string} appointmentId - The appointment ID
   * @param {Object} cancellationData - Cancellation reason and optional notes
   * @returns {Promise} - Resolves to cancelled appointment data
   */
  cancelAppointment: async (appointmentId, cancellationData) => {
    try {
      const response = await apiClient.put(`/api/appointments/${appointmentId}/cancel`, cancellationData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to cancel appointment'
      };
    }
  },
  
  /**
   * Delete an appointment permanently
   * @param {string} appointmentId - The appointment ID
   * @returns {Promise} - Resolves to success message
   */
  deleteAppointment: async (appointmentId) => {
    try {
      await apiClient.delete(`/api/appointments/${appointmentId}`);
      return {
        success: true,
        message: 'Appointment deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to delete appointment'
      };
    }
  },
  
  /**
   * Check availability for a specific service, stylist, and time period
   * @param {string} tenantId - The tenant ID
   * @param {string} serviceId - The service ID
   * @param {string} date - The date to check (YYYY-MM-DD)
   * @param {string} [stylistId] - Optional stylist ID to filter by
   * @returns {Promise} - Resolves to available time slots
   */
  checkAvailability: async (tenantId, serviceId, date, stylistId = null) => {
    try {
      let endpoint = `/api/salons/${tenantId}/availability?serviceId=${serviceId}&date=${date}`;
      if (stylistId) {
        endpoint += `&stylistId=${stylistId}`;
      }
      
      const response = await apiClient.get(endpoint);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to check availability'
      };
    }
  },
  
  /**
   * Subscribe to real-time availability updates
   * @param {string} tenantId - The tenant ID
   * @param {Function} callback - Function to call when availability changes
   * @returns {Function} - Unsubscribe function
   */
  subscribeToAvailabilityUpdates: async (tenantId, callback) => {
    if (ENABLE_MOCK_API) {
      console.log('Real-time availability updates not available in mock mode');
      return () => {}; // Return empty unsubscribe function
    }
    
    try {
      // This implementation would depend on the specific WebSocket library
      // or GraphQL subscription setup used in the project
      
      // For demonstration, we'll create a mock subscription
      const subscriptionId = Date.now().toString();
      
      // In a real implementation, this would connect to a WebSocket or GraphQL subscription
      console.log(`Subscribed to availability updates for tenant ${tenantId}`);
      
      // Return an unsubscribe function
      return () => {
        console.log(`Unsubscribed from availability updates for tenant ${tenantId}`);
      };
    } catch (error) {
      console.error('Error subscribing to availability updates:', error);
      return () => {}; // Return empty unsubscribe function
    }
  },
  
  /**
   * Add a client to the waitlist for a specific service/stylist
   * @param {string} tenantId - The tenant ID
   * @param {Object} waitlistData - Client and service details
   * @returns {Promise} - Resolves to waitlist entry data
   */
  addToWaitlist: async (tenantId, waitlistData) => {
    try {
      const response = await apiClient.post(`/api/salons/${tenantId}/waitlist`, waitlistData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to add to waitlist'
      };
    }
  },
  
  /**
   * Get the current waitlist
   * @param {string} tenantId - The tenant ID
   * @param {Object} filters - Filter options
   * @returns {Promise} - Resolves to waitlist entries
   */
  getWaitlist: async (tenantId, filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await apiClient.get(`/api/salons/${tenantId}/waitlist?${queryParams}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch waitlist'
      };
    }
  },
  
  /**
   * Remove a client from the waitlist
   * @param {string} tenantId - The tenant ID
   * @param {string} waitlistId - The waitlist entry ID
   * @returns {Promise} - Resolves to success message
   */
  removeFromWaitlist: async (tenantId, waitlistId) => {
    try {
      await apiClient.delete(`/api/salons/${tenantId}/waitlist/${waitlistId}`);
      return {
        success: true,
        message: 'Removed from waitlist successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to remove from waitlist'
      };
    }
  }
};

export default appointmentService; 