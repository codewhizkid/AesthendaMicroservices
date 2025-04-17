const tenantPaymentService = require('./tenantPaymentService');
const { publishPaymentEvent, PaymentEventType } = require('../utils/rabbitmq');

/**
 * Service for processing payments using tenant-specific providers
 */
class PaymentService {
  /**
   * Process a payment using the tenant's configured payment provider
   * @param {string} tenantId - The tenant identifier
   * @param {Object} paymentData - The payment data
   * @returns {Promise<Object>} - Payment result
   */
  async processPayment(tenantId, paymentData) {
    try {
      // Get the provider for this tenant
      const provider = await tenantPaymentService.getProviderForTenant(tenantId);
      
      // Validate payment data
      this._validatePaymentData(paymentData);
      
      // Get tenant config for additional settings
      const config = await tenantPaymentService.getTenantConfig(tenantId);
      
      // Add service fee if configured
      const totalAmount = this._calculateTotalWithFees(
        paymentData.amount, 
        config.settings.serviceFee,
        config.settings.serviceFeeType
      );
      
      // Add taxes if configured
      const finalAmount = config.settings.applyTaxes ? 
        this._calculateTotalWithTax(totalAmount, config.settings.taxRate) : 
        totalAmount;
      
      // Create a payment intent
      const paymentIntent = await provider.createPaymentIntent(
        finalAmount,
        paymentData.currency || config.settings.currency,
        {
          appointmentId: paymentData.appointmentId,
          customerId: paymentData.customerId,
          tenantId: tenantId,
          description: paymentData.description || 'Appointment booking',
          metadata: paymentData.metadata || {}
        }
      );
      
      // Publish payment created event
      await publishPaymentEvent(PaymentEventType.CREATED, {
        tenantId,
        paymentId: paymentIntent.id,
        appointmentId: paymentData.appointmentId,
        customerId: paymentData.customerId,
        amount: finalAmount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      });
      
      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.clientSecret,
        amount: finalAmount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      };
    } catch (error) {
      console.error(`Error processing payment for tenant ${tenantId}:`, error);
      throw error;
    }
  }
  
  /**
   * Complete a payment with payment method details
   * @param {string} tenantId - The tenant identifier
   * @param {string} paymentIntentId - The payment intent ID
   * @param {string} paymentMethodId - The payment method ID
   * @returns {Promise<Object>} - Payment completion result
   */
  async completePayment(tenantId, paymentIntentId, paymentMethodId) {
    try {
      // Get the provider for this tenant
      const provider = await tenantPaymentService.getProviderForTenant(tenantId);
      
      // Process the payment
      const result = await provider.processPayment(paymentIntentId, paymentMethodId);
      
      // Get tenant config for auto-capture setting
      const config = await tenantPaymentService.getTenantConfig(tenantId);
      
      // Auto-capture if configured and payment is authorized
      if (config.settings.capturePaymentsAutomatically && 
          result.status === 'requires_capture') {
        const captureResult = await provider.capturePayment(paymentIntentId);
        
        // Publish payment completed event after successful capture
        if (captureResult.status === 'succeeded') {
          await publishPaymentEvent(PaymentEventType.COMPLETED, {
            tenantId,
            paymentId: captureResult.id,
            appointmentId: captureResult.metadata?.appointmentId,
            customerId: captureResult.metadata?.customerId,
            amount: captureResult.amount,
            currency: captureResult.currency,
            status: captureResult.status,
            paymentMethod: captureResult.paymentMethod
          });
        } else if (captureResult.status === 'failed') {
          // Publish payment failed event
          await publishPaymentEvent(PaymentEventType.FAILED, {
            tenantId,
            paymentId: captureResult.id,
            appointmentId: captureResult.metadata?.appointmentId,
            customerId: captureResult.metadata?.customerId,
            amount: captureResult.amount,
            currency: captureResult.currency,
            status: captureResult.status,
            error: captureResult.error || 'Payment capture failed'
          });
        }
        
        return captureResult;
      }
      
      // If payment is successful without capture
      if (result.status === 'succeeded') {
        await publishPaymentEvent(PaymentEventType.COMPLETED, {
          tenantId,
          paymentId: result.id,
          appointmentId: result.metadata?.appointmentId,
          customerId: result.metadata?.customerId,
          amount: result.amount,
          currency: result.currency,
          status: result.status,
          paymentMethod: result.paymentMethod
        });
      } else if (result.status === 'failed') {
        // Publish payment failed event
        await publishPaymentEvent(PaymentEventType.FAILED, {
          tenantId,
          paymentId: result.id,
          appointmentId: result.metadata?.appointmentId,
          customerId: result.metadata?.customerId,
          amount: result.amount,
          currency: result.currency,
          status: result.status,
          error: result.error || 'Payment processing failed'
        });
      }
      
      return result;
    } catch (error) {
      console.error(`Error completing payment for tenant ${tenantId}:`, error);
      
      // Try to publish payment failed event
      try {
        await publishPaymentEvent(PaymentEventType.FAILED, {
          tenantId,
          paymentId: paymentIntentId,
          error: error.message || 'Payment completion failed'
        });
      } catch (eventError) {
        console.error('Failed to publish payment failure event:', eventError);
      }
      
      throw error;
    }
  }
  
  /**
   * Refund a payment
   * @param {string} tenantId - The tenant identifier
   * @param {string} paymentId - The payment ID to refund
   * @param {number} amount - The amount to refund (optional, for partial refunds)
   * @param {string} reason - The reason for the refund
   * @returns {Promise<Object>} - Refund result
   */
  async refundPayment(tenantId, paymentId, amount, reason) {
    try {
      // Get the provider for this tenant
      const provider = await tenantPaymentService.getProviderForTenant(tenantId);
      
      // Process the refund
      const refundResult = await provider.refundPayment(paymentId, amount, reason);
      
      // Publish refund event
      await publishPaymentEvent(PaymentEventType.REFUNDED, {
        tenantId,
        paymentId,
        refundId: refundResult.id,
        appointmentId: refundResult.metadata?.appointmentId,
        customerId: refundResult.metadata?.customerId,
        amount: refundResult.amount,
        currency: refundResult.currency,
        reason,
        status: refundResult.status
      });
      
      return refundResult;
    } catch (error) {
      console.error(`Error refunding payment for tenant ${tenantId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get payment status
   * @param {string} tenantId - The tenant identifier
   * @param {string} paymentId - The payment ID to check
   * @returns {Promise<Object>} - Payment status
   */
  async getPaymentStatus(tenantId, paymentId) {
    try {
      // Get the provider for this tenant
      const provider = await tenantPaymentService.getProviderForTenant(tenantId);
      
      // Get the payment status
      return await provider.getPaymentStatus(paymentId);
    } catch (error) {
      console.error(`Error getting payment status for tenant ${tenantId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get client configuration for payment provider
   * @param {string} tenantId - The tenant identifier
   * @returns {Promise<Object>} - Client configuration
   */
  async getClientConfig(tenantId) {
    try {
      // Get tenant config
      const config = await tenantPaymentService.getTenantConfig(tenantId);
      
      if (!config.isEnabled) {
        throw new Error('Payment processing is disabled for this tenant');
      }
      
      const provider = config.activeProvider;
      
      // Only return public keys and necessary config for client
      let clientConfig = {
        provider,
        environment: config.environment,
        currency: config.settings.currency
      };
      
      // Add provider-specific client configuration
      switch (provider) {
        case 'stripe':
          clientConfig.publicKey = config.stripe.publicKey;
          break;
          
        case 'square':
          clientConfig.applicationId = config.square.applicationId;
          clientConfig.locationId = config.square.locationId;
          break;
          
        case 'paypal':
          clientConfig.clientId = config.paypal.clientId;
          clientConfig.merchantId = config.paypal.merchantId;
          break;
          
        case 'mock':
          clientConfig.mockMode = true;
          break;
      }
      
      return clientConfig;
    } catch (error) {
      console.error(`Error getting client config for tenant ${tenantId}:`, error);
      throw error;
    }
  }
  
  /**
   * Validate payment data for required fields
   * @param {Object} paymentData - The payment data to validate
   * @private
   */
  _validatePaymentData(paymentData) {
    if (!paymentData) {
      throw new Error('Payment data is required');
    }
    
    if (!paymentData.amount || isNaN(parseFloat(paymentData.amount)) || parseFloat(paymentData.amount) <= 0) {
      throw new Error('Valid payment amount is required');
    }
    
    if (!paymentData.appointmentId) {
      throw new Error('Appointment ID is required');
    }
    
    if (!paymentData.customerId) {
      throw new Error('Customer ID is required');
    }
  }
  
  /**
   * Calculate total amount with service fee
   * @param {number} amount - The base amount
   * @param {number} serviceFee - The service fee amount or percentage
   * @param {string} feeType - The fee type (percentage or flat)
   * @returns {number} - Total amount with fee
   * @private
   */
  _calculateTotalWithFees(amount, serviceFee, feeType) {
    const baseAmount = parseFloat(amount);
    
    if (serviceFee <= 0) {
      return baseAmount;
    }
    
    if (feeType === 'percentage') {
      return baseAmount + (baseAmount * (serviceFee / 100));
    } else {
      return baseAmount + serviceFee;
    }
  }
  
  /**
   * Calculate total amount with tax
   * @param {number} amount - The base amount
   * @param {number} taxRate - The tax rate percentage
   * @returns {number} - Total amount with tax
   * @private
   */
  _calculateTotalWithTax(amount, taxRate) {
    const baseAmount = parseFloat(amount);
    
    if (taxRate <= 0) {
      return baseAmount;
    }
    
    return baseAmount + (baseAmount * (taxRate / 100));
  }
}

module.exports = new PaymentService(); 