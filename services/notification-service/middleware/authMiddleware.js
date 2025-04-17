const jwt = require('jsonwebtoken');

// JWT secret should match the one used in the user service
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

/**
 * Extract and verify JWT token from request headers
 * @param {Object} req - Express request object
 * @returns {Object|null} - Decoded user object or null if invalid
 */
const getUser = (req) => {
  try {
    // Get the token from Authorization header
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    // Check for token in cookie as fallback
    const cookieToken = req.cookies && req.cookies.token;
    
    // Use either header token or cookie token
    const userToken = token || cookieToken;
    
    if (!userToken) {
      return null;
    }
    
    // Verify the token
    const decoded = jwt.verify(userToken, JWT_SECRET);
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenantId || 'default'
    };
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
};

/**
 * Middleware to authenticate requests using JWT
 * This adds the user to the request object but doesn't restrict access
 */
const authenticate = (req, res, next) => {
  req.user = getUser(req);
  next();
};

/**
 * Middleware to require authentication
 * Returns 401 if user is not authenticated
 */
const requireAuth = (req, res, next) => {
  const user = getUser(req);
  
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required',
      redirectTo: '/preview-login.html'
    });
  }
  
  req.user = user;
  next();
};

/**
 * Middleware to restrict access to admins
 * Requires either system_admin or salon_admin role
 */
const requireAdmin = (req, res, next) => {
  const user = getUser(req);
  
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required',
      redirectTo: '/preview-login.html'
    });
  }
  
  const adminRoles = ['system_admin', 'salon_admin'];
  if (!adminRoles.includes(user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required'
    });
  }
  
  req.user = user;
  next();
};

/**
 * Middleware to restrict access to specific tenant
 * Allows access only to users belonging to the specified tenant
 * System admins can access any tenant
 */
const requireTenant = (tenantId) => (req, res, next) => {
  const user = getUser(req);
  
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required',
      redirectTo: '/preview-login.html'
    });
  }
  
  // System admins can access any tenant
  if (user.role === 'system_admin') {
    req.user = user;
    return next();
  }
  
  // Check tenant access
  if (user.tenantId !== tenantId) {
    return res.status(403).json({ 
      success: false, 
      message: 'You do not have access to this tenant'
    });
  }
  
  req.user = user;
  next();
};

module.exports = {
  getUser,
  authenticate,
  requireAuth,
  requireAdmin,
  requireTenant
}; 