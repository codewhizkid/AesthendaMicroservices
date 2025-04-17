import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

/**
 * Service configuration interface
 */
export interface ServiceConfig {
  name: string;
  port: number;
  environment: string;
  mongoUri: string;
  jwtSecret: string;
  rabbitMQ: {
    url: string;
    queues: {
      notifications: string;
      payments: string;
    };
    exchanges: {
      events: string;
    };
  };
  isDev: boolean;
  isProd: boolean;
  defaultTenantId?: string;
  rateLimiting: {
    windowMs: number;
    max: number;
  };
  cors: {
    origins: string[];
    credentials: boolean;
  };
}

/**
 * Helper function to get environment variables with defaults
 */
const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is required but not set.`);
  }
  return value;
};

/**
 * Helper function to get numeric environment variables
 */
const getNumericEnv = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Helper function to get boolean environment variables
 */
const getBoolEnv = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  return ["true", "1", "yes"].includes(value.toLowerCase());
};

/**
 * Helper function to get array environment variables
 */
const getArrayEnv = (key: string, defaultValue: string[] = []): string[] => {
  const value = process.env[key];
  if (!value) {
    return defaultValue;
  }
  return value.split(",").map((item) => item.trim());
};

// Service configuration
const config: ServiceConfig = {
  name: getEnv("SERVICE_NAME", "appointment-service"),
  port: getNumericEnv("PORT", 5002),
  environment: getEnv("NODE_ENV", "development"),
  mongoUri: getEnv(
    "MONGODB_URI",
    "mongodb://localhost:27017/aesthenda-appointments",
  ),
  jwtSecret: getEnv(
    "JWT_SECRET",
    "your_jwt_secret_key_change_this_in_production",
  ),
  rabbitMQ: {
    url: getEnv("RABBITMQ_URL", "amqp://rabbitmq:5672"),
    queues: {
      notifications: getEnv("RABBITMQ_NOTIFICATION_QUEUE", "appointment_notifications"),
      payments: getEnv("RABBITMQ_PAYMENT_QUEUE", "payment_events")
    },
    exchanges: {
      events: getEnv("RABBITMQ_EVENTS_EXCHANGE", "appointment_events"),
    },
  },
  isDev: getEnv("NODE_ENV", "development") === "development",
  isProd: getEnv("NODE_ENV", "development") === "production",
  defaultTenantId: process.env.DEFAULT_TENANT_ID,
  rateLimiting: {
    windowMs: getNumericEnv("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000), // 15 minutes
    max: getNumericEnv("RATE_LIMIT_MAX", 100), // 100 requests per 15 minutes
  },
  cors: {
    origins: getArrayEnv("CORS_ORIGINS", ["*"]),
    credentials: getBoolEnv("CORS_CREDENTIALS", true),
  },
};

export default config;
