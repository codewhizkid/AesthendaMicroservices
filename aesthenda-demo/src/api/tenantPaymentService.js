import axios from 'axios';

const PAYMENT_SERVICE_URL = process.env.REACT_APP_PAYMENT_SERVICE_URL || 'http://localhost:5004';

/**
 * Tenant Payment Configuration Service
 * Handles configuration of payment providers for tenants
 */
const tenantPaymentService = {
  /**
   * Get tenant payment configuration
   * @param {string} tenantId - The tenant ID
   * @returns {Promise} - Resolves to payment configuration
   */
  getPaymentConfig: async (tenantId) => {
    try {
      const response = await axios.get(`${PAYMENT_SERVICE_URL}/api/tenant/${tenantId}/payment-config`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch payment configuration'
      };
    }
  },
  
  /**
   * Update tenant payment configuration
   * @param {string} tenantId - The tenant ID
   * @param {Object} configData - Payment configuration data
   * @returns {Promise} - Resolves to updated configuration
   */
  updatePaymentConfig: async (tenantId, configData) => {
    try {
      const response = await axios.put(
        `${PAYMENT_SERVICE_URL}/api/tenant/${tenantId}/payment-config`,
        configData
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update payment configuration'
      };
    }
  },
  
  /**
   * Test payment provider configuration
   * @param {string} tenantId - The tenant ID
   * @param {Object} testData - Optional test parameters
   * @returns {Promise} - Resolves to test results
   */
  testPaymentConfig: async (tenantId, testData) => {
    try {
      const response = await axios.post(
        `${PAYMENT_SERVICE_URL}/api/tenant/${tenantId}/payment-config/test`,
        testData
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Payment configuration test failed'
      };
    }
  },
  
  /**
   * Get client-side payment configuration
   * @param {string} tenantId - The tenant ID
   * @returns {Promise} - Resolves to client-safe payment configuration
   */
  getClientConfig: async (tenantId) => {
    try {
      const response = await axios.get(`${PAYMENT_SERVICE_URL}/api/tenant/${tenantId}/client-config`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch client payment configuration'
      };
    }
  },
  
  /**
   * Process a payment
   * @param {string} tenantId - The tenant ID
   * @param {Object} paymentData - Payment data including amount, currency, etc.
   * @returns {Promise} - Resolves to payment intent data
   */
  createPayment: async (tenantId, paymentData) => {
    try {
      const response = await axios.post(
        `${PAYMENT_SERVICE_URL}/api/tenant/${tenantId}/payments`,
        paymentData
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create payment'
      };
    }
  },
  
  /**
   * Complete a payment
   * @param {string} tenantId - The tenant ID
   * @param {string} paymentId - The payment ID
   * @param {Object} completionData - Additional data required to complete the payment
   * @returns {Promise} - Resolves to completed payment data
   */
  completePayment: async (tenantId, paymentId, completionData) => {
    try {
      const response = await axios.post(
        `${PAYMENT_SERVICE_URL}/api/tenant/${tenantId}/payments/${paymentId}/complete`,
        completionData
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to complete payment'
      };
    }
  },
  
  /**
   * Get payment details
   * @param {string} tenantId - The tenant ID
   * @param {string} paymentId - The payment ID
   * @returns {Promise} - Resolves to payment details
   */
  getPaymentDetails: async (tenantId, paymentId) => {
    try {
      const response = await axios.get(
        `${PAYMENT_SERVICE_URL}/api/tenant/${tenantId}/payments/${paymentId}`
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch payment details'
      };
    }
  },
  
  /**
   * Refund a payment
   * @param {string} tenantId - The tenant ID
   * @param {string} paymentId - The payment ID
   * @param {Object} refundData - Refund details including amount, reason, etc.
   * @returns {Promise} - Resolves to refund details
   */
  refundPayment: async (tenantId, paymentId, refundData) => {
    try {
      const response = await axios.post(
        `${PAYMENT_SERVICE_URL}/api/tenant/${tenantId}/payments/${paymentId}/refund`,
        refundData
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to refund payment'
      };
    }
  }
};

export default tenantPaymentService; 