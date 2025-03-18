const jwt = require('jsonwebtoken');

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

    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    
    // Return the user information from the token
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    // Token verification failed
    console.error('Token verification failed:', error.message);
    return null;
  }
};

module.exports = {
  getUser
}; 