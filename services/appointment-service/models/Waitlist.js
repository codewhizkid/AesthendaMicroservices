const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Waitlist Schema
 * Represents clients waiting for a specific service when no slots are available
 */
const WaitlistSchema = new Schema({
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  
  // Optional: specific stylist the client wants
  stylistId: {
    type: Schema.Types.ObjectId,
    ref: 'Stylist',
    index: true
  },
  
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  
  // Additional services that may be added to the appointment
  additionalServices: [{
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    }
  }],
  
  // When the client was added to the waitlist
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Until when the client is willing to wait
  availableUntil: {
    type: Date
  },
  
  // Client's preferred date range
  preferredDateRange: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  
  // Client's preferred time range
  preferredTimeRange: {
    startTime: {
      type: String, // Format: "HH:MM" in 24-hour format
      required: true
    },
    endTime: {
      type: String, // Format: "HH:MM" in 24-hour format
      required: true
    }
  },
  
  // Priority level (can be used for VIP clients or urgent cases)
  priority: {
    type: Number,
    enum: [1, 2, 3, 4, 5], // 1=lowest, 5=highest
    default: 3
  },
  
  // Status of the waitlist entry
  status: {
    type: String,
    enum: ['active', 'notified', 'booked', 'expired', 'cancelled'],
    default: 'active',
    index: true
  },
  
  // When was the client last notified about availability
  lastNotifiedAt: {
    type: Date
  },
  
  // How many times the client has been notified
  notificationCount: {
    type: Number,
    default: 0
  },
  
  // If the client gets booked, reference to the appointment
  appointmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  
  // Client's original notes/requests
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Staff notes about the waitlist entry
  internalNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Client's contact preferences for waitlist notifications
  contactPreferences: {
    method: {
      type: String,
      enum: ['email', 'sms', 'both'],
      default: 'email'
    },
    email: {
      type: Boolean,
      default: true
    },
    phone: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes for performance optimization
WaitlistSchema.index({ tenantId: 1, status: 1 });
WaitlistSchema.index({ tenantId: 1, 'preferredDateRange.startDate': 1, status: 1 });
WaitlistSchema.index({ tenantId: 1, serviceId: 1, status: 1 });
WaitlistSchema.index({ tenantId: 1, priority: -1, createdAt: 1 }); // For prioritized waitlist

/**
 * Instance methods
 */

// Check if waitlist entry is still valid (not expired)
WaitlistSchema.methods.isValid = function() {
  if (this.status !== 'active' && this.status !== 'notified') {
    return false;
  }
  
  if (this.availableUntil && new Date() > this.availableUntil) {
    this.status = 'expired';
    return false;
  }
  
  // Check if preferred date range is still in the future or current
  const now = new Date();
  if (this.preferredDateRange.endDate < now) {
    this.status = 'expired';
    return false;
  }
  
  return true;
};

// Mark the waitlist entry as notified
WaitlistSchema.methods.markAsNotified = function() {
  this.status = 'notified';
  this.lastNotifiedAt = new Date();
  this.notificationCount += 1;
};

// Mark the waitlist entry as booked with an appointment
WaitlistSchema.methods.markAsBooked = function(appointmentId) {
  this.status = 'booked';
  this.appointmentId = appointmentId;
};

// Cancel the waitlist entry
WaitlistSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  if (reason) {
    this.internalNotes = this.internalNotes 
      ? `${this.internalNotes}\n\nCancelled: ${reason}`
      : `Cancelled: ${reason}`;
  }
};

/**
 * Static methods
 */

// Find active waitlist entries for a specific service and date range
WaitlistSchema.statics.findEligibleClients = async function(tenantId, serviceId, date, stylistId = null) {
  const query = {
    tenantId,
    serviceId,
    status: { $in: ['active', 'notified'] },
    'preferredDateRange.startDate': { $lte: date },
    'preferredDateRange.endDate': { $gte: date }
  };
  
  if (stylistId) {
    query.$or = [
      { stylistId },
      { stylistId: { $exists: false } }, 
      { stylistId: null }
    ];
  }
  
  return this.find(query)
    .sort({ priority: -1, createdAt: 1 }) // Higher priority first, then first come first served
    .populate('clientId', 'firstName lastName email phone')
    .populate('serviceId', 'name price duration');
};

// Expire outdated waitlist entries
WaitlistSchema.statics.expireOutdatedEntries = async function() {
  const now = new Date();
  
  return this.updateMany(
    {
      status: { $in: ['active', 'notified'] },
      $or: [
        { availableUntil: { $lt: now } },
        { 'preferredDateRange.endDate': { $lt: now } }
      ]
    },
    {
      $set: { status: 'expired' }
    }
  );
};

// Create the model
const Waitlist = mongoose.model('Waitlist', WaitlistSchema);

module.exports = Waitlist;