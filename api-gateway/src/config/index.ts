/**
 * Centralized Configuration Module for API Gateway
 *
 * This module loads and validates environment variables for the API Gateway.
 * It provides a unified interface for accessing configuration values throughout the service.
 */

import dotenv from "dotenv";
import path from "path";
import { Config } from "../types";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

/**
 * Get a required environment variable. Throws an error if the variable is not defined.
 * @param {string} key - The environment variable name
 * @param {string} defaultValue - Optional default value if not set in environment
 * @returns {string} The environment variable value
 */
const getEnv = (key: string, defaultValue?: string): string => {
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
const getIntEnv = (key: string, defaultValue: number): number => {
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
const getBoolEnv = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  return ["true", "1", "yes"].includes(value.toLowerCase());
};

// Server configuration
const server = {
  port: getIntEnv("PORT", 5000),
  env: getEnv("NODE_ENV", "development"),
  isDev: getEnv("NODE_ENV", "development") === "development",
  isProd: getEnv("NODE_ENV", "development") === "production",
  corsOrigins: getEnv("CORS_ORIGINS", "*").split(","),
  bodyLimit: getEnv("BODY_LIMIT", "100kb"),
};

// JWT configuration
const jwt = {
  secret: getEnv("JWT_SECRET", "your_jwt_secret_key"),
  expiresIn: getEnv("JWT_EXPIRES_IN", "7d"),
};

// Redis configuration for caching and rate limiting
const redis = {
  url: getEnv("REDIS_URL", "redis://redis:6379"),
  ttl: getIntEnv("REDIS_CACHE_TTL", 60 * 60), // 1 hour in seconds
};

// Rate limiting configuration
const rateLimit = {
  windowMs: getIntEnv("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000), // 15 minutes
  max: getIntEnv("RATE_LIMIT_MAX", 100), // limit each IP to 100 requests per windowMs
};

// Service endpoints
const services = {
  user: {
    url: getEnv("USER_SERVICE_URL", "http://user-service:5001"),
    timeout: getIntEnv("USER_SERVICE_TIMEOUT", 5000),
  },
  appointment: {
    url: getEnv("APPOINTMENT_SERVICE_URL", "http://appointment-service-ts:5002"),
    timeout: getIntEnv("APPOINTMENT_SERVICE_TIMEOUT", 5000),
  },
  notification: {
    url: getEnv("NOTIFICATION_SERVICE_URL", "http://notification-service:5003"),
    timeout: getIntEnv("NOTIFICATION_SERVICE_TIMEOUT", 5000),
  },
  payment: {
    url: getEnv("PAYMENT_SERVICE_URL", "http://payment-service:5004"),
    timeout: getIntEnv("PAYMENT_SERVICE_TIMEOUT", 5000),
  },
};

// Multi-tenant configuration
const tenant = {
  defaultTenantId: process.env.DEFAULT_TENANT_ID,
};

// Apollo GraphQL configuration
const graphql = {
  introspection: getBoolEnv("GRAPHQL_INTROSPECTION", true),
  playground: getBoolEnv("GRAPHQL_PLAYGROUND", true),
  debug: getBoolEnv("GRAPHQL_DEBUG", true),
  tracing: getBoolEnv("GRAPHQL_TRACING", false),
};

// Export configuration
const config: Config = {
  server,
  jwt,
  redis,
  rateLimit,
  services,
  graphql,
  tenant,
  // Utility functions
  getEnv,
  getIntEnv,
  getBoolEnv,
};

export default config;
