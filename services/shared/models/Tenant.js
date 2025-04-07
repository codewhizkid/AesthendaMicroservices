const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE'
  },
  settings: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    businessHours: [{
      dayOfWeek: Number, // 0 = Sunday, 6 = Saturday
      startTime: String, // HH:mm format
      endTime: String,   // HH:mm format
      isOpen: Boolean,
      breaks: [{
        startTime: String,
        endTime: String,
        reason: String
      }]
    }],
    holidays: [{
      date: Date,
      name: String,
      isRecurring: Boolean, // For annual holidays
      description: String
    }],
    specialEvents: [{
      name: String,
      startDate: Date,
      endDate: Date,
      description: String,
      affectsAvailability: Boolean,
      modifiedHours: {
        startTime: String,
        endTime: String
      }
    }],
    appointmentSettings: {
      minAdvanceTime: {
        type: Number,
        default: 1 // hours
      },
      maxAdvanceTime: {
        type: Number,
        default: 30 // days
      },
      defaultDuration: {
        type: Number,
        default: 60 // minutes
      },
      bufferTime: {
        type: Number,
        default: 15 // minutes
      },
      allowMultipleServices: {
        type: Boolean,
        default: true
      },
      maxServicesPerBooking: {
        type: Number,
        default: 3
      },
      cancellationPolicy: {
        minHoursNotice: {
          type: Number,
          default: 24
        },
        cancellationFee: {
          type: Number,
          default: 0
        },
        allowRescheduling: {
          type: Boolean,
          default: true
        },
        rescheduleLimit: {
          type: Number,
          default: 2
        }
      }
    },
    staffSettings: {
      showStaffPhotos: {
        type: Boolean,
        default: true
      },
      allowStaffSelection: {
        type: Boolean,
        default: true
      },
      rotateAssignments: {
        type: Boolean,
        default: false
      },
      defaultBreakDuration: {
        type: Number,
        default: 30 // minutes
      },
      minimumBreaksBetweenAppointments: {
        type: Number,
        default: 0 // minutes
      },
      maxDailyAppointments: {
        type: Number,
        default: null
      }
    },
    notificationSettings: {
      enableEmail: {
        type: Boolean,
        default: true
      },
      enableSMS: {
        type: Boolean,
        default: true
      },
      enablePush: {
        type: Boolean,
        default: true
      },
      reminderTimes: [{
        type: Number, // hours before appointment
        default: [24] // 24 hours before
      }],
      customMessages: {
        confirmation: {
          email: String,
          sms: String
        },
        reminder: {
          email: String,
          sms: String
        },
        cancellation: {
          email: String,
          sms: String
        },
        followUp: {
          email: String,
          sms: String,
          delayHours: {
            type: Number,
            default: 24
          }
        }
      },
      staffNotifications: {
        newBooking: {
          type: Boolean,
          default: true
        },
        cancellation: {
          type: Boolean,
          default: true
        },
        modification: {
          type: Boolean,
          default: true
        },
        dailySchedule: {
          type: Boolean,
          default: true
        },
        sendTime: String // HH:mm format
      }
    }
  },
  branding: {
    logo: {
      url: String,
      altText: String,
      width: Number,
      height: Number
    },
    colors: {
      primary: String,
      secondary: String,
      accent: String,
      background: String,
      text: String,
      links: String
    },
    typography: {
      primaryFont: String,
      secondaryFont: String,
      fontSize: {
        base: String,
        headings: {
          h1: String,
          h2: String,
          h3: String
        }
      }
    },
    layout: {
      showTestimonials: {
        type: Boolean,
        default: true
      },
      showPromotions: {
        type: Boolean,
        default: true
      },
      showSocialLinks: {
        type: Boolean,
        default: true
      },
      customSections: [{
        name: String,
        content: String,
        position: String,
        isEnabled: Boolean
      }]
    },
    customCss: String,
    socialLinks: {
      facebook: String,
      instagram: String,
      twitter: String,
      linkedin: String,
      yelp: String
    }
  },
  services: {
    categories: [{
      name: String,
      description: String,
      order: Number,
      isEnabled: Boolean
    }],
    pricingTiers: [{
      name: String,
      description: String,
      multiplier: Number
    }],
    specialOffers: [{
      name: String,
      description: String,
      discountType: {
        type: String,
        enum: ['PERCENTAGE', 'FIXED_AMOUNT']
      },
      discountValue: Number,
      startDate: Date,
      endDate: Date,
      applicableServices: [mongoose.Schema.Types.ObjectId],
      minimumBookingValue: Number,
      maxUses: Number,
      currentUses: Number
    }]
  },
  contact: {
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    contactForm: {
      isEnabled: Boolean,
      fields: [{
        name: String,
        type: String,
        isRequired: Boolean,
        order: Number
      }]
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'],
      default: 'FREE'
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAST_DUE', 'CANCELLED'],
      default: 'ACTIVE'
    },
    startDate: Date,
    endDate: Date,
    features: [{
      name: String,
      isEnabled: Boolean
    }]
  },
  analytics: {
    googleAnalyticsId: String,
    facebookPixelId: String,
    customScripts: [{
      name: String,
      content: String,
      loadLocation: {
        type: String,
        enum: ['HEAD', 'BODY_START', 'BODY_END']
      }
    }]
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes
tenantSchema.index({ slug: 1 });
tenantSchema.index({ status: 1 });
tenantSchema.index({ 'subscription.status': 1 });
tenantSchema.index({ 'services.categories.name': 1 });
tenantSchema.index({ 'services.specialOffers.endDate': 1 });

// Methods
tenantSchema.methods.isActive = function() {
  return this.status === 'ACTIVE' && this.subscription.status === 'ACTIVE';
};

tenantSchema.methods.getBusinessHours = function(dayOfWeek) {
  return this.settings.businessHours.find(hours => hours.dayOfWeek === dayOfWeek);
};

tenantSchema.methods.isHoliday = function(date) {
  const checkDate = new Date(date);
  return this.settings.holidays.some(holiday => {
    if (holiday.isRecurring) {
      return holiday.date.getMonth() === checkDate.getMonth() && 
             holiday.date.getDate() === checkDate.getDate();
    }
    return holiday.date.toDateString() === checkDate.toDateString();
  });
};

tenantSchema.methods.getActiveSpecialOffers = function() {
  const now = new Date();
  return this.services.specialOffers.filter(offer => 
    offer.startDate <= now && 
    offer.endDate >= now && 
    (!offer.maxUses || offer.currentUses < offer.maxUses)
  );
};

tenantSchema.methods.validateAppointmentTime = function(date, duration) {
  const appointmentDate = new Date(date);
  const dayOfWeek = appointmentDate.getDay();
  const businessHours = this.getBusinessHours(dayOfWeek);
  
  if (!businessHours || !businessHours.isOpen) {
    return false;
  }

  // Check if it's a holiday
  if (this.isHoliday(appointmentDate)) {
    return false;
  }

  // Check if there's a special event affecting availability
  const specialEvent = this.settings.specialEvents.find(event => 
    appointmentDate >= event.startDate && 
    appointmentDate <= event.endDate &&
    event.affectsAvailability
  );

  if (specialEvent) {
    // Use modified hours if available
    if (specialEvent.modifiedHours) {
      // Implement time validation logic here
      return true; // Placeholder
    }
    return false;
  }

  // Regular business hours validation
  const timeString = appointmentDate.toTimeString().slice(0, 5);
  return timeString >= businessHours.startTime && 
         timeString <= businessHours.endTime;
};

// Middleware
tenantSchema.pre('save', async function(next) {
  if (this.isNew && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }
  next();
});

const Tenant = mongoose.model('Tenant', tenantSchema);

module.exports = Tenant;