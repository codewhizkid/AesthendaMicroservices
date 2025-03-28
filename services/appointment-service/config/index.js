/**
 * Centralized Configuration Module for Appointment Service
 * 
 * This module loads and validates environment variables for the Appointment Service.
 * It provides a unified interface for accessing configuration values throughout the service.
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Get a required environment variable. Throws an error if the variable is not defined.
 * @param {string} key - The environment variable name
 * @param {string} defaultValue - Optional default value if not set in environment
 * @returns {string} The environment variable value
 */
const getEnv = (key, defaultValue = undefined) => {
  const value = process.env[key] || defaultValue;
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is required but not set.`);
  }
  return value;
};

/**
 * Get an integer environment variable.
 * @param {string} key - The environment variable name
 * @param {number} defaultValue - Default value if not set or not a valid integer
 * @returns {number} The environment variable as an integer
 */
const getIntEnv = (key, defaultValue) => {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  const parsedValue = parseInt(value, 10);
  return isNaN(parsedValue) ? defaultValue : parsedValue;
};

/**
 * Get a boolean environment variable.
 * @param {string} key - The environment variable name
 * @param {boolean} defaultValue - Default value if not set
 * @returns {boolean} The environment variable as a boolean
 */
const getBoolEnv = (key, defaultValue) => {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  return ['true', '1', 'yes'].includes(value.toLowerCase());
};

// Server configuration
const server = {
  port: getIntEnv('PORT', 5002),
  env: getEnv('NODE_ENV', 'development'),
  isDev: getEnv('NODE_ENV', 'development') === 'development',
  isProd: getEnv('NODE_ENV', 'development') === 'production',
};

// MongoDB configuration
const mongodb = {
  uri: getEnv('MONGODB_URI', 'mongodb://mongo-appointment:27017/appointmentdb'),
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
};

// RabbitMQ configuration
const rabbitmq = {
  uri: getEnv('RABBITMQ_URI', 'amqp://rabbitmq:5672'),
  queues: {
    notifications: getEnv('RABBITMQ_NOTIFICATIONS_QUEUE', 'appointment_notifications'),
  },
};

// Export configuration
module.exports = {
  server,
  mongodb,
  rabbitmq,
  // Utility functions
  getEnv,
  getIntEnv,
  getBoolEnv,
}; 