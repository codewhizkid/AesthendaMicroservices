/**
 * Webhook Controller
 * 
 * Handles incoming webhooks from payment providers (Stripe, Square, PayPal)
 * This controller includes:
 * - Signature validation
 * - Event type processing
 * - Notification of relevant services via RabbitMQ
 * - Logging webhook events for monitoring and debugging
 */

const crypto = require('crypto');
const { publishPaymentEvent, PaymentEventType } = require('../utils/rabbitmq');
const TenantPaymentConfig = require('../models/TenantPaymentConfig');
const Payment = require('../models/Payment');
const WebhookEvent = require('../models/WebhookEvent');
const paymentService = require('../services/paymentService');

/**
 * Process webhook events from Stripe
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const payload = req.body;
  const tenantId = req.params.tenantId;
  let webhookEvent;

  try {
    // Log the received webhook
    webhookEvent = new WebhookEvent({
      tenantId,
      provider: 'stripe',
      eventType: payload.type || 'unknown',
      eventId: payload.id || `stripe-${Date.now()}`,
      status: 'received',
      ipAddress: req.ip,
      headers: {
        'stripe-signature': sig
      },
      payload
    });
    await webhookEvent.save();

    // Check signature
    if (!sig) {
      webhookEvent.status = 'failed';
      webhookEvent.processingError = 'Stripe signature missing';
      await webhookEvent.save();
      
      console.error('Stripe webhook signature missing');
      return res.status(400).json({ error: 'Stripe signature missing' });
    }

    // Get tenant's Stripe webhook secret
    const tenantConfig = await TenantPaymentConfig.findOne({ tenantId });
    if (!tenantConfig || !tenantConfig.stripe || !tenantConfig.stripe.webhookSecretKey) {
      webhookEvent.status = 'failed';
      webhookEvent.processingError = `Missing Stripe webhook secret for tenant ${tenantId}`;
      await webhookEvent.save();
      
      console.error(`Missing Stripe webhook secret for tenant ${tenantId}`);
      return res.status(400).json({ error: 'Webhook secret not configured' });
    }

    // Verify signature
    try {
      const stripeWebhookSecret = tenantConfig.stripe.webhookSecretKey;
      const event = await verifyStripeSignature(payload, sig, stripeWebhookSecret);
      
      // Process the event
      await processStripeEvent(tenantId, event, webhookEvent);
      
      // Mark webhook as processed
      webhookEvent.status = 'processed';
      webhookEvent.processedAt = new Date();
      await webhookEvent.save();
      
      // Acknowledge receipt of the event
      res.status(200).json({ received: true });
    } catch (error) {
      webhookEvent.status = 'invalid_signature';
      webhookEvent.processingError = error.message;
      await webhookEvent.save();
      
      console.error(`Invalid Stripe signature: ${error.message}`);
      res.status(401).json({ error: 'Invalid signature' });
    }
  } catch (error) {
    // If we already created a webhook event, update it
    if (webhookEvent) {
      webhookEvent.status = 'failed';
      webhookEvent.processingError = error.message;
      await webhookEvent.save();
    }
    
    console.error(`Error handling Stripe webhook: ${error.message}`);
    res.status(400).json({ error: 'Webhook processing error' });
  }
};

/**
 * Process webhook events from Square
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleSquareWebhook = async (req, res) => {
  const signature = req.headers['x-square-hmacsha256-signature'];
  const payload = req.body;
  const tenantId = req.params.tenantId;
  let webhookEvent;

  try {
    // Log the received webhook
    webhookEvent = new WebhookEvent({
      tenantId,
      provider: 'square',
      eventType: payload.type || 'unknown',
      eventId: payload.event_id || `square-${Date.now()}`,
      status: 'received',
      ipAddress: req.ip,
      headers: {
        'x-square-hmacsha256-signature': signature
      },
      payload
    });
    await webhookEvent.save();

    // Check signature
    if (!signature) {
      webhookEvent.status = 'failed';
      webhookEvent.processingError = 'Square webhook signature missing';
      await webhookEvent.save();
      
      console.error('Square webhook signature missing');
      return res.status(400).json({ error: 'Square signature missing' });
    }

    // Get tenant's Square webhook signature key
    const tenantConfig = await TenantPaymentConfig.findOne({ tenantId });
    if (!tenantConfig || !tenantConfig.square || !tenantConfig.square.webhookSignatureKey) {
      webhookEvent.status = 'failed';
      webhookEvent.processingError = `Missing Square webhook signature key for tenant ${tenantId}`;
      await webhookEvent.save();
      
      console.error(`Missing Square webhook signature key for tenant ${tenantId}`);
      return res.status(400).json({ error: 'Webhook secret not configured' });
    }

    // Verify signature
    const squareSignatureKey = tenantConfig.square.webhookSignatureKey;
    const isValid = verifySquareSignature(payload, signature, squareSignatureKey);
    
    if (!isValid) {
      webhookEvent.status = 'invalid_signature';
      webhookEvent.processingError = `Invalid Square webhook signature for tenant ${tenantId}`;
      await webhookEvent.save();
      
      console.error(`Invalid Square webhook signature for tenant ${tenantId}`);
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process the event
    await processSquareEvent(tenantId, payload, webhookEvent);
    
    // Mark webhook as processed
    webhookEvent.status = 'processed';
    webhookEvent.processedAt = new Date();
    await webhookEvent.save();
    
    // Acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (error) {
    // If we already created a webhook event, update it
    if (webhookEvent) {
      webhookEvent.status = 'failed';
      webhookEvent.processingError = error.message;
      await webhookEvent.save();
    }
    
    console.error(`Error handling Square webhook: ${error.message}`);
    res.status(400).json({ error: 'Webhook processing error' });
  }
};

/**
 * Process webhook events from PayPal
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handlePayPalWebhook = async (req, res) => {
  const auth = req.headers['paypal-auth-algo'];
  const certId = req.headers['paypal-cert-url'];
  const transmission = req.headers['paypal-transmission-id'];
  const transmissionSig = req.headers['paypal-transmission-sig'];
  const transmissionTime = req.headers['paypal-transmission-time'];
  const payload = req.body;
  const tenantId = req.params.tenantId;
  let webhookEvent;

  try {
    // Log the received webhook
    webhookEvent = new WebhookEvent({
      tenantId,
      provider: 'paypal',
      eventType: payload.event_type || 'unknown',
      eventId: payload.id || `paypal-${Date.now()}`,
      status: 'received',
      ipAddress: req.ip,
      headers: {
        'paypal-auth-algo': auth,
        'paypal-cert-url': certId,
        'paypal-transmission-id': transmission,
        'paypal-transmission-sig': transmissionSig,
        'paypal-transmission-time': transmissionTime
      },
      payload
    });
    await webhookEvent.save();

    // Check headers
    if (!auth || !certId || !transmission || !transmissionSig || !transmissionTime) {
      webhookEvent.status = 'failed';
      webhookEvent.processingError = 'PayPal webhook headers missing';
      await webhookEvent.save();
      
      console.error('PayPal webhook headers missing');
      return res.status(400).json({ error: 'PayPal webhook headers missing' });
    }

    // Get tenant's PayPal credentials
    const tenantConfig = await TenantPaymentConfig.findOne({ tenantId });
    if (!tenantConfig || !tenantConfig.paypal || !tenantConfig.paypal.clientId) {
      webhookEvent.status = 'failed';
      webhookEvent.processingError = `Missing PayPal configuration for tenant ${tenantId}`;
      await webhookEvent.save();
      
      console.error(`Missing PayPal configuration for tenant ${tenantId}`);
      return res.status(400).json({ error: 'PayPal configuration not found' });
    }

    // In a real implementation, we would verify the PayPal webhook signature
    // This is a simplified version
    console.log(`Processing PayPal webhook for tenant ${tenantId}`);
    
    // Process the event
    await processPayPalEvent(tenantId, payload, webhookEvent);
    
    // Mark webhook as processed
    webhookEvent.status = 'processed';
    webhookEvent.processedAt = new Date();
    await webhookEvent.save();
    
    // Acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (error) {
    // If we already created a webhook event, update it
    if (webhookEvent) {
      webhookEvent.status = 'failed';
      webhookEvent.processingError = error.message;
      await webhookEvent.save();
    }
    
    console.error(`Error handling PayPal webhook: ${error.message}`);
    res.status(400).json({ error: 'Webhook processing error' });
  }
};

/**
 * Verify Stripe webhook signature
 * @param {Object} payload - Webhook payload
 * @param {string} signature - Signature from webhook header
 * @param {string} secret - Webhook secret
 * @returns {Object} - Verified event
 */
