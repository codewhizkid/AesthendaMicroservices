/**
 * Test Webhook Controller
 * 
 * Provides endpoints for generating test webhook events during local development.
 * These endpoints make it easy to test webhook handling without actual payment provider events.
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const WebhookEvent = require('../models/WebhookEvent');
const { handleStripeWebhook, handleSquareWebhook, handlePayPalWebhook } = require('./webhookController');

/**
 * Generate a test Stripe webhook event
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generateStripeTestEvent = async (req, res) => {
  try {
    const { tenantId, eventType = 'payment_intent.succeeded', status = 'succeeded' } = req.body;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }
    
    // Create a mock Stripe event payload
    const eventId = `evt_test_${uuidv4().replace(/-/g, '')}`;
    const paymentIntentId = `pi_test_${uuidv4().replace(/-/g, '')}`;
    const chargeId = `ch_test_${uuidv4().replace(/-/g, '')}`;
    
    const payload = {
      id: eventId,
      object: 'event',
      api_version: '2020-08-27',
      created: Math.floor(Date.now() / 1000),
      type: eventType,
      data: {
        object: {
          id: paymentIntentId,
          object: 'payment_intent',
          amount: 1999,
          currency: 'usd',
          status,
          latest_charge: chargeId,
          created: Math.floor(Date.now() / 1000),
          metadata: {
            appointmentId: `appointment_test_${uuidv4()}`,
            customerId: `customer_test_${uuidv4()}`
          },
          charges: {
            data: [
              {
                id: chargeId,
                object: 'charge',
                amount: 1999,
                currency: 'usd',
                status,
                receipt_url: `https://example.com/receipts/${chargeId}`
              }
            ]
          }
        }
      }
    };
    
    // Generate a test signature
    const testSecret = 'whsec_test_secret';
    const testSignature = crypto
      .createHmac('sha256', testSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    // Create a mock request
    const mockReq = {
      body: payload,
      headers: {
        'stripe-signature': testSignature
      },
      params: {
        tenantId
      },
      ip: '127.0.0.1'
    };
    
    // Create a mock response
    const mockRes = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.data = data;
        return this;
      }
    };
    
    // Process the mock webhook
    await handleStripeWebhook(mockReq, mockRes);
    
    // Return success with the generated event
    res.status(200).json({
      message: 'Test Stripe webhook event generated successfully',
      event: {
        id: eventId,
        type: eventType,
        status: mockRes.statusCode === 200 ? 'processed' : 'failed',
        response: mockRes.data
      }
    });
  } catch (error) {
    console.error(`Error generating test Stripe webhook: ${error.message}`);
    res.status(500).json({ error: 'Failed to generate test webhook event' });
  }
};

/**
 * Generate a test Square webhook event
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generateSquareTestEvent = async (req, res) => {
  try {
    const { tenantId, eventType = 'payment.updated', status = 'COMPLETED' } = req.body;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }
    
    // Create a mock Square event payload
    const eventId = uuidv4();
    const paymentId = `sqp_${uuidv4().replace(/-/g, '')}`;
    const orderId = `sqo_${uuidv4().replace(/-/g, '')}`;
    
    const payload = {
      merchant_id: `sq_merchant_${uuidv4().replace(/-/g, '')}`,
      type: eventType,
      event_id: eventId,
      created_at: new Date().toISOString(),
      data: {
        type: 'payment',
        id: paymentId,
        object: {
          payment: {
            id: paymentId,
            order_id: orderId,
            amount_money: {
              amount: 1999,
              currency: 'USD'
            },
            status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }
    };
    
    // Generate a test signature
    const testSignatureKey = 'test_signature_key';
    const testSignature = crypto
      .createHmac('sha256', testSignatureKey)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    // Create a mock request
    const mockReq = {
      body: payload,
      headers: {
        'x-square-hmacsha256-signature': testSignature
      },
      params: {
        tenantId
      },
      ip: '127.0.0.1'
    };
    
    // Create a mock response
    const mockRes = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.data = data;
        return this;
      }
    };
    
    // Process the mock webhook
    await handleSquareWebhook(mockReq, mockRes);
    
    // Return success with the generated event
    res.status(200).json({
      message: 'Test Square webhook event generated successfully',
      event: {
        id: eventId,
        type: eventType,
        status: mockRes.statusCode === 200 ? 'processed' : 'failed',
        response: mockRes.data
      }
    });
  } catch (error) {
    console.error(`Error generating test Square webhook: ${error.message}`);
    res.status(500).json({ error: 'Failed to generate test webhook event' });
  }
};

/**
 * Generate a test PayPal webhook event
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generatePayPalTestEvent = async (req, res) => {
  try {
    const { tenantId, eventType = 'PAYMENT.CAPTURE.COMPLETED' } = req.body;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }
    
    // Create a mock PayPal event payload
    const eventId = uuidv4();
    const captureId = `2XX12345678901234`;
    
    const payload = {
      id: `WH-${uuidv4().replace(/-/g, '')}`,
      event_type: eventType,
      create_time: new Date().toISOString(),
      resource_type: 'capture',
      resource_version: '2.0',
      event_version: '1.0',
      summary: `Payment capture ${eventType.split('.').pop().toLowerCase()}`,
      resource: {
        id: captureId,
        status: 'COMPLETED',
        amount: {
          currency_code: 'USD',
          value: '19.99'
        },
        final_capture: true,
        disbursement_mode: 'INSTANT',
        seller_protection: {
          status: 'ELIGIBLE',
          dispute_categories: ['ITEM_NOT_RECEIVED', 'UNAUTHORIZED_TRANSACTION']
        },
        seller_receivable_breakdown: {
          gross_amount: {
            currency_code: 'USD',
            value: '19.99'
          },
          paypal_fee: {
            currency_code: 'USD',
            value: '0.88'
          },
          net_amount: {
            currency_code: 'USD',
            value: '19.11'
          }
        },
        custom_id: `test_appointment_${uuidv4()}`,
        update_time: new Date().toISOString(),
        create_time: new Date(Date.now() - 1000 * 60).toISOString(),
        links: [
          {
            href: `https://api.paypal.com/v2/payments/captures/${captureId}`,
            rel: 'self',
            method: 'GET'
          },
          {
            href: `https://api.paypal.com/v2/payments/captures/${captureId}/refund`,
            rel: 'refund',
            method: 'POST'
          }
        ]
      }
    };
    
    // Create mock PayPal headers
    const mockReq = {
      body: payload,
      headers: {
        'paypal-auth-algo': 'SHA256withRSA',
        'paypal-cert-url': 'https://api.paypal.com/v1/notifications/certs/CERT-123',
        'paypal-transmission-id': `${uuidv4()}`,
        'paypal-transmission-sig': 'test_signature',
        'paypal-transmission-time': new Date().toISOString()
      },
      params: {
        tenantId
      },
      ip: '127.0.0.1'
    };
    
    // Create a mock response
    const mockRes = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.data = data;
        return this;
      }
    };
    
    // Process the mock webhook
    await handlePayPalWebhook(mockReq, mockRes);
    
    // Return success with the generated event
    res.status(200).json({
      message: 'Test PayPal webhook event generated successfully',
      event: {
        id: payload.id,
        type: eventType,
        status: mockRes.statusCode === 200 ? 'processed' : 'failed',
        response: mockRes.data
      }
    });
  } catch (error) {
    console.error(`Error generating test PayPal webhook: ${error.message}`);
    res.status(500).json({ error: 'Failed to generate test webhook event' });
  }
};

/**
 * Get test webhook form data for the UI
 * Provides options for event types for each provider
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTestWebhookOptions = async (req, res) => {
  // Return options for test webhook generation
  res.json({
    providers: ['stripe', 'square', 'paypal'],
    eventTypes: {
      stripe: [
        { value: 'payment_intent.succeeded', label: 'Payment Succeeded' },
        { value: 'payment_intent.payment_failed', label: 'Payment Failed' },
        { value: 'charge.refunded', label: 'Charge Refunded' },
        { value: 'charge.dispute.created', label: 'Dispute Created' }
      ],
      square: [
        { value: 'payment.updated', label: 'Payment Updated' },
        { value: 'refund.updated', label: 'Refund Updated' },
        { value: 'dispute.created', label: 'Dispute Created' }
      ],
      paypal: [
        { value: 'PAYMENT.CAPTURE.COMPLETED', label: 'Payment Completed' },
        { value: 'PAYMENT.CAPTURE.DECLINED', label: 'Payment Declined' },
        { value: 'PAYMENT.CAPTURE.REFUNDED', label: 'Payment Refunded' },
        { value: 'CUSTOMER.DISPUTE.CREATED', label: 'Dispute Created' }
      ]
    },
    statuses: {
      stripe: [
        { value: 'succeeded', label: 'Succeeded' },
        { value: 'failed', label: 'Failed' }
      ],
      square: [
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'FAILED', label: 'Failed' }
      ]
    }
  });
};

module.exports = {
  generateStripeTestEvent,
  generateSquareTestEvent,
  generatePayPalTestEvent,
  getTestWebhookOptions
}; 