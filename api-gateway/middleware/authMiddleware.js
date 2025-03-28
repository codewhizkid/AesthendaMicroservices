const jwt = require('jsonwebtoken');
const config = require('../config');

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
      id: decoded.id,
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

// Middleware to check for required roles
const checkRole = (user, requiredRoles) => {
  if (!user) {
    return false;
  }
  
  if (!requiredRoles || requiredRoles.length === 0) {
    return true; // No specific role required
  }
  
  return requiredRoles.includes(user.role);
};

// Middleware to check if user is a stylist and belongs to specified tenant
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

module.exports = {
  authenticateToken,
  checkRole,
  checkStylistAccess
}; 