const verifyStripeSignature = (payload, signature, secret) => {
  // In a real implementation, we would use the Stripe SDK
  // For simplicity, we're creating a basic version here
  
  const header = Buffer.from(signature, 'utf8').toString();
  const payloadString = JSON.stringify(payload);
  
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payloadString).digest('hex');
  
  if (digest !== header) {
    throw new Error('Invalid Stripe signature');
  }
  
  return payload;
};

/**
 * Verify Square webhook signature
 * @param {Object} payload - Webhook payload
 * @param {string} signature - Signature from webhook header
 * @param {string} signatureKey - Square signature key
 * @returns {boolean} - Whether signature is valid
 */
const verifySquareSignature = (payload, signature, signatureKey) => {
  try {
    const payloadString = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', signatureKey);
    const digest = hmac.update(payloadString).digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('Error verifying Square signature:', error);
    return false;
  }
};

/**
 * Process Stripe events
 * @param {string} tenantId - Tenant ID
 * @param {Object} event - Stripe event
 * @param {Object} webhookEvent - WebhookEvent document for logging
 */
const processStripeEvent = async (tenantId, event, webhookEvent) => {
  console.log(`Processing Stripe event: ${event.type} for tenant ${tenantId}`);
  
  // Update additional webhook event data
  if (webhookEvent) {
    webhookEvent.eventType = event.type;
    
    // Extract related IDs if available in the event
    if (event.data?.object?.metadata?.appointmentId) {
      webhookEvent.appointmentId = event.data.object.metadata.appointmentId;
    }
    if (event.data?.object?.metadata?.customerId) {
      webhookEvent.customerId = event.data.object.metadata.customerId;
    }
    
    await webhookEvent.save();
  }
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handleStripePaymentSuccess(tenantId, event.data.object, webhookEvent);
      break;
      
    case 'payment_intent.payment_failed':
      await handleStripePaymentFailure(tenantId, event.data.object, webhookEvent);
      break;
      
    case 'charge.refunded':
      await handleStripeRefund(tenantId, event.data.object, webhookEvent);
      break;
      
    case 'charge.dispute.created':
      await handleStripeDispute(tenantId, event.data.object, webhookEvent);
      break;
      
    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }
};

