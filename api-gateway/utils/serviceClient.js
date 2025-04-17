/**
 * Service Client for API Gateway
 * 
 * This module provides standardized functions for communicating with microservices
 * while ensuring proper tenant propagation and error handling.
 */

const fetch = require('node-fetch');
const config = require('../config');
const { serviceUnavailableError, handleServiceErrors } = require('./errorHandler');

// Default timeout value for service requests
const DEFAULT_TIMEOUT = 5000;

/**
 * Make a GraphQL request to a microservice with proper tenant propagation
 * 
 * @param {Object} options - Request options
 * @param {string} options.serviceName - Name of the service (for error reporting)
 * @param {string} options.serviceUrl - URL of the service
 * @param {string} options.query - GraphQL query or mutation string
 * @param {Object} options.variables - GraphQL variables (optional)
 * @param {Object} options.context - Request context containing user and tenant info
 * @param {number} options.timeout - Request timeout in milliseconds (optional)
 * @returns {Promise<Object>} - Response data from the service
 */
async function callService({ 
  serviceName, 
  serviceUrl, 
  query, 
  variables = {}, 
  context = {}, 
  timeout = DEFAULT_TIMEOUT 
}) {
  // Get user and authorization from context
  const { user, headers = {} } = context;
  
  // Basic validation
  if (!serviceUrl) {
    throw new Error(`Service URL is required for ${serviceName || 'unknown'} service`);
  }
  
  if (!query) {
    throw new Error('GraphQL query is required');
  }
  
  try {
    // Prepare headers with tenant propagation
    const requestHeaders = {
      'Content-Type': 'application/json',
      // Forward the original authorization header if present
      ...(headers.authorization ? { 'Authorization': headers.authorization } : {}),
    };
    
    // Add tenant ID header if available from user context
    if (user && user.tenantId) {
      requestHeaders['X-Tenant-ID'] = user.tenantId;
    }
    
    // Make the request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Make the request
    const response = await fetch(serviceUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify({ query, variables }),
      signal: controller.signal
    });
    
    // Clear timeout
    clearTimeout(timeoutId);
    
    // Parse the response
    const data = await response.json();
    
    // Handle any GraphQL errors
    const error = handleServiceErrors(data);
    if (error) {
      throw error;
    }
    
    return data.data;
  } catch (error) {
    // Handle timeout errors
    if (error.name === 'AbortError') {
      throw serviceUnavailableError(serviceName, new Error('Request timed out'));
    }
    
    // Handle network or other errors
    if (!error.extensions) {
      throw serviceUnavailableError(serviceName, error);
    }
    
    // If it's already a properly formatted error, just rethrow it
    throw error;
  }
}

/**
 * Convenience method for calling the auth/user service
 */
function callAuthService(options) {
  return callService({
    serviceName: 'Auth Service',
    serviceUrl: config.services.user.url,
    timeout: config.services.user.timeout,
    ...options
  });
}

/**
 * Convenience method for calling the appointment service
 */
function callAppointmentService(options) {
  return callService({
    serviceName: 'Appointment Service',
    serviceUrl: config.services.appointment.url,
    timeout: config.services.appointment.timeout,
    ...options
  });
}

/**
 * Convenience method for calling the notification service
 */
function callNotificationService(options) {
  return callService({
    serviceName: 'Notification Service',
    serviceUrl: config.services.notification.url,
    timeout: config.services.notification.timeout,
    ...options
  });
}

/**
 * Convenience method for calling the payment service
 */
function callPaymentService(options) {
  return callService({
    serviceName: 'Payment Service',
    serviceUrl: config.services.payment.url,
    timeout: config.services.payment.timeout,
    ...options
  });
}

module.exports = {
  callService,
  callAuthService,
  callAppointmentService,
  callNotificationService,
  callPaymentService
}; 