const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema for securely storing tenant payment provider configurations
 * This allows each tenant to use their own payment provider credentials
 */
const TenantPaymentConfigSchema = new Schema({
  // The unique tenant identifier
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  
  // Active payment provider for this tenant
  activeProvider: {
    type: String,
    enum: ['stripe', 'square', 'paypal', 'mock'],
    default: 'mock'
  },
  
  // Whether payments are enabled for this tenant
  isEnabled: {
    type: Boolean,
    default: false
  },
  
  // Environment setting (production or sandbox/test)
  environment: {
    type: String,
    enum: ['production', 'test'],
    default: 'test'
  },
  
  // Stripe configuration
  stripe: {
    // Whether Stripe is enabled for this tenant
    isEnabled: {
      type: Boolean,
      default: false
    },
    
    // Public API key (safe to use in client-side code)
    publicKey: {
      type: String,
      default: ''
    },
    
    // Secret API key (never expose to clients)
    secretKey: {
      type: String,
      default: ''
    },
    
    // Stripe account ID (for Connect/Marketplace implementations)
    accountId: {
      type: String,
      default: ''
    },
    
    // Webhook secret for verifying webhook events
    webhookSecret: {
      type: String,
      default: ''
    },
    
    // Webhook secret key for signature verification
    webhookSecretKey: {
      type: String,
      default: ''
    },
    
    // Webhook URL endpoint (optional, for tenant-specific endpoint)
    webhookUrl: {
      type: String,
      default: ''
    },
    
    // Additional configuration options (stored as JSON)
    options: {
      type: Object,
      default: {}
    }
  },
  
  // Square configuration
  square: {
    // Whether Square is enabled for this tenant
    isEnabled: {
      type: Boolean,
      default: false
    },
    
    // Application ID
    applicationId: {
      type: String,
      default: ''
    },
    
    // Access token
    accessToken: {
      type: String,
      default: ''
    },
    
    // Square location ID
    locationId: {
      type: String,
      default: ''
    },
    
    // Webhook signature key
    webhookSignatureKey: {
      type: String,
      default: ''
    },
    
    // Webhook URL endpoint (optional, for tenant-specific endpoint)
    webhookUrl: {
      type: String,
      default: ''
    },
    
    // Additional configuration options (stored as JSON)
    options: {
      type: Object,
      default: {}
    }
  },
  
  // PayPal configuration
  paypal: {
    // Whether PayPal is enabled for this tenant
    isEnabled: {
      type: Boolean,
      default: false
    },
    
    // Client ID
    clientId: {
      type: String,
      default: ''
    },
    
    // Client secret
    clientSecret: {
      type: String,
      default: ''
    },
    
    // Merchant ID
    merchantId: {
      type: String,
      default: ''
    },
    
    // Webhook ID
    webhookId: {
      type: String,
      default: ''
    },
    
    // Webhook URL endpoint (optional, for tenant-specific endpoint)
    webhookUrl: {
      type: String,
      default: ''
    },
    
    // Additional configuration options (stored as JSON)
    options: {
      type: Object,
      default: {}
    }
  },
  
  // Payment settings
  settings: {
    // Currency code (e.g., USD, EUR)
    currency: {
      type: String,
      default: 'USD'
    },
    
    // Whether to capture payments immediately or authorize only
    capturePaymentsAutomatically: {
      type: Boolean,
      default: true
    },
    
    // Percentage or flat fee to add as a service fee
    serviceFee: {
      type: Number,
      default: 0
    },
    
    // Type of service fee calculation
    serviceFeeType: {
      type: String,
      enum: ['percentage', 'flat'],
      default: 'percentage'
    },
    
    // Whether to apply taxes automatically
    applyTaxes: {
      type: Boolean,
      default: false
    },
    
    // Tax rate percentage
    taxRate: {
      type: Number,
      default: 0
    },
    
    // Whether to store customer payment methods for future use
    storeCustomerPaymentMethods: {
      type: Boolean,
      default: true
    }
  },
  
  // Metadata and tracking
  metadata: {
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: String
    },
    updatedBy: {
      type: String
    }
  }
});

// Update timestamp before saving
TenantPaymentConfigSchema.pre('save', function(next) {
  this.metadata.updatedAt = new Date();
  next();
});

// Add a unique compound index on tenantId to ensure only one config per tenant
TenantPaymentConfigSchema.index({ tenantId: 1 }, { unique: true });

module.exports = mongoose.model('TenantPaymentConfig', TenantPaymentConfigSchema); 