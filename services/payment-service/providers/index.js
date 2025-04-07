const StripeProvider = require('./stripe');
const SquareProvider = require('./square');
const PayPalProvider = require('./paypal');

/**
 * Payment provider factory
 */
class PaymentProviderFactory {
  static getProvider(providerName, config) {
    switch (providerName.toLowerCase()) {
      case 'stripe':
        return new StripeProvider(config);
      case 'square':
        return new SquareProvider(config);
      case 'paypal':
        return new PayPalProvider(config);
      default:
        throw new Error(`Unsupported payment provider: ${providerName}`);
    }
  }
}

/**
 * Base payment provider interface
 */
class BasePaymentProvider {
  constructor(config) {
    if (new.target === BasePaymentProvider) {
      throw new Error('Cannot instantiate abstract class');
    }
    this.config = config;
  }

  async initialize() {
    throw new Error('Method not implemented');
  }

  async createPaymentIntent(amount, currency, metadata) {
    throw new Error('Method not implemented');
  }

  async processPayment(paymentIntentId, paymentMethodId) {
    throw new Error('Method not implemented');
  }

  async refundPayment(paymentId, amount, reason) {
    throw new Error('Method not implemented');
  }

  async getPaymentStatus(paymentId) {
    throw new Error('Method not implemented');
  }
}

module.exports = {
  PaymentProviderFactory,
  BasePaymentProvider
};