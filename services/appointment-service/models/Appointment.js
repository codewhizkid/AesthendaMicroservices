const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Appointment Schema
 * Represents a client appointment with a stylist for a specific service
 */
const AppointmentSchema = new Schema({
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
  
  stylistId: {
    type: Schema.Types.ObjectId,
    ref: 'Stylist',
    required: true,
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
    },
    price: {
      type: Number,
      required: true
    },
    duration: {
      type: Number, // Duration in minutes
      required: true
    }
  }],
  
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  startTime: {
    type: String, // Format: "HH:MM" in 24-hour format
    required: true
  },
  
  endTime: {
    type: String, // Format: "HH:MM" in 24-hour format
    required: true
  },
  
  duration: {
    type: Number, // Duration in minutes
    required: true,
    min: 5,
    max: 480 // Max 8 hours
  },
  
  // For recurring appointments, reference to the parent recurring series
  recurringSeriesId: {
    type: Schema.Types.ObjectId,
    ref: 'RecurringSeries',
    index: true
  },
  
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled',
    index: true
  },
  
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partially_paid', 'paid', 'refunded'],
    default: 'unpaid'
  },
  
  // For deposits or pre-payments
  prepaidAmount: {
    type: Number,
    default: 0
  },
  
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Client notes visible only to staff
  internalNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Cancellation details
  cancellation: {
    reason: {
      type: String,
      trim: true
    },
    cancelledBy: {
      type: String,
      enum: ['client', 'stylist', 'admin', 'system']
    },
    cancelledAt: {
      type: Date
    },
    refundAmount: {
      type: Number,
      default: 0
    }
  },
  
  // Notification settings for this appointment
  notifications: {
    confirmationSent: {
      type: Boolean,
      default: false
    },
    reminderSent: {
      type: Boolean,
      default: false
    },
    followUpSent: {
      type: Boolean,
      default: false
    }
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Indexes for performance optimization
AppointmentSchema.index({ tenantId: 1, date: 1 });
AppointmentSchema.index({ tenantId: 1, stylistId: 1, date: 1 });
AppointmentSchema.index({ tenantId: 1, clientId: 1, date: 1 });
AppointmentSchema.index({ status: 1, date: 1 });

// Middleware to handle appointment status changes
AppointmentSchema.pre('save', function(next) {
  // Update the updatedAt timestamp
  this.updatedAt = new Date();
  
  // If the appointment is being cancelled, set the cancellation details
  if (this.isModified('status') && this.status === 'cancelled' && !this.cancellation.cancelledAt) {
    this.cancellation.cancelledAt = new Date();
  }
  
  next();
});

/**
 * Instance methods
 */

// Calculate total duration including all services
AppointmentSchema.methods.getTotalDuration = function() {
  let totalDuration = this.duration;
  
  if (this.additionalServices && this.additionalServices.length > 0) {
    totalDuration += this.additionalServices.reduce((sum, service) => sum + service.duration, 0);
  }
  
  return totalDuration;
};

// Calculate total price including all services
AppointmentSchema.methods.recalculatePrice = function() {
  let additionalServicesTotal = 0;
  
  if (this.additionalServices && this.additionalServices.length > 0) {
    additionalServicesTotal = this.additionalServices.reduce((sum, service) => sum + service.price, 0);
  }
  
  this.totalPrice = this.basePrice + additionalServicesTotal;
  return this.totalPrice;
};

// Check if the appointment overlaps with another time period
AppointmentSchema.methods.overlaps = function(startDateTime, endDateTime) {
  const appointmentStart = new Date(`${this.date.toISOString().split('T')[0]}T${this.startTime}:00`);
  const appointmentEnd = new Date(`${this.date.toISOString().split('T')[0]}T${this.endTime}:00`);
  
  return (appointmentStart < endDateTime && appointmentEnd > startDateTime);
};

/**
 * Static methods
 */

// Find overlapping appointments for a stylist
AppointmentSchema.statics.findOverlappingAppointments = async function(tenantId, stylistId, date, startTime, endTime, excludeAppointmentId = null) {
  const startDateTime = new Date(`${date}T${startTime}:00`);
  const endDateTime = new Date(`${date}T${endTime}:00`);
  
  let query = {
    tenantId,
    stylistId,
    date: { $eq: new Date(date) },
    status: { $nin: ['cancelled', 'no-show'] },
    $or: [
      { 
        startTime: { 
          $lt: endTime 
        }, 
        endTime: { 
          $gt: startTime 
        } 
      }
    ]
  };
  
  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }
  
  return this.find(query);
};

// Find available time slots for a stylist on a given date
AppointmentSchema.statics.findAvailableTimeSlots = async function(tenantId, stylistId, date, serviceDuration, businessHours) {
  // Get all appointments for the stylist on the given date
  const appointments = await this.find({
    tenantId,
    stylistId,
    date: { $eq: new Date(date) },
    status: { $nin: ['cancelled', 'no-show'] }
  }).sort({ startTime: 1 });
  
  // Get the business hours for the given day
  const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 1 = Monday, etc.
  const hoursForDay = businessHours.find(hours => hours.day === dayOfWeek);
  
  if (!hoursForDay || !hoursForDay.isOpen) {
    return []; // Salon is closed on this day
  }
  
  // Calculate available time slots
  const availableSlots = [];
  const slotInterval = 15; // Time slot interval in minutes
  const startOfDay = hoursForDay.openTime; // Format: "HH:MM"
  const endOfDay = hoursForDay.closeTime; // Format: "HH:MM"
  
  // Convert business hours to minutes for easier calculation
  const startMinutes = convertTimeToMinutes(startOfDay);
  const endMinutes = convertTimeToMinutes(endOfDay);
  
  // Create time slots from start of business to end of business
  for (let minutes = startMinutes; minutes <= endMinutes - serviceDuration; minutes += slotInterval) {
    const slotStart = convertMinutesToTime(minutes);
    const slotEnd = convertMinutesToTime(minutes + serviceDuration);
    
    // Check if the slot overlaps with any existing appointment
    const overlapping = appointments.some(appointment => {
      const appointmentStart = convertTimeToMinutes(appointment.startTime);
      const appointmentEnd = convertTimeToMinutes(appointment.endTime);
      
      return (minutes < appointmentEnd && minutes + serviceDuration > appointmentStart);
    });
    
    if (!overlapping) {
      availableSlots.push({
        startTime: slotStart,
        endTime: slotEnd
      });
    }
  }
  
  return availableSlots;
};

// Helper function to convert time string (HH:MM) to minutes
function convertTimeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

// Helper function to convert minutes to time string (HH:MM)
function convertMinutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Create the model
const Appointment = mongoose.model('Appointment', AppointmentSchema);

module.exports = Appointment;