/**
 * Process Square events
 * @param {string} tenantId - Tenant ID
 * @param {Object} payload - Square webhook payload
 * @param {Object} webhookEvent - WebhookEvent document for logging
 */
const processSquareEvent = async (tenantId, payload, webhookEvent) => {
  console.log(`Processing Square event for tenant ${tenantId}`);
  
  const { type, data } = payload;
  
  // Update additional webhook event data
  if (webhookEvent) {
    // Extract related IDs if available in the payload
    if (data?.object?.payment?.order_id) {
      webhookEvent.metadata.orderId = data.object.payment.order_id;
    }
    
    await webhookEvent.save();
  }
  
  switch (type) {
    case 'payment.updated':
      await handleSquarePaymentUpdate(tenantId, data.object.payment, webhookEvent);
      break;
      
    case 'refund.updated':
      await handleSquareRefundUpdate(tenantId, data.object.refund, webhookEvent);
      break;
      
    case 'dispute.created':
      await handleSquareDispute(tenantId, data.object.dispute, webhookEvent);
      break;
      
    default:
      console.log(`Unhandled Square event type: ${type}`);
  }
};

/**
 * Process PayPal events
 * @param {string} tenantId - Tenant ID
 * @param {Object} payload - PayPal webhook payload
 * @param {Object} webhookEvent - WebhookEvent document for logging
 */
const processPayPalEvent = async (tenantId, payload, webhookEvent) => {
  console.log(`Processing PayPal event for tenant ${tenantId}`);
  
  const { event_type, resource } = payload;
  
  // Update additional webhook event data
  if (webhookEvent) {
    // Extract related IDs if available in the payload
    if (resource?.custom_id) {
      webhookEvent.metadata.customId = resource.custom_id;
    }
    
    await webhookEvent.save();
  }
  
  switch (event_type) {
    case 'PAYMENT.CAPTURE.COMPLETED':
      await handlePayPalPaymentSuccess(tenantId, resource, webhookEvent);
      break;
      
    case 'PAYMENT.CAPTURE.DECLINED':
      await handlePayPalPaymentFailure(tenantId, resource, webhookEvent);
      break;
      
    case 'PAYMENT.CAPTURE.REFUNDED':
      await handlePayPalRefund(tenantId, resource, webhookEvent);
      break;
      
    case 'CUSTOMER.DISPUTE.CREATED':
      await handlePayPalDispute(tenantId, resource, webhookEvent);
      break;
      
    default:
      console.log(`Unhandled PayPal event type: ${event_type}`);
  }
};

