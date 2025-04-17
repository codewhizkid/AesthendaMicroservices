import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Configuration schema using Zod for validation
const configSchema = z.object({
  PORT: z.string().transform(Number).default('4000'),
  MONGODB_URI: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(32),
  RABBITMQ_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  CORS_ORIGIN: z.string().url(),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
});

// Feature flags configuration
export const featureFlags = {
  ENABLE_REAL_TIME_UPDATES: true,
  ENABLE_RESOURCE_SCHEDULING: true,
  ENABLE_BUSINESS_HOURS: true,
  ENABLE_BLOCKOUTS: true,
  ENABLE_RECURRING_EVENTS: true,
};

// Validate environment variables
const envConfig = configSchema.safeParse(process.env);

// Process config validation result
if (!envConfig.success) {
  console.error('❌ Invalid configuration:', envConfig.error.format());
  throw new Error('Invalid configuration');
}

// Export typed configuration
export const config = {
  server: {
    port: envConfig.data.PORT,
    corsOrigins: envConfig.data.CORS_ORIGIN.split(','),
  },
  database: {
    uri: envConfig.data.MONGODB_URI,
  },
  auth: {
    jwtSecret: envConfig.data.JWT_SECRET,
  },
  messaging: {
    rabbitmqUrl: envConfig.data.RABBITMQ_URL,
    redisUrl: envConfig.data.REDIS_URL,
  },
  rateLimit: {
    windowMs: envConfig.data.RATE_LIMIT_WINDOW_MS,
    maxRequests: envConfig.data.RATE_LIMIT_MAX_REQUESTS,
  },
  env: {
    nodeEnv: envConfig.data.NODE_ENV,
    isProduction: envConfig.data.NODE_ENV === 'production',
    isDevelopment: envConfig.data.NODE_ENV === 'development',
    isTest: envConfig.data.NODE_ENV === 'test',
  },
  tenant: {
    defaultTenantId: 'default-tenant-id',
  },
};

// Constants
export const constants = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  TOKEN_EXPIRY: '24h',
  REFRESH_TOKEN_EXPIRY: '7d',
  MIN_PASSWORD_LENGTH: 8,
};

// Error messages
export const errorMessages = {
  UNAUTHORIZED: 'You are not authorized to perform this action',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  INVALID_INPUT: 'Invalid input provided',
  INTERNAL_ERROR: 'Internal server error occurred',
  TENANT_REQUIRED: 'Tenant ID is required',
};

// Export configuration types
export type Config = typeof config;
export type FeatureFlags = typeof featureFlags;
export type Constants = typeof constants;

// Create a default export with all configuration combined
const appConfig = {
  ...config,
  constants,
  featureFlags,
  errorMessages,
};

export default appConfig; 