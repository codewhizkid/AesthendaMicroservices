"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMessages = exports.constants = exports.config = exports.featureFlags = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Configuration schema using Zod for validation
const configSchema = zod_1.z.object({
    PORT: zod_1.z.string().transform(Number).default('4000'),
    MONGODB_URI: zod_1.z.string().url(),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    JWT_SECRET: zod_1.z.string().min(32),
    RABBITMQ_URL: zod_1.z.string().url(),
    REDIS_URL: zod_1.z.string().url(),
    CORS_ORIGIN: zod_1.z.string().url(),
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().transform(Number).default('900000'),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.string().transform(Number).default('100'),
});
// Feature flags configuration
exports.featureFlags = {
    ENABLE_REAL_TIME_UPDATES: true,
    ENABLE_RESOURCE_SCHEDULING: true,
    ENABLE_BUSINESS_HOURS: true,
    ENABLE_BLOCKOUTS: true,
    ENABLE_RECURRING_EVENTS: true,
};
// Validate environment variables
const envConfig = configSchema.parse(process.env);
// Export typed configuration
exports.config = {
    port: envConfig.PORT,
    mongodbUri: envConfig.MONGODB_URI,
    nodeEnv: envConfig.NODE_ENV,
    jwtSecret: envConfig.JWT_SECRET,
    rabbitmqUrl: envConfig.RABBITMQ_URL,
    redisUrl: envConfig.REDIS_URL,
    corsOrigin: envConfig.CORS_ORIGIN,
    rateLimitWindowMs: envConfig.RATE_LIMIT_WINDOW_MS,
    rateLimitMaxRequests: envConfig.RATE_LIMIT_MAX_REQUESTS,
    isProduction: envConfig.NODE_ENV === 'production',
    isDevelopment: envConfig.NODE_ENV === 'development',
    isTest: envConfig.NODE_ENV === 'test',
};
// Constants
exports.constants = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    TOKEN_EXPIRY: '24h',
    REFRESH_TOKEN_EXPIRY: '7d',
    MIN_PASSWORD_LENGTH: 8,
};
// Error messages
exports.errorMessages = {
    UNAUTHORIZED: 'You are not authorized to perform this action',
    FORBIDDEN: 'Access forbidden',
    NOT_FOUND: 'Resource not found',
    INVALID_INPUT: 'Invalid input provided',
    INTERNAL_ERROR: 'Internal server error occurred',
    TENANT_REQUIRED: 'Tenant ID is required',
};
//# sourceMappingURL=index.js.map