/**
 * Handle successful Stripe payment
 * @param {string} tenantId - Tenant ID
 * @param {Object} paymentIntent - Stripe payment intent object
 * @param {Object} webhookEvent - WebhookEvent document for logging
 */
const handleStripePaymentSuccess = async (tenantId, paymentIntent, webhookEvent) => {
  try {
    // Find the payment in our database
    const payment = await Payment.findOne({ 
      tenantId,
      'providerData.paymentIntentId': paymentIntent.id
    });
    
    if (!payment) {
      console.log(`Payment not found for Stripe payment intent ${paymentIntent.id}`);
      
      if (webhookEvent) {
        webhookEvent.processingError = `Payment not found for Stripe payment intent ${paymentIntent.id}`;
        await webhookEvent.save();
      }
      
      return;
    }

    // Update webhookEvent with payment info
    if (webhookEvent) {
      webhookEvent.paymentId = payment._id.toString();
      webhookEvent.appointmentId = payment.appointmentId;
      webhookEvent.customerId = payment.customerId;
      await webhookEvent.save();
    }
    
    // Update payment status
    payment.status = 'completed';
    payment.updatedAt = new Date();
    payment.providerData = {
      ...payment.providerData,
      chargeId: paymentIntent.latest_charge,
      paymentMethod: paymentIntent.payment_method,
      receiptUrl: paymentIntent.charges?.data[0]?.receipt_url
    };
    
    await payment.save();
    
    // Publish payment event
    await publishPaymentEvent(PaymentEventType.COMPLETED, {
      tenantId,
      paymentId: payment._id.toString(),
      appointmentId: payment.appointmentId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status
    });
    
    console.log(`Updated payment ${payment._id} status to completed`);
  } catch (error) {
    console.error(`Error handling Stripe payment success: ${error.message}`);
    
    if (webhookEvent) {
      webhookEvent.processingError = `Error handling Stripe payment success: ${error.message}`;
      await webhookEvent.save();
    }
  }
};

/**
 * Handle failed Stripe payment
 * @param {string} tenantId - Tenant ID
 * @param {Object} paymentIntent - Stripe payment intent object
 * @param {Object} webhookEvent - WebhookEvent document for logging
 */
const handleStripePaymentFailure = async (tenantId, paymentIntent, webhookEvent) => {
  try {
    // Find the payment in our database
    const payment = await Payment.findOne({ 
      tenantId,
      'providerData.paymentIntentId': paymentIntent.id
    });
    
    if (!payment) {
      console.log(`Payment not found for Stripe payment intent ${paymentIntent.id}`);
      
      if (webhookEvent) {
        webhookEvent.processingError = `Payment not found for Stripe payment intent ${paymentIntent.id}`;
        await webhookEvent.save();
      }
      
      return;
    }

    // Update webhookEvent with payment info
    if (webhookEvent) {
      webhookEvent.paymentId = payment._id.toString();
      webhookEvent.appointmentId = payment.appointmentId;
      webhookEvent.customerId = payment.customerId;
      await webhookEvent.save();
    }
    
    // Update payment status
    payment.status = 'failed';
    payment.updatedAt = new Date();
    payment.error = paymentIntent.last_payment_error?.message || 'Payment failed';
    
    await payment.save();
    
    // Publish payment event
    await publishPaymentEvent(PaymentEventType.FAILED, {
      tenantId,
      paymentId: payment._id.toString(),
      appointmentId: payment.appointmentId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      error: payment.error
    });
    
    console.log(`Updated payment ${payment._id} status to failed`);
  } catch (error) {
    console.error(`Error handling Stripe payment failure: ${error.message}`);
    
    if (webhookEvent) {
      webhookEvent.processingError = `Error handling Stripe payment failure: ${error.message}`;
      await webhookEvent.save();
    }
  }
};

/**
 * Handle Stripe refund
 * @param {string} tenantId - Tenant ID
 * @param {Object} charge - Stripe charge object
 * @param {Object} webhookEvent - WebhookEvent document for logging
 */
