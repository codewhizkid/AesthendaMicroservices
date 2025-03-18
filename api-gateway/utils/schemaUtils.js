const { mergeSchemas } = require('graphql-tools');

/**
 * Merge remote schemas with local schema
 * @param {Object} localSchema - The local schema
 * @param {Array} remoteSchemas - Array of remote service schemas
 * @returns {Object} - The merged schema
 */
const stitchSchemas = (localSchema, remoteSchemas) => {
  // Filter out any null or undefined schemas
  const validSchemas = [localSchema, ...remoteSchemas].filter(Boolean);

  // Merge schemas
  return mergeSchemas({
    schemas: validSchemas
  });
};

/**
 * Handle authentication and role-based permissions for services
 * @param {Object} user - The authenticated user from JWT
 * @param {String} serviceName - The name of the service being accessed
 * @param {Array} requiredRoles - Required roles to access this service
 * @returns {Boolean} - Whether access is allowed
 */
const checkServiceAccess = (user, serviceName, requiredRoles) => {
  // Define service-level access control rules
  const serviceRules = {
    'user-service': ['client', 'stylist', 'admin'],
    'appointment-service': ['client', 'stylist', 'admin'],
    'payment-service': ['client', 'stylist', 'admin'],
    'notification-service': ['admin'] // Only admins can directly access notification service
  };

  // If specific roles are provided, use them, otherwise use the service defaults
  const roles = requiredRoles || serviceRules[serviceName] || [];
  
  // If no roles are defined, allow access
  if (roles.length === 0) {
    return true;
  }
  
  // Check if user is authenticated
  if (!user) {
    return false;
  }
  
  // Check if user has the required role
  return roles.includes(user.role);
};

module.exports = {
  stitchSchemas,
  checkServiceAccess
}; 