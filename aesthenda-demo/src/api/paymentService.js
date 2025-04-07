import apiClient from './apiClient';

/**
 * Payment Service - Handles subscription plans and payment processing
 */
const paymentService = {
  /**
   * Get available subscription plans
   * @returns {Promise} - Resolves to array of plans
   */
  getSubscriptionPlans: async () => {
    try {
      const response = await apiClient.get('/api/plans');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch subscription plans'
      };
    }
  },
  
  /**
   * Get plan details by ID
   * @param {string} planId - The plan ID
   * @returns {Promise} - Resolves to plan details
   */
  getPlanById: async (planId) => {
    try {
      const response = await apiClient.get(`/api/plans/${planId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch plan details'
      };
    }
  },
  
  /**
   * Create a new subscription
   * @param {string} planId - The selected plan ID
   * @param {Object} paymentMethodData - Payment method details
   * @returns {Promise} - Resolves to subscription data
   */
  createSubscription: async (planId, paymentMethodData) => {
    try {
      const response = await apiClient.post('/api/subscriptions', {
        planId,
        paymentMethod: paymentMethodData
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to create subscription'
      };
    }
  },
  
  /**
   * Apply a promo code to a plan
   * @param {string} promoCode - The promo code to apply
   * @param {string} planId - The plan ID
   * @returns {Promise} - Resolves to discount data
   */
  applyPromoCode: async (promoCode, planId) => {
    try {
      const response = await apiClient.post('/api/promo-codes/validate', {
        code: promoCode,
        planId
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Invalid promo code'
      };
    }
  },
  
  /**
   * Create a salon with subscription
   * @param {Object} salonData - Salon data
   * @param {Object} subscriptionData - Subscription details
   * @returns {Promise} - Resolves to salon and subscription data
   */
  createSalonWithSubscription: async (salonData, subscriptionData) => {
    try {
      const response = await apiClient.post('/api/salons', {
        salon: salonData,
        subscription: subscriptionData
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to create salon and subscription'
      };
    }
  },
  
  /**
   * Get current subscription details
   * @param {string} tenantId - The tenant ID
   * @returns {Promise} - Resolves to subscription data
   */
  getCurrentSubscription: async (tenantId) => {
    try {
      const response = await apiClient.get(`/api/salons/${tenantId}/subscription`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch subscription details'
      };
    }
  }
};

export default paymentService; 