const handleStripeRefund = async (tenantId, charge, webhookEvent) => {
  try {
    // Find the payment in our database
    const payment = await Payment.findOne({ 
      tenantId,
      'providerData.chargeId': charge.id
    });
    
    if (!payment) {
      console.log(`Payment not found for Stripe charge ${charge.id}`);
      
      if (webhookEvent) {
        webhookEvent.processingError = `Payment not found for Stripe charge ${charge.id}`;
        await webhookEvent.save();
      }
      
      return;
    }

    // Update webhookEvent with payment info
    if (webhookEvent) {
      webhookEvent.paymentId = payment._id.toString();
      webhookEvent.appointmentId = payment.appointmentId;
      webhookEvent.refundAmount = charge.amount_refunded / 100; // Convert cents to dollars
      webhookEvent.refundId = charge.refunds.data[0]?.id;
      await webhookEvent.save();
    }
    
    // Update payment status
    payment.status = 'refunded';
    payment.updatedAt = new Date();
    payment.refundedAt = new Date();
    payment.refundAmount = charge.amount_refunded / 100; // Convert cents to dollars
    payment.refundId = charge.refunds.data[0]?.id;
    
    await payment.save();
    
    // Publish payment event
    await publishPaymentEvent(PaymentEventType.REFUNDED, {
      tenantId,
      paymentId: payment._id.toString(),
      appointmentId: payment.appointmentId,
      amount: payment.amount,
      refundAmount: payment.refundAmount,
      currency: payment.currency,
      status: payment.status,
      refundId: payment.refundId
    });
    
    console.log(`Updated payment ${payment._id} status to refunded`);
  } catch (error) {
    console.error(`Error handling Stripe refund: ${error.message}`);
    
    if (webhookEvent) {
      webhookEvent.processingError = `Error handling Stripe refund: ${error.message}`;
      await webhookEvent.save();
    }
  }
};

/**
 * Handle Stripe dispute
 * @param {string} tenantId - Tenant ID
 * @param {Object} dispute - Stripe dispute object
 * @param {Object} webhookEvent - WebhookEvent document for logging
 */
const handleStripeDispute = async (tenantId, dispute, webhookEvent) => {
  try {
    // Find the payment in our database
    const payment = await Payment.findOne({ 
      tenantId,
      'providerData.chargeId': dispute.charge
    });
    
    if (!payment) {
      console.log(`Payment not found for Stripe dispute on charge ${dispute.charge}`);
      
      if (webhookEvent) {
        webhookEvent.processingError = `Payment not found for Stripe dispute on charge ${dispute.charge}`;
        await webhookEvent.save();
      }
      
      return;
    }

    // Update webhookEvent with dispute info
    if (webhookEvent) {
      webhookEvent.paymentId = payment._id.toString();
      webhookEvent.appointmentId = payment.appointmentId;
      webhookEvent.disputeId = dispute.id;
      webhookEvent.disputeStatus = dispute.status;
      webhookEvent.disputeReason = dispute.reason;
      webhookEvent.disputeAmount = dispute.amount / 100; // Convert cents to dollars
      webhookEvent.disputeCreatedAt = new Date(dispute.created * 1000); // Convert Unix timestamp to Date
      await webhookEvent.save();
    }
    
    // Update payment with dispute information
    payment.disputeId = dispute.id;
    payment.disputeStatus = dispute.status;
    payment.disputeReason = dispute.reason;
    payment.disputeAmount = dispute.amount / 100; // Convert cents to dollars
    payment.disputeCreatedAt = new Date(dispute.created * 1000); // Convert Unix timestamp to Date
    
    await payment.save();
    
    console.log(`Updated payment ${payment._id} with dispute information`);
  } catch (error) {
    console.error(`Error handling Stripe dispute: ${error.message}`);
    
    if (webhookEvent) {
      webhookEvent.processingError = `Error handling Stripe dispute: ${error.message}`;
      await webhookEvent.save();
    }
  }
};

/**
 * Handle Square payment update
 * @param {string} tenantId - Tenant ID
 * @param {Object} squarePayment - Square payment object
 * @param {Object} webhookEvent - WebhookEvent document for logging
 */
