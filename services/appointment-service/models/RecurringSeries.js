const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * RecurringSeries Schema
 * Represents a series of recurring appointments
 */
const RecurringSeriesSchema = new Schema({
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
  
  // Additional services that may be added to each appointment
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
  
  // Recurrence pattern details
  recurrence: {
    // Type of recurrence: daily, weekly, monthly
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true
    },
    
    // Frequency (e.g., every 1 week, every 2 weeks)
    frequency: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    
    // For weekly recurrence, an array of days (0 = Sunday, 1 = Monday, etc.)
    daysOfWeek: {
      type: [Number],
      validate: {
        validator: function(v) {
          // Only required for weekly recurrence
          return this.recurrence.type !== 'weekly' || 
                 (v && v.length > 0 && v.every(day => day >= 0 && day <= 6));
        },
        message: 'At least one day of the week must be selected for weekly recurrence'
      }
    },
    
    // For monthly recurrence, day of month (1-31)
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31,
      validate: {
        validator: function(v) {
          // Only required for monthly recurrence
          return this.recurrence.type !== 'monthly' || (v >= 1 && v <= 31);
        },
        message: 'Day of month must be between 1 and 31 for monthly recurrence'
      }
    },
    
    // Start date of the series
    startDate: {
      type: Date,
      required: true
    },
    
    // End date of the series (if applicable)
    endDate: {
      type: Date
    },
    
    // Number of occurrences (alternative to endDate)
    occurrences: {
      type: Number,
      min: 1,
      max: 52 // Maximum of 52 occurrences (1 year of weekly appointments)
    },
    
    // Time of day for the appointments
    startTime: {
      type: String, // Format: "HH:MM" in 24-hour format
      required: true
    },
    
    // Duration in minutes
    duration: {
      type: Number,
      required: true,
      min: 5,
      max: 480 // Max 8 hours
    }
  },
  
  // Status of the entire recurring series
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Price per appointment in the series
  pricePerAppointment: {
    type: Number,
    required: true,
    min: 0
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
  
  // Array of generated appointment IDs in this series
  appointments: [{
    type: Schema.Types.ObjectId,
    ref: 'Appointment'
  }],
  
  // Exception dates where the recurring appointment doesn't occur
  exceptionDates: [{
    type: Date
  }],
  
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
RecurringSeriesSchema.index({ tenantId: 1, 'recurrence.startDate': 1 });
RecurringSeriesSchema.index({ tenantId: 1, stylistId: 1 });
RecurringSeriesSchema.index({ tenantId: 1, clientId: 1 });

// Middleware to handle status changes
RecurringSeriesSchema.pre('save', function(next) {
  // Update the updatedAt timestamp
  this.updatedAt = new Date();
  next();
});

/**
 * Instance methods
 */

// Calculate all occurrence dates based on the recurrence pattern
RecurringSeriesSchema.methods.calculateOccurrences = function() {
  const occurrenceDates = [];
  const { type, frequency, daysOfWeek, dayOfMonth, startDate, endDate, occurrences } = this.recurrence;
  
  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0); // Normalize to start of day
  
  let count = 0;
  const maxDate = endDate ? new Date(endDate) : null;
  const maxOccurrences = occurrences || Number.MAX_SAFE_INTEGER;
  
  // Helper to check if we've reached the end conditions
  const shouldContinue = () => {
    if (count >= maxOccurrences) return false;
    if (maxDate && currentDate > maxDate) return false;
    return true;
  };
  
  // Handle different recurrence types
  switch (type) {
    case 'daily':
      while (shouldContinue() && count < 365) { // Limit to 1 year
        occurrenceDates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + frequency);
        count++;
      }
      break;
      
    case 'weekly':
      // Sort days of week to ensure we check them in order
      const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
      
      while (shouldContinue() && count < 52 * 7) { // Limit to 1 year
        const currentDayOfWeek = currentDate.getDay();
        
        // Find the next day of week that matches
        let found = false;
        for (const day of sortedDays) {
          if (day === currentDayOfWeek) {
            occurrenceDates.push(new Date(currentDate));
            found = true;
            count++;
            break;
          } else if (day > currentDayOfWeek) {
            // Move to this day
            const daysToAdd = day - currentDayOfWeek;
            currentDate.setDate(currentDate.getDate() + daysToAdd);
            occurrenceDates.push(new Date(currentDate));
            found = true;
            count++;
            break;
          }
        }
        
        if (!found) {
          // Move to the first day of next week
          const daysToAdd = 7 - currentDayOfWeek + sortedDays[0];
          currentDate.setDate(currentDate.getDate() + daysToAdd);
          
          if (shouldContinue()) {
            occurrenceDates.push(new Date(currentDate));
            count++;
          }
        }
        
        // Move to the next week
        if (count % sortedDays.length === 0) {
          currentDate.setDate(currentDate.getDate() + (7 * frequency) - 7);
        } else {
          // Find the next day in the same week
          const currentIndex = sortedDays.indexOf(currentDate.getDay());
          if (currentIndex < sortedDays.length - 1) {
            const daysToAdd = sortedDays[currentIndex + 1] - sortedDays[currentIndex];
            currentDate.setDate(currentDate.getDate() + daysToAdd);
          } else {
            // Move to the first day of next week
            const daysToAdd = 7 - sortedDays[currentIndex] + sortedDays[0];
            currentDate.setDate(currentDate.getDate() + daysToAdd);
          }
        }
      }
      break;
      
    case 'monthly':
      while (shouldContinue() && count < 24) { // Limit to 2 years
        // Set day of month, handling edge cases
        const daysInMonth = new Date(
          currentDate.getFullYear(), 
          currentDate.getMonth() + 1, 
          0
        ).getDate();
        
        const actualDay = Math.min(dayOfMonth, daysInMonth);
        currentDate.setDate(actualDay);
        
        occurrenceDates.push(new Date(currentDate));
        count++;
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + frequency);
      }
      break;
  }
  
  return occurrenceDates;
};

// Generate appointment objects for all occurrences
RecurringSeriesSchema.methods.generateAppointments = function() {
  const occurrenceDates = this.calculateOccurrences();
  
  return occurrenceDates.map(date => {
    // Convert date to ISO format
    const dateString = date.toISOString().split('T')[0];
    
    // Calculate end time based on start time and duration
    const endTime = calculateEndTime(this.recurrence.startTime, this.recurrence.duration);
    
    return {
      tenantId: this.tenantId,
      clientId: this.clientId,
      stylistId: this.stylistId,
      serviceId: this.serviceId,
      additionalServices: this.additionalServices,
      date: date,
      startTime: this.recurrence.startTime,
      endTime: endTime,
      duration: this.recurrence.duration,
      recurringSeriesId: this._id,
      status: 'scheduled',
      totalPrice: this.pricePerAppointment,
      notes: this.notes,
      internalNotes: this.internalNotes
    };
  });
};

// Helper function to calculate end time
function calculateEndTime(startTime, durationMinutes) {
  const [hours, minutes] = startTime.split(':').map(Number);
  
  // Calculate total minutes
  let totalMinutes = hours * 60 + minutes + durationMinutes;
  
  // Convert back to hours and minutes
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  
  // Format as HH:MM
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

// Create the model
const RecurringSeries = mongoose.model('RecurringSeries', RecurringSeriesSchema);

module.exports = RecurringSeries;