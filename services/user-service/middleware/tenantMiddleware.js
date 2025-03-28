/**
 * Middleware for enforcing tenant isolation in database operations
 * This ensures users can only access data from their own tenant
 */

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Apply a tenant context to a mongoose query
 * @param {Object} req - The Express request object
 * @param {Object} query - The mongoose query object
 */
const applyTenantContext = (req, query) => {
  // Skip tenant filtering for system admins
  if (req.user && req.user.role === 'system_admin') {
    return;
  }

  // For all other users, ensure the tenantId is applied to the query
  if (req.user && req.user.tenantId) {
    query.where('tenantId').equals(req.user.tenantId);
  } else {
    // If no tenant context or user is not authenticated, return no results
    // This creates a "secure by default" approach
    query.where('_id').equals('no_results_for_missing_tenant_context');
  }
};

/**
 * Middleware to extract tenant context from JWT token
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
const extractTenantContext = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      req.user = decoded;
      req.tenantId = decoded.tenantId;
      
      // Set global tenant context for this request (used by Mongoose hooks)
      global.tenantContext = { tenantId: decoded.tenantId };
    } catch (error) {
      // Invalid token, but don't block the request
      // Just don't set the tenant context
      console.error('Error decoding JWT token:', error.message);
    }
  }
  
  next();
};

/**
 * Utility to bypass tenant isolation for a query
 * @param {Object} query - Mongoose query object
 * @returns {Object} - The same query with bypass option set
 */
const bypassTenantIsolation = (query) => {
  return query.setOptions({ bypassTenantIsolation: true });
};

/**
 * Set the current tenant ID for operations that need it
 * @param {String} tenantId - The tenant ID to set
 */
const setTenantContext = (tenantId) => {
  global.tenantContext = { tenantId };
};

/**
 * Clear the current tenant context
 */
const clearTenantContext = () => {
  global.tenantContext = null;
};

/**
 * Apply tenant isolation to mongoose models
 * This adds pre-find hooks to all relevant models
 */
const applyTenantIsolation = () => {
  // Comprehensive list of models that should have tenant isolation
  const models = [
    'User',
    'Role',
    'Salon',
    'Appointment',
    'Service',
    'Client',
    'PaymentRecord',
    'StaffSchedule',
    'Notification',
    'Message',
    'Review',
    'Invoice'
  ];
  
  models.forEach(modelName => {
    if (mongoose.modelNames().includes(modelName)) {
      const model = mongoose.model(modelName);
      
      // Add middleware to find operations
      ['find', 'findOne', 'findById', 'countDocuments', 'exists'].forEach(method => {
        model.schema.pre(method, function() {
          // Skip if explicitly bypassing tenant isolation
          if (this.getOptions().bypassTenantIsolation) {
            return;
          }
          
          // Get tenant context
          const tenantId = this._tenantId || 
                           (global.tenantContext ? global.tenantContext.tenantId : null);
          
          // Apply tenant filter only if model has tenantId field and tenantId is provided
          if (model.schema.path('tenantId') && tenantId) {
            this.where({ tenantId });
          }
        });
      });
      
      // Add middleware to update/delete operations
      ['updateOne', 'updateMany', 'deleteOne', 'deleteMany'].forEach(method => {
        model.schema.pre(method, function() {
          // Skip if explicitly bypassing tenant isolation
          if (this.getOptions().bypassTenantIsolation) {
            return;
          }
          
          // Get tenant context
          const tenantId = this._tenantId || 
                           (global.tenantContext ? global.tenantContext.tenantId : null);
          
          // Apply tenant filter only if model has tenantId field and tenantId is provided
          if (model.schema.path('tenantId') && tenantId) {
            this._conditions.tenantId = tenantId;
          }
        });
      });
      
      // Add middleware to ensure new documents have tenantId
      model.schema.pre('save', function(next) {
        // Skip if already has tenantId or explicitly bypassing tenant isolation
        if (this.tenantId || this._bypassTenantIsolation) {
          return next();
        }
        
        // Get tenant context from global context or options
        const tenantId = this._tenantId || 
                         (global.tenantContext ? global.tenantContext.tenantId : null);
        
        // Apply tenant ID if available
        if (tenantId && model.schema.path('tenantId')) {
          this.tenantId = tenantId;
        }
        
        next();
      });
    }
  });
  
  console.log('✅ Tenant isolation applied to relevant models');
};

/**
 * Create a context function for Apollo Server
 * This extracts tenant information from the token and adds it to the context
 */
const createApolloContext = () => {
  return ({ req }) => {
    const token = req.headers.authorization?.split(' ')[1];
    let user = null;
    let tenantId = null;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        
        user = decoded;
        tenantId = decoded.tenantId;
        
        // Set global tenant context for this request
        global.tenantContext = { tenantId };
      } catch (error) {
        // Invalid token, but don't block the operation
        console.error('Error decoding JWT token:', error.message);
      }
    }
    
    return {
      user,
      tenantId,
      req
    };
  };
};

const canAccessUserData = (user, requestedUserId, requestedTenantId) => {
  // System admins can access all users
  if (user.role === 'system_admin') {
    return true;
  }
  
  // Users can always access their own data
  if (user.id === requestedUserId) {
    return true;
  }
  
  // Must be in the same tenant to proceed
  if (user.tenantId !== requestedTenantId) {
    return false;
  }
  
  // Role-based access within the same tenant
  switch (user.role) {
    case 'salon_admin':
      // Salon admins can access all users in their tenant
      return true;
      
    case 'salon_manager':
      // Managers can access staff and clients but not admins
      return true; // We could add more granular checks here if needed
      
    case 'front_desk':
      // Front desk can access client data and basic stylist info
      return true; // Again, could be more granular
      
    case 'stylist':
      // Stylists can only access their clients' data
      // This would require additional checks against appointments
      return false; // Default to false unless explicitly allowed
      
    default:
      return false;
  }
};

// Future enhancement for multiple locations
const SalonSchema = new mongoose.Schema({
  // ...existing fields
  tenantId: {
    type: String,
    required: true,
    index: true // Keep indexed for performance
  },
  isMainLocation: {
    type: Boolean,
    default: true
  },
  parentSalonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    sparse: true // Only index non-null values
  }
});

// Add compound index for tenant + location uniqueness
SalonSchema.index({ tenantId: 1, isMainLocation: 1 }, { 
  unique: true, 
  partialFilterExpression: { isMainLocation: true } 
});

const UserSchema = new mongoose.Schema({
  // ...other fields
  tenantId: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Prevent accidental use of default tenant except for system admins
        return this.role === 'system_admin' || v !== 'default';
      },
      message: props => 'A valid tenant ID is required for non-system admin users'
    },
    index: true
  }
});

// Update pre-save middleware to enforce tenant context
UserSchema.pre('save', function(next) {
  // For non-system admins, require explicit tenant
  if (!this.isModified('tenantId')) return next();
  
  if (this.tenantId === 'default' && this.role !== 'system_admin') {
    return next(new Error('Non-system admin users must have a specific tenant ID'));
  }
  
  next();
});

// Example payment service schema
const PaymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  // Stripe or other payment provider fields
  stripePaymentIntentId: String,
  stripeCustomerId: String
});

// Apply the same tenant isolation principles
PaymentSchema.pre('find', function() {
  // Get tenant context and apply filtering
  const tenantId = global.tenantContext?.tenantId;
  if (tenantId) {
    this.where({ tenantId });
  }
});

module.exports = {
  applyTenantContext,
  extractTenantContext,
  applyTenantIsolation,
  createApolloContext,
  bypassTenantIsolation,
  setTenantContext,
  clearTenantContext
}; 