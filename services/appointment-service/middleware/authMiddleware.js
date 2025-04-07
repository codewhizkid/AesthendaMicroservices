const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware
 * Verifies JWT tokens from request headers and attaches user data to req.user
 */
const authMiddleware = (req, res, next) => {
  // For demo purposes: Skip auth check if in development mode
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
    req.user = { 
      id: 'mock-user-id',
      role: 'admin'
    };
    return next();
  }

  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'No authentication token, access denied' 
    });
  }

  try {
    // Verify token
    const jwtSecret = process.env.JWT_SECRET || 'aesthenda-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
    
    // Add user data to request
    req.user = decoded.user;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    res.status(401).json({ 
      success: false, 
      error: 'Token is not valid' 
    });
  }
};

module.exports = authMiddleware; 