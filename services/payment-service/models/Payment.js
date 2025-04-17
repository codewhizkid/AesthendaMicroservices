const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Payment schema
 * 
 * Represents a payment transaction in the system
 * Includes fields for tracking payment status, disputes, refunds, etc.
 */
const PaymentSchema = new Schema({
  // Core payment details
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  appointmentId: {
    type: String,
    required: true,
    index: true
  },
  customerId: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'usd',
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  metadata: {
    type: Object,
    default: {}
  },
  
  // Provider details
  provider: {
    type: String,
    required: true,
    enum: ['stripe', 'square', 'paypal', 'mock'],
    default: 'mock'
  },
  providerData: {
    type: Object,
    default: {}
  },
  
  // Status tracking
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded', 'disputed'],
    default: 'pending',
    index: true
  },
  error: {
    type: String
  },
  
  // Refund tracking
  refundId: {
    type: String,
    sparse: true
  },
  refundAmount: {
    type: Number,
    min: 0
  },
  refundReason: {
    type: String
  },
  refundedAt: {
    type: Date
  },
  
  // Dispute tracking
  disputeId: {
    type: String,
    sparse: true
  },
  disputeStatus: {
    type: String,
    enum: ['warning_needs_response', 'warning_under_review', 'warning_closed', 'needs_response', 'under_review', 'won', 'lost']
  },
  disputeReason: {
    type: String
  },
  disputeAmount: {
    type: Number,
    min: 0
  },
  disputeCreatedAt: {
    type: Date
  },
  disputeUpdatedAt: {
    type: Date
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// Create compound indexes
PaymentSchema.index({ tenantId: 1, appointmentId: 1 });
PaymentSchema.index({ tenantId: 1, customerId: 1 });
PaymentSchema.index({ tenantId: 1, createdAt: -1 });
PaymentSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

// Pre-save hook for timestamps
PaymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Payment = mongoose.model('Payment', PaymentSchema);

module.exports = Payment; 