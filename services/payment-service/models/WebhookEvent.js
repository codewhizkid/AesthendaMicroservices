const mongoose = require('mongoose');

/**
 * WebhookEvent Schema
 * 
 * Used to log all webhook events received from payment providers.
 * This provides a comprehensive audit trail for debugging and monitoring.
 */
const WebhookEventSchema = new mongoose.Schema({
  // Core event data
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  provider: {
    type: String,
    required: true,
    enum: ['stripe', 'square', 'paypal', 'test'],
    index: true
  },
  eventType: {
    type: String,
    required: true,
    index: true
  },
  eventId: {
    type: String,
    required: true
  },
  
  // Status and processing info
  status: {
    type: String,
    required: true,
    enum: ['received', 'processed', 'failed', 'invalid_signature'],
    default: 'received',
    index: true
  },
  processingError: {
    type: String,
    default: null
  },
  
  // Metadata and related records
  paymentId: {
    type: String,
    index: true
  },
  appointmentId: {
    type: String,
    index: true
  },
  customerId: {
    type: String,
    index: true
  },
  metadata: {
    type: Object,
    default: {}
  },
  
  // Request details
  ipAddress: {
    type: String
  },
  headers: {
    type: Object,
    default: {}
  },
  payload: {
    type: Object,
    required: true
  },
  
  // Timestamps
  receivedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  processedAt: {
    type: Date
  }
}, { 
  timestamps: { 
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
});

// Compound indexes for efficient querying
WebhookEventSchema.index({ tenantId: 1, receivedAt: -1 });
WebhookEventSchema.index({ tenantId: 1, provider: 1, receivedAt: -1 });
WebhookEventSchema.index({ tenantId: 1, status: 1, receivedAt: -1 });

const WebhookEvent = mongoose.model('WebhookEvent', WebhookEventSchema);

module.exports = WebhookEvent; 