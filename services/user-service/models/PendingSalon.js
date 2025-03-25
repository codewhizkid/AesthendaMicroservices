const mongoose = require('mongoose');

const PendingSalonSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  ownerName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  hashedPassword: {
    type: String,
    required: true
  },
  planId: {
    type: String,
    required: true
  },
  paymentIntentId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending_payment', 'payment_received', 'payment_failed', 'completed'],
    default: 'pending_payment'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Pending registrations expire after 24 hours
      const date = new Date();
      date.setHours(date.getHours() + 24);
      return date;
    }
  }
});

// Indexes for quick lookups and to enforce uniqueness
PendingSalonSchema.index({ paymentIntentId: 1 }, { unique: true });
PendingSalonSchema.index({ email: 1 });
PendingSalonSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-cleanup

module.exports = mongoose.model('PendingSalon', PendingSalonSchema);