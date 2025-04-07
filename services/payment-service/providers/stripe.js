const { BasePaymentProvider } = require('./index');
const stripe = require('stripe');

class StripeProvider extends BasePaymentProvider {
  constructor(config) {
    super(config);
    this.client = null;
  }

  async initialize() {
    try {
      this.client = stripe(this.config.secretKey);
      await this.client.paymentMethods.list({ limit: 1 }); // Test the connection
      console.log('Stripe provider initialized');
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
      throw error;
    }
  }

  async createPaymentIntent(amount, currency, metadata = {}) {
    try {
      const paymentIntent = await this.client.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: {
          ...metadata,
          provider: 'stripe'
        },
        capture_method: 'manual', // Allow for authorization holds
        setup_future_usage: 'off_session', // Allow for future payments
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        }
      });

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      };
    } catch (error) {
      console.error('Failed to create Stripe payment intent:', error);
      throw error;
    }
  }

  async processPayment(paymentIntentId, paymentMethodId) {
    try {
      // Confirm the payment intent with the payment method
      const paymentIntent = await this.client.paymentIntents.confirm(
        paymentIntentId,
        {
          payment_method: paymentMethodId,
          return_url: this.config.returnUrl
        }
      );

      // If payment requires additional action
      if (paymentIntent.status === 'requires_action') {
        return {
          status: 'requires_action',
          nextAction: paymentIntent.next_action,
          clientSecret: paymentIntent.client_secret
        };
      }

      // If payment is successful, capture the payment
      if (paymentIntent.status === 'requires_capture') {
        const capturedPayment = await this.client.paymentIntents.capture(
          paymentIntentId
        );

        return {
          status: 'succeeded',
          id: capturedPayment.id,
          amount: capturedPayment.amount / 100,
          currency: capturedPayment.currency,
          paymentMethod: capturedPayment.payment_method
        };
      }

      return {
        status: paymentIntent.status,
        error: paymentIntent.last_payment_error
      };
    } catch (error) {
      console.error('Failed to process Stripe payment:', error);
      throw error;
    }
  }

  async refundPayment(paymentId, amount, reason) {
    try {
      const refund = await this.client.refunds.create({
        payment_intent: paymentId,
        amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents if partial refund
        reason: this._mapRefundReason(reason)
      });

      return {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
        reason: refund.reason
      };
    } catch (error) {
      console.error('Failed to process Stripe refund:', error);
      throw error;
    }
  }

  async getPaymentStatus(paymentId) {
    try {
      const paymentIntent = await this.client.paymentIntents.retrieve(paymentId);

      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method,
        metadata: paymentIntent.metadata
      };
    } catch (error) {
      console.error('Failed to get Stripe payment status:', error);
      throw error;
    }
  }

  // Helper method to map refund reasons to Stripe's accepted values
  _mapRefundReason(reason) {
    const reasonMap = {
      duplicate: 'duplicate',
      fraudulent: 'fraudulent',
      requested_by_customer: 'requested_by_customer',
      canceled_appointment: 'requested_by_customer',
      service_not_provided: 'requested_by_customer'
    };

    return reasonMap[reason] || 'other';
  }

  // Helper method to validate currency codes
  _validateCurrency(currency) {
    const supportedCurrencies = ['usd', 'eur', 'gbp', 'aud', 'cad'];
    const normalizedCurrency = currency.toLowerCase();

    if (!supportedCurrencies.includes(normalizedCurrency)) {
      throw new Error(`Unsupported currency: ${currency}`);
    }

    return normalizedCurrency;
  }
}

module.exports = StripeProvider;