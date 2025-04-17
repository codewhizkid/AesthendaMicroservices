/**
 * Base Payment Provider Class
 * Abstract class that defines the interface for all payment providers
 */
class BasePaymentProvider {
  /**
   * Initialize the payment provider
   * @param {Object} config - Provider configuration
   * @returns {Promise<void>}
   */
  async initialize(config) {
    throw new Error('Method not implemented: initialize');
  }

  /**
   * Test connection with provider APIs
   * @param {Object} credentials - Provider credentials to test
   * @returns {Promise<Object>} - Test result
   */
  async testConnection(credentials) {
    throw new Error('Method not implemented: testConnection');
  }

  /**
   * Create a payment intent
   * @param {number} amount - Payment amount
   * @param {string} currency - Currency code
   * @param {Object} metadata - Additional data to include
   * @returns {Promise<Object>} - Payment intent object
   */
  async createPaymentIntent(amount, currency, metadata) {
    throw new Error('Method not implemented: createPaymentIntent');
  }

  /**
   * Process a payment with payment method details
   * @param {string} paymentIntentId - Payment intent ID
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<Object>} - Payment result
   */
  async processPayment(paymentIntentId, paymentMethodId) {
    throw new Error('Method not implemented: processPayment');
  }

  /**
   * Capture an authorized payment
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} - Capture result
   */
  async capturePayment(paymentIntentId) {
    throw new Error('Method not implemented: capturePayment');
  }

  /**
   * Refund a payment
   * @param {string} paymentId - Payment ID to refund
   * @param {number} amount - Amount to refund (optional)
   * @param {string} reason - Reason for refund
   * @returns {Promise<Object>} - Refund result
   */
  async refundPayment(paymentId, amount, reason) {
    throw new Error('Method not implemented: refundPayment');
  }

  /**
   * Get payment status
   * @param {string} paymentId - Payment ID to check
   * @returns {Promise<Object>} - Payment status
   */
  async getPaymentStatus(paymentId) {
    throw new Error('Method not implemented: getPaymentStatus');
  }
}

module.exports = BasePaymentProvider; 