const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const SalonSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  tenantId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => uuidv4()
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'basic'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'trial'],
    default: 'trial'
  },
  contactInfo: {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    phone: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    },
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String,
      linkedin: String
    }
  },
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'US'
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  settings: {
    businessHours: {
      monday: { open: String, close: String, isOpen: Boolean },
      tuesday: { open: String, close: String, isOpen: Boolean },
      wednesday: { open: String, close: String, isOpen: Boolean },
      thursday: { open: String, close: String, isOpen: Boolean },
      friday: { open: String, close: String, isOpen: Boolean },
      saturday: { open: String, close: String, isOpen: Boolean },
      sunday: { open: String, close: String, isOpen: Boolean }
    },
    serviceCategories: [String],
    branding: {
      logoUrl: String,
      favicon: String,
      primaryColor: String,
      secondaryColor: String,
      accentColor: String,
      fontFamily: String,
      customCSS: String
    },
    notifications: {
      emailEnabled: { type: Boolean, default: true },
      smsEnabled: { type: Boolean, default: false },
      reminderHours: { type: Number, default: 24 }
    }
  },
  bookingPageConfig: {
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true
    },
    pageTitle: {
      type: String,
      trim: true
    },
    welcomeMessage: {
      type: String,
      trim: true
    },
    thankYouMessage: {
      type: String,
      trim: true
    },
    displayOptions: {
      showPrices: { type: Boolean, default: true },
      showDuration: { type: Boolean, default: true },
      enableClientLogin: { type: Boolean, default: true },
      requireDeposit: { type: Boolean, default: false },
      depositAmount: { type: Number, default: 0 },
      maxBookingWindow: { type: Number, default: 60 }, // Days in advance clients can book
      minNoticeTime: { type: Number, default: 1 } // Hours of notice required
    },
    seoSettings: {
      metaDescription: String,
      metaKeywords: String,
      ogImage: String
    },
    customDomain: String
  },
  subscription: {
    stripeCustomerId: String,
    planId: String,
    status: String,
    currentPeriodEnd: Date
  },
  onboardingStatus: {
    step1Completed: { type: Boolean, default: false },
    step2Completed: { type: Boolean, default: false },
    step3Completed: { type: Boolean, default: false },
    step4Completed: { type: Boolean, default: false },
    completed: { type: Boolean, default: false }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: { updatedAt: 'updatedAt' } });

// Method to check if salon is in trial period
SalonSchema.methods.isInTrial = function() {
  if (this.status !== 'trial') return false;
  
  // Trial period is 14 days
  const trialEndDate = new Date(this.createdAt);
  trialEndDate.setDate(trialEndDate.getDate() + 14);
  
  return new Date() < trialEndDate;
};

// Method to get remaining trial days
SalonSchema.methods.getRemainingTrialDays = function() {
  if (this.status !== 'trial') return 0;
  
  const trialEndDate = new Date(this.createdAt);
  trialEndDate.setDate(trialEndDate.getDate() + 14);
  
  const diffTime = trialEndDate - new Date();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
};

// Static method to find a salon by tenantId
SalonSchema.statics.findByTenantId = function(tenantId) {
  return this.findOne({ tenantId });
};

// Static method to find a salon by its booking page slug
SalonSchema.statics.findBySlug = function(slug) {
  return this.findOne({ 'bookingPageConfig.slug': slug });
};

module.exports = mongoose.model('Salon', SalonSchema); 