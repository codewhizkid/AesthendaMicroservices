const jwt = require('jsonwebtoken');
const config = require('../config');
const { tenantError } = require('../utils/errorHandler');

/**
 * Authentication middleware to extract user from JWT token
 * @param {Object} req - The request object
 * @returns {Object|null} - The authenticated user or null
 */
const authenticateToken = (req) => {
  // Get the Authorization header
  const authHeader = req.headers.authorization || '';
  
  if (!authHeader) {
    return null;
  }

  try {
    // Check if the header is in the format 'Bearer [token]'
    const token = authHeader.split(' ')[1];
    if (!token) {
      return null;
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Return the user information from the token
    return {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenantId,
      stylist_id: decoded.stylist_id
    };
  } catch (error) {
    // Token verification failed
    console.error('Token verification failed:', error.message);
    return null;
  }
};

/**
 * Extract tenant ID from various sources (headers, token, query)
 * @param {Object} req - The request object
 * @param {Object} user - The authenticated user object from token
 * @returns {string|null} - The tenant ID or null
 */
const extractTenantId = (req, user = null) => {
  // First check explicit header
  if (req.headers['x-tenant-id']) {
    return req.headers['x-tenant-id'];
  }
  
  // Check if we have it from user token
  if (user && user.tenantId) {
    return user.tenantId;
  }
  
  // Check if in the request body for GraphQL operations
  if (req.body && req.body.variables && req.body.variables.tenantId) {
    return req.body.variables.tenantId;
  }
  
  // Check query params (for REST endpoints)
  if (req.query && req.query.tenantId) {
    return req.query.tenantId;
  }
  
  // Default tenant if in development
  if (config.server.isDev) {
    return config.getEnv('DEFAULT_TENANT_ID', 'default_tenant');
  }
  
  return null;
};

/**
 * Middleware to check for required roles
 * @param {Object} user - The authenticated user
 * @param {Array} requiredRoles - Array of required roles
 * @returns {boolean} - Whether user has permission
 */
const checkRole = (user, requiredRoles) => {
  if (!user) {
    return false;
  }
  
  if (!requiredRoles || requiredRoles.length === 0) {
    return true; // No specific role required
  }
  
  return requiredRoles.includes(user.role);
};

/**
 * Middleware to check if user is a stylist and belongs to specified tenant
 * @param {Object} user - The authenticated user
 * @param {string} tenantId - The tenant ID to check
 * @param {string} stylist_id - The stylist ID to check
 * @returns {boolean} - Whether user has access
 */
const checkStylistAccess = (user, tenantId, stylist_id) => {
  if (!user) {
    return false;
  }
  
  // System admins and salon admins have full access
  if (user.role === 'system_admin' || (user.role === 'salon_admin' && user.tenantId === tenantId)) {
    return true;
  }
  
  // For stylists, check both tenant and stylist_id
  if (['stylist', 'salon_staff'].includes(user.role)) {
    // Always check tenant
    if (user.tenantId !== tenantId) {
      return false;
    }
    
    // If stylist_id is specified, check that too
    if (stylist_id && user.stylist_id !== stylist_id) {
      return false;
    }
    
    return true;
  }
  
  return false;
};

/**
 * Validate tenant ID is present for operations that require it
 * @param {string|null} tenantId - The tenant ID to validate
 * @param {boolean} required - Whether tenant ID is required
 * @throws {ApolloError} When tenant ID is required but missing
 */
const validateTenantId = (tenantId, required = true) => {
  if (required && !tenantId) {
    throw tenantError('Tenant ID is required for this operation');
  }
  return tenantId;
};

module.exports = {
  authenticateToken,
  extractTenantId,
  checkRole,
  checkStylistAccess,
  validateTenantId
}; 