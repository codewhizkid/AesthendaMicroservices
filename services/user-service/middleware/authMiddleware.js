const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Authentication middleware to extract user from JWT token
 * @param {Object} req - The request object
 * @returns {Object|null} - The authenticated user or null
 */
const getUser = (req) => {
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

    // Verify and decode the token using the JWT secret from config
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Return the user information from the token
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenantId || config.getEnv('DEFAULT_TENANT_ID', 'default'),
      stylist_id: decoded.stylist_id // Include stylist_id if present
    };
  } catch (error) {
    // Token verification failed
    console.error('Token verification failed:', error.message);
    return null;
  }
};

/**
 * Middleware to authorize requests by verifying JWT tokens
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next middleware function
 */
const authorize = (req, res, next) => {
  const user = getUser(req);
  req.user = user;
  next();
};

/**
 * Middleware to check if user is a staff member of a specific tenant
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next middleware function
 */
const requireStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const staffRoles = ['stylist', 'salon_staff', 'salon_admin'];
  if (!staffRoles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Staff access required' });
  }

  next();
};

/**
 * Middleware to restrict access based on stylist_id
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next middleware function
 */
const verifyStylistAccess = (req, res, next) => {
  // Skip for admins, they have full access
  if (req.user && (req.user.role === 'system_admin' || req.user.role === 'salon_admin')) {
    return next();
  }

  const requestedStylistId = req.params.stylist_id || req.body.stylist_id;
  
  // If no stylist ID being requested, or user is not a stylist, continue
  if (!requestedStylistId || !req.user.stylist_id) {
    return next();
  }
  
  // Stylist can only access their own data
  if (req.user.stylist_id !== requestedStylistId) {
    return res.status(403).json({ 
      success: false, 
      message: 'Unauthorized: You can only access your own staff data'
    });
  }
  
  next();
};

module.exports = {
  getUser,
  authorize,
  requireStaff,
  verifyStylistAccess
}; 