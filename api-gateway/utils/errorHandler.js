/**
 * Standardized Error Handling for API Gateway
 * 
 * This module provides utility functions for consistent error handling
 * across the API Gateway and when communicating with microservices.
 */

const { ApolloError, AuthenticationError, ForbiddenError, UserInputError } = require('apollo-server');

/**
 * Error types mapping
 */
const ERROR_TYPES = {
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TENANT_REQUIRED: 'TENANT_REQUIRED',
  INTERNAL_SERVER: 'INTERNAL_SERVER_ERROR',
};

/**
 * HTTP status code mapping
 */
const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Format GraphQL errors from services into Apollo errors
 * @param {Object} error - Error object from service response
 * @returns {ApolloError} Properly formatted Apollo error
 */
const formatServiceError = (error) => {
  if (!error) {
    return new ApolloError('Unknown error occurred', ERROR_TYPES.INTERNAL_SERVER);
  }

  const { message, extensions = {} } = error;
  const { code = ERROR_TYPES.INTERNAL_SERVER } = extensions;

  switch (code) {
    case 'UNAUTHENTICATED':
    case ERROR_TYPES.AUTHENTICATION:
      return new AuthenticationError(message);
    
    case 'FORBIDDEN':
    case ERROR_TYPES.AUTHORIZATION:
      return new ForbiddenError(message);
    
    case 'BAD_USER_INPUT':
    case ERROR_TYPES.VALIDATION:
      return new UserInputError(message, { extensions });
    
    case ERROR_TYPES.NOT_FOUND:
      return new ApolloError(message, ERROR_TYPES.NOT_FOUND, extensions);
    
    case ERROR_TYPES.CONFLICT:
      return new ApolloError(message, ERROR_TYPES.CONFLICT, extensions);
    
    case ERROR_TYPES.SERVICE_UNAVAILABLE:
      return new ApolloError(message, ERROR_TYPES.SERVICE_UNAVAILABLE, extensions);
      
    case ERROR_TYPES.TENANT_REQUIRED:
      return new ApolloError(message, ERROR_TYPES.TENANT_REQUIRED, extensions);
    
    default:
      return new ApolloError(message, code, extensions);
  }
};

/**
 * Formats errors from microservice GraphQL responses
 * @param {Object} serviceResponse - The response from the microservice
 * @returns {ApolloError|null} The formatted error or null if no error
 */
const handleServiceErrors = (serviceResponse) => {
  if (!serviceResponse) {
    return new ApolloError('No response from service', ERROR_TYPES.SERVICE_UNAVAILABLE);
  }
  
  if (serviceResponse.errors && serviceResponse.errors.length > 0) {
    return formatServiceError(serviceResponse.errors[0]);
  }
  
  return null;
};

/**
 * Creates a standardized error for when a microservice is unavailable
 * @param {string} serviceName - The name of the service that is unavailable
 * @param {Error} originalError - The original error that occurred
 * @returns {ApolloError} A formatted Apollo error
 */
const serviceUnavailableError = (serviceName, originalError) => {
  console.error(`Service unavailable: ${serviceName}`, originalError);
  return new ApolloError(
    `The ${serviceName} service is currently unavailable. Please try again later.`,
    ERROR_TYPES.SERVICE_UNAVAILABLE,
    { originalError: originalError.message }
  );
};

/**
 * Creates a validation error for tenant related issues
 * @param {string} message - The error message
 * @returns {ApolloError} A formatted Apollo error
 */
const tenantError = (message = 'Tenant ID is required') => {
  return new ApolloError(message, ERROR_TYPES.TENANT_REQUIRED);
};

module.exports = {
  ERROR_TYPES,
  HTTP_STATUS,
  formatServiceError,
  handleServiceErrors,
  serviceUnavailableError,
  tenantError
}; 