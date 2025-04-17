const stripe = require('./stripe');
const BasePaymentProvider = require('./BasePaymentProvider');

/**
 * Factory function to get payment provider by name
 * @param {string} providerName - Name of the provider (stripe, square, paypal, mock)
 * @returns {Object} - Payment provider instance
 */
const getProvider = (providerName) => {
  switch (providerName.toLowerCase()) {
    case 'stripe':
      return stripe;
    default:
      // Default to mock provider for testing
      return createMockProvider();
  }
};

/**
 * Create a mock payment provider for testing
 * @returns {Object} - Mock payment provider
 */
const createMockProvider = () => {
  return {
    initialize: async (config) => {
      console.log('Initialized mock payment provider with config:', config);
      return true;
    },
    
    testConnection: async (credentials) => {
      console.log('Testing mock connection with credentials:', credentials);
      return { success: true, message: 'Mock connection successful' };
    },
    
    createPaymentIntent: async (amount, currency, metadata) => {
      console.log(`Creating mock payment intent: ${amount} ${currency}`);
      return {
        id: `mock_pi_${Date.now()}`,
        clientSecret: `mock_secret_${Date.now()}`,
        amount: amount,
        currency: currency,
        status: 'requires_payment_method',
        metadata: metadata || {}
      };
    },
    
    processPayment: async (paymentIntentId, paymentMethodId) => {
      console.log(`Processing mock payment: ${paymentIntentId} with method ${paymentMethodId}`);
      return {
        id: paymentIntentId,
        status: 'succeeded',
        amount: 100.00,
        currency: 'usd',
        paymentMethod: paymentMethodId,
        metadata: { mock: true }
      };
    },
    
    capturePayment: async (paymentIntentId) => {
      console.log(`Capturing mock payment: ${paymentIntentId}`);
      return {
        id: paymentIntentId,
        status: 'succeeded',
        amount: 100.00,
        currency: 'usd',
        paymentMethod: 'pm_mock',
        metadata: { mock: true }
      };
    },
    
    refundPayment: async (paymentId, amount, reason) => {
      console.log(`Refunding mock payment: ${paymentId}, amount: ${amount}, reason: ${reason}`);
      return {
        id: `mock_re_${Date.now()}`,
        paymentId: paymentId,
        amount: amount || 100.00,
        currency: 'usd',
        status: 'succeeded',
        reason: reason || 'requested_by_customer',
        metadata: { mock: true }
      };
    },
    
    getPaymentStatus: async (paymentId) => {
      console.log(`Getting mock payment status: ${paymentId}`);
      return {
        id: paymentId,
        status: 'succeeded',
        amount: 100.00,
        currency: 'usd',
        paymentMethod: 'pm_mock',
        metadata: { mock: true }
      };
    }
  };
};

module.exports = {
  getProvider,
  BasePaymentProvider,
  stripe
};