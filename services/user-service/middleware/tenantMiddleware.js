/**
 * Middleware for enforcing tenant isolation in database operations
 * This ensures users can only access data from their own tenant
 */

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

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
      const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';
      const decoded = jwt.verify(token, jwtSecret);
      
      req.user = decoded;
      req.tenantId = decoded.tenantId;
    } catch (error) {
      // Invalid token, but don't block the request
      // Just don't set the tenant context
      console.error('Error decoding JWT token:', error.message);
    }
  }
  
  next();
};

/**
 * Apply tenant isolation to mongoose models
 * This adds pre-find hooks to all relevant models
 */
const applyTenantIsolation = () => {
  // List of models that should have tenant isolation
  const models = [
    'User',
    'Role',
    // Add other models as they are created
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
    }
  });
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
        const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';
        const decoded = jwt.verify(token, jwtSecret);
        
        user = decoded;
        tenantId = decoded.tenantId;
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

module.exports = {
  applyTenantContext,
  extractTenantContext,
  applyTenantIsolation,
  createApolloContext
}; 