const handleSquarePaymentUpdate = async (tenantId, squarePayment, webhookEvent) => {
  try {
    // Find the payment in our database
    const payment = await Payment.findOne({ 
      tenantId,
      'providerData.paymentId': squarePayment.id
    });
    
    if (!payment) {
      console.log(`Payment not found for Square payment ${squarePayment.id}`);
      
      if (webhookEvent) {
        webhookEvent.processingError = `Payment not found for Square payment ${squarePayment.id}`;
        await webhookEvent.save();
      }
      
      return;
    }

    // Update webhookEvent with payment info
    if (webhookEvent) {
      webhookEvent.paymentId = payment._id.toString();
      webhookEvent.appointmentId = payment.appointmentId;
      webhookEvent.customerId = payment.customerId;
      await webhookEvent.save();
    }
    
    // Process based on status
    if (squarePayment.status === 'COMPLETED') {
      // Update payment status
      payment.status = 'completed';
      payment.updatedAt = new Date();
      payment.providerData = {
        ...payment.providerData,
        receiptUrl: squarePayment.receipt_url
      };
      
      await payment.save();
      
      // Publish payment event
      await publishPaymentEvent(PaymentEventType.COMPLETED, {
        tenantId,
        paymentId: payment._id.toString(),
        appointmentId: payment.appointmentId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status
      });
      
      console.log(`Updated payment ${payment._id} status to completed`);
    } else if (squarePayment.status === 'FAILED') {
      // Update payment status
      payment.status = 'failed';
      payment.updatedAt = new Date();
      payment.error = squarePayment.failure_reason || 'Payment failed';
      
      await payment.save();
      
      // Publish payment event
      await publishPaymentEvent(PaymentEventType.FAILED, {
        tenantId,
        paymentId: payment._id.toString(),
        appointmentId: payment.appointmentId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        error: payment.error
      });
      
      console.log(`Updated payment ${payment._id} status to failed`);
    }
  } catch (error) {
    console.error(`Error handling Square payment update: ${error.message}`);
    
    if (webhookEvent) {
      webhookEvent.processingError = `Error handling Square payment update: ${error.message}`;
      await webhookEvent.save();
    }
  }
};

/**
 * Handle Square refund update
 * @param {string} tenantId - Tenant ID
 * @param {Object} squareRefund - Square refund object
 * @param {Object} webhookEvent - WebhookEvent document for logging
 */
const handleSquareRefundUpdate = async (tenantId, squareRefund, webhookEvent) => {
  try {
    // Find the payment in our database
    const payment = await Payment.findOne({ 
      tenantId,
      'providerData.paymentId': squareRefund.payment_id
    });
    
    if (!payment) {
      console.log(`Payment not found for Square refund ${squareRefund.id}`);
      
      if (webhookEvent) {
        webhookEvent.processingError = `Payment not found for Square refund ${squareRefund.id}`;
        await webhookEvent.save();
      }
      
      return;
    }

    // Update webhookEvent with payment info
    if (webhookEvent) {
      webhookEvent.paymentId = payment._id.toString();
      webhookEvent.appointmentId = payment.appointmentId;
      webhookEvent.refundAmount = squareRefund.amount_money.amount / 100; // Convert cents to dollars
      webhookEvent.refundId = squareRefund.id;
      await webhookEvent.save();
    }
    
    if (squareRefund.status === 'COMPLETED') {
      // Update payment status
      payment.status = 'refunded';
      payment.updatedAt = new Date();
      payment.refundedAt = new Date();
      payment.refundAmount = squareRefund.amount_money.amount / 100; // Convert cents to dollars
      payment.refundId = squareRefund.id;
      
      await payment.save();
      
      // Publish payment event
      await publishPaymentEvent(PaymentEventType.REFUNDED, {
        tenantId,
        paymentId: payment._id.toString(),
        appointmentId: payment.appointmentId,
        amount: payment.amount,
        refundAmount: payment.refundAmount,
        currency: payment.currency,
        status: payment.status,
        refundId: payment.refundId
      });
      
      console.log(`Updated payment ${payment._id} status to refunded`);
    }
  } catch (error) {
    console.error(`Error handling Square refund update: ${error.message}`);
    
    if (webhookEvent) {
      webhookEvent.processingError = `Error handling Square refund update: ${error.message}`;
      await webhookEvent.save();
    }
  }
};

/**
 * Handle Square dispute
 * @param {string} tenantId - Tenant ID
 * @param {Object} squareDispute - Square dispute object
 * @param {Object} webhookEvent - WebhookEvent document for logging
 */
