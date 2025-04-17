import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Define configuration schema with defaults and validation
const config = {
  // Server configuration
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5005,
    env: process.env.NODE_ENV || 'development',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
  
  // Database configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/calendar',
    options: {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    }
  },
  
  // Authentication configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'default-dev-secret', // Only use default in development
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  
  // Tenant configuration
  tenant: {
    defaultTenantId: process.env.DEFAULT_TENANT_ID || 'tenant-1',
  },
  
  // Error messages
  errorMessages: {
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    BAD_REQUEST: 'Invalid request parameters',
    INTERNAL_ERROR: 'Internal server error',
    VALIDATION_ERROR: 'Validation error',
  }
};

// Validate critical configuration
if (config.server.env === 'production') {
  if (config.auth.jwtSecret === 'default-dev-secret') {
    throw new Error('JWT_SECRET must be set in production environment');
  }
}

// Export configurations
export const errorMessages = config.errorMessages;
export const serverConfig = config.server;
export const dbConfig = config.database;
export const authConfig = config.auth;
export const tenantConfig = config.tenant;

// Export the entire config object by default
export default config; 