const handleSquareDispute = async (tenantId, squareDispute, webhookEvent) => {
  try {
    // Find the payment in our database by the disputed payment ID
    const payment = await Payment.findOne({ 
      tenantId,
      'providerData.paymentId': squareDispute.payment_id
    });
    
    if (!payment) {
      console.log(`Payment not found for Square dispute ${squareDispute.id}`);
      
      if (webhookEvent) {
        webhookEvent.processingError = `Payment not found for Square dispute ${squareDispute.id}`;
        await webhookEvent.save();
      }
      
      return;
    }

    // Update webhookEvent with dispute info
    if (webhookEvent) {
      webhookEvent.paymentId = payment._id.toString();
      webhookEvent.appointmentId = payment.appointmentId;
      webhookEvent.disputeId = squareDispute.id;
      webhookEvent.disputeStatus = squareDispute.state;
      webhookEvent.disputeReason = squareDispute.reason;
      webhookEvent.disputeAmount = squareDispute.amount_money.amount / 100; // Convert cents to dollars
      webhookEvent.disputeCreatedAt = new Date(squareDispute.reported_date);
      await webhookEvent.save();
    }
    
    // Update payment with dispute information
    payment.disputeId = squareDispute.id;
    payment.disputeStatus = squareDispute.state;
    payment.disputeReason = squareDispute.reason;
    payment.disputeAmount = squareDispute.amount_money.amount / 100; // Convert cents to dollars
    payment.disputeCreatedAt = new Date(squareDispute.reported_date);
    
    await payment.save();
    
    console.log(`Updated payment ${payment._id} with dispute information`);
  } catch (error) {
    console.error(`Error handling Square dispute: ${error.message}`);
    
    if (webhookEvent) {
      webhookEvent.processingError = `Error handling Square dispute: ${error.message}`;
      await webhookEvent.save();
    }
  }
};

/**
 * Handle PayPal payment success
 * @param {string} tenantId - Tenant ID
 * @param {Object} captureResource - PayPal capture resource
 * @param {Object} webhookEvent - WebhookEvent document for logging
 */
const handlePayPalPaymentSuccess = async (tenantId, captureResource, webhookEvent) => {
  try {
    // Find the payment in our database
    const payment = await Payment.findOne({ 
      tenantId,
      'providerData.captureId': captureResource.id
    });
    
    if (!payment) {
      console.log(`Payment not found for PayPal capture ${captureResource.id}`);
      
      if (webhookEvent) {
        webhookEvent.processingError = `Payment not found for PayPal capture ${captureResource.id}`;
        await webhookEvent.save();
      }
      
      return;
    }

    // Update webhookEvent with payment info
    if (webhookEvent) {
      webhookEvent.paymentId = payment._id.toString();
      webhookEvent.appointmentId = payment.appointmentId;
      webhookEvent.customerId = payment.customerId;
      await webhookEvent.save();
    }
    
    // Update payment status
    payment.status = 'completed';
    payment.updatedAt = new Date();
    payment.providerData = {
      ...payment.providerData,
      transactionId: captureResource.supplementary_data?.related_ids?.order_id
    };
    
    await payment.save();
    
    // Publish payment event
    await publishPaymentEvent(PaymentEventType.COMPLETED, {
      tenantId,
      paymentId: payment._id.toString(),
      appointmentId: payment.appointmentId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status
    });
    
    console.log(`Updated payment ${payment._id} status to completed`);
  } catch (error) {
    console.error(`Error handling PayPal payment success: ${error.message}`);
    
    if (webhookEvent) {
      webhookEvent.processingError = `Error handling PayPal payment success: ${error.message}`;
      await webhookEvent.save();
    }
  }
};

/**
 * Handle PayPal payment failure
 * @param {string} tenantId - Tenant ID
 * @param {Object} captureResource - PayPal capture resource
 * @param {Object} webhookEvent - WebhookEvent document for logging
 */
const handlePayPalPaymentFailure = async (tenantId, captureResource, webhookEvent) => {
  try {
    // Find the payment in our database
    const payment = await Payment.findOne({ 
      tenantId,
      'providerData.captureId': captureResource.id
    });
    
    if (!payment) {
      console.log(`Payment not found for PayPal capture ${captureResource.id}`);
      
      if (webhookEvent) {
        webhookEvent.processingError = `Payment not found for PayPal capture ${captureResource.id}`;
        await webhookEvent.save();
      }
      
      return;
    }

    // Update webhookEvent with payment info
    if (webhookEvent) {
      webhookEvent.paymentId = payment._id.toString();
      webhookEvent.appointmentId = payment.appointmentId;
      webhookEvent.customerId = payment.customerId;
      await webhookEvent.save();
    }
    
    // Update payment status
    payment.status = 'failed';
    payment.updatedAt = new Date();
    payment.error = captureResource.status_details?.reason || 'Payment failed';
    
    await payment.save();
    
    // Publish payment event
    await publishPaymentEvent(PaymentEventType.FAILED, {
      tenantId,
      paymentId: payment._id.toString(),
      appointmentId: payment.appointmentId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      error: payment.error
    });
    
    console.log(`Updated payment ${payment._id} status to failed`);
  } catch (error) {
    console.error(`Error handling PayPal payment failure: ${error.message}`);
    
    if (webhookEvent) {
      webhookEvent.processingError = `Error handling PayPal payment failure: ${error.message}`;
      await webhookEvent.save();
    }
  }
};

/**
 * Handle PayPal refund
 * @param {string} tenantId - Tenant ID
 * @param {Object} refundResource - PayPal refund resource
 * @param {Object} webhookEvent - WebhookEvent document for logging
 */
const handlePayPalRefund = async (tenantId, refundResource, webhookEvent) => {
  try {
    // Find the payment in our database
    const payment = await Payment.findOne({ 
      tenantId,
      'providerData.captureId': refundResource.links.find(link => link.rel === 'up')?.href.split('/').pop()
    });
    
    if (!payment) {
      console.log(`Payment not found for PayPal refund ${refundResource.id}`);
      
      if (webhookEvent) {
        webhookEvent.processingError = `Payment not found for PayPal refund ${refundResource.id}`;
        await webhookEvent.save();
      }
      
      return;
    }

    // Update webhookEvent with payment info
    if (webhookEvent) {
      webhookEvent.paymentId = payment._id.toString();
      webhookEvent.appointmentId = payment.appointmentId;
      webhookEvent.refundAmount = parseFloat(refundResource.amount.value);
      webhookEvent.refundId = refundResource.id;
      await webhookEvent.save();
    }
    
    // Update payment status
    payment.status = 'refunded';
    payment.updatedAt = new Date();
    payment.refundedAt = new Date();
    payment.refundAmount = parseFloat(refundResource.amount.value);
    payment.refundId = refundResource.id;
    
    await payment.save();
    
    // Publish payment event
    await publishPaymentEvent(PaymentEventType.REFUNDED, {
      tenantId,
      paymentId: payment._id.toString(),
      appointmentId: payment.appointmentId,
      amount: payment.amount,
      refundAmount: payment.refundAmount,
      currency: payment.currency,
      status: payment.status,
      refundId: payment.refundId
    });
    
    console.log(`Updated payment ${payment._id} status to refunded`);
  } catch (error) {
    console.error(`Error handling PayPal refund: ${error.message}`);
    
    if (webhookEvent) {
      webhookEvent.processingError = `Error handling PayPal refund: ${error.message}`;
      await webhookEvent.save();
    }
  }
};

/**
 * Handle PayPal dispute
 * @param {string} tenantId - Tenant ID
 * @param {Object} disputeResource - PayPal dispute resource
 * @param {Object} webhookEvent - WebhookEvent document for logging
 */
const handlePayPalDispute = async (tenantId, disputeResource, webhookEvent) => {
  try {
    // Find the payment by transaction ID
    const payment = await Payment.findOne({ 
      tenantId,
      'providerData.transactionId': disputeResource.disputed_transactions[0]?.reference_id
    });
    
    if (!payment) {
      console.log(`Payment not found for PayPal dispute ${disputeResource.dispute_id}`);
      
      if (webhookEvent) {
        webhookEvent.processingError = `Payment not found for PayPal dispute ${disputeResource.dispute_id}`;
        await webhookEvent.save();
      }
      
      return;
    }

    // Update webhookEvent with dispute info
    if (webhookEvent) {
      webhookEvent.paymentId = payment._id.toString();
      webhookEvent.appointmentId = payment.appointmentId;
      webhookEvent.disputeId = disputeResource.dispute_id;
      webhookEvent.disputeStatus = disputeResource.status;
      webhookEvent.disputeReason = disputeResource.reason;
      webhookEvent.disputeAmount = parseFloat(disputeResource.dispute_amount.value);
      webhookEvent.disputeCreatedAt = new Date(disputeResource.create_time);
      await webhookEvent.save();
    }
    
    // Update payment with dispute information
    payment.disputeId = disputeResource.dispute_id;
    payment.disputeStatus = disputeResource.status;
    payment.disputeReason = disputeResource.reason;
    payment.disputeAmount = parseFloat(disputeResource.dispute_amount.value);
    payment.disputeCreatedAt = new Date(disputeResource.create_time);
    
    await payment.save();
    
    console.log(`Updated payment ${payment._id} with dispute information`);
  } catch (error) {
    console.error(`Error handling PayPal dispute: ${error.message}`);
    
    if (webhookEvent) {
      webhookEvent.processingError = `Error handling PayPal dispute: ${error.message}`;
      await webhookEvent.save();
    }
  }
};

module.exports = {
  handleStripeWebhook,
  handleSquareWebhook,
  handlePayPalWebhook,
  
  // Export for testing endpoints
  processStripeEvent,
  processSquareEvent,
  processPayPalEvent
}; 