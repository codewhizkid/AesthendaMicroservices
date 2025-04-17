"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_express_1 = require("apollo-server-express");
const apollo_server_core_1 = require("apollo-server-core");
const apollo_server_1 = require("apollo-server");
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("./middleware/authMiddleware");
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_facebook_1 = require("passport-facebook");
const express_session_1 = __importDefault(require("express-session"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const ioredis_1 = __importDefault(require("ioredis"));
const rateLimitRedis = __importStar(require("rate-limit-redis"));
const config_1 = __importDefault(require("./config"));
const types_1 = require("./types");
const serviceClient_1 = require("./utils/serviceClient");
// Initialize Redis client
const redisClient = new ioredis_1.default(config_1.default.redis.url);
redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});
redisClient.on('connect', () => {
    console.log('Connected to Redis successfully');
});
// Initialize express app
const app = (0, express_1.default)();
// Define a local schema for the gateway
const typeDefs = (0, apollo_server_1.gql) `
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
  }

  type AuthResponse {
    token: String!
    refreshToken: String!
    user: User!
  }

  type RefreshTokenResponse {
    token: String!
    success: Boolean!
  }

  type PasswordResetResponse {
    success: Boolean!
    message: String
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
    role: String
    tenantId: String
  }

  type Query {
    gatewayHealth: String
    me: User
    verifyResetToken(token: String!): PasswordResetResponse
  }

  type Mutation {
    register(input: RegisterInput!): AuthResponse
    login(email: String!, password: String!, tenantId: String!): AuthResponse
    refreshToken(refreshToken: String!): RefreshTokenResponse
    logout(refreshToken: String!): Boolean
    logoutAll: Boolean
    requestPasswordReset(email: String!): PasswordResetResponse
    resetPassword(token: String!, newPassword: String!): PasswordResetResponse
    verifyEmail(token: String!): PasswordResetResponse
    resendVerification(email: String!): PasswordResetResponse
  }
`;
// CORS configuration
const corsOptions = {
    origin: config_1.default.server.corsOrigins,
    credentials: true
};
// Set up middleware
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, helmet_1.default)()); // Add security headers
// Configure session middleware
app.use((0, express_session_1.default)({
    secret: config_1.default.jwt.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: config_1.default.server.isProd,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
// Create a sendCommand function compatible with the RedisStore
const sendCommand = async (command, ...args) => {
    return redisClient.call(command, ...args);
};
// Create a compatible Redis store for rate limiting
const createRedisStore = (prefix) => {
    return new rateLimitRedis.default({
        sendCommand,
        prefix
    });
};
// Setup global rate limiting middleware
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.default.rateLimit.windowMs,
    max: config_1.default.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('global_rl:'),
    message: {
        status: 429,
        message: 'Too many requests, please try again later.'
    }
});
// Setup stricter rate limiting for authentication endpoints
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 login/registration attempts per hour
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('auth_rl:'),
    message: {
        status: 429,
        message: 'Too many authentication attempts, please try again after an hour.'
    },
    // Helper function to determine if request should be counted
    skip: (req) => {
        // Only count if it's an authentication operation
        if (!req.body || !req.body.query)
            return true;
        const query = req.body.query.toLowerCase();
        return !(query.includes('mutation') &&
            (query.includes('login') || query.includes('register')));
    }
});
// Initialize Passport
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Passport serialize/deserialize user
passport_1.default.serializeUser((user, done) => {
    done(null, user);
});
passport_1.default.deserializeUser((user, done) => {
    done(null, user);
});
// Configure OAuth strategies
const setupOAuthStrategies = () => {
    // Google strategy
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: config_1.default.getEnv('GOOGLE_CLIENT_ID', 'your_google_client_id'),
        clientSecret: config_1.default.getEnv('GOOGLE_CLIENT_SECRET', 'your_google_client_secret'),
        callbackURL: '/auth/google/callback',
        scope: ['profile', 'email']
    }, (accessToken, _refreshToken, profile, done) => {
        // We're just passing the profile and tokens to the callback route handler
        done(null, {
            provider: 'google',
            token: accessToken,
            profile
        });
    }));
    // Facebook strategy
    passport_1.default.use(new passport_facebook_1.Strategy({
        clientID: config_1.default.getEnv('FACEBOOK_APP_ID', 'your_facebook_app_id'),
        clientSecret: config_1.default.getEnv('FACEBOOK_APP_SECRET', 'your_facebook_app_secret'),
        callbackURL: '/auth/facebook/callback',
        profileFields: ['id', 'displayName', 'email', 'picture']
    }, (accessToken, _refreshToken, profile, done) => {
        // We're just passing the profile and tokens to the callback route handler
        done(null, {
            provider: 'facebook',
            token: accessToken,
            profile
        });
    }));
};
setupOAuthStrategies();
// Apply global rate limiter to all requests
app.use(globalLimiter);
// Apply auth rate limiter to GraphQL endpoint
app.use('/graphql', authLimiter);
// Helper function to process OAuth login through user service
async function processOAuthLogin(provider, token, profile) {
    try {
        const userClient = (0, serviceClient_1.createUserServiceClient)();
        const result = await userClient.oauthLogin(provider, token, profile);
        return result.oauthLogin;
    }
    catch (error) {
        console.error('OAuth login error:', error);
        throw error;
    }
}
// Type-safe filter for removing undefined values from an array
function nonNullable(value) {
    return value !== null && value !== undefined;
}
// OAuth routes
// Google Auth Routes
app.get('/auth/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport_1.default.authenticate('google', { failureRedirect: '/login', session: false }), async (req, res) => {
    try {
        // Process OAuth login through the user service
        const { provider, token, profile } = req.user;
        // Call the user service to login or create account
        const result = await processOAuthLogin(provider, token, profile);
        // Redirect to frontend with tokens
        const frontendURL = config_1.default.getEnv('FRONTEND_URL', 'http://localhost:3000');
        const redirectUrl = `${frontendURL}/auth-callback?token=${result.token}&refreshToken=${result.refreshToken}`;
        res.redirect(redirectUrl);
    }
    catch (error) {
        console.error('OAuth callback error:', error);
        const frontendURL = config_1.default.getEnv('FRONTEND_URL', 'http://localhost:3000');
        res.redirect(`${frontendURL}/login?error=oauth_failed`);
    }
});
// Facebook Auth Routes
app.get('/auth/facebook', passport_1.default.authenticate('facebook', { scope: ['email'] }));
app.get('/auth/facebook/callback', passport_1.default.authenticate('facebook', { failureRedirect: '/login', session: false }), async (req, res) => {
    try {
        // Process OAuth login through the user service
        const { provider, token, profile } = req.user;
        // Call the user service to login or create account
        const result = await processOAuthLogin(provider, token, profile);
        // Redirect to frontend with tokens
        const frontendURL = config_1.default.getEnv('FRONTEND_URL', 'http://localhost:3000');
        const redirectUrl = `${frontendURL}/auth-callback?token=${result.token}&refreshToken=${result.refreshToken}`;
        res.redirect(redirectUrl);
    }
    catch (error) {
        console.error('OAuth callback error:', error);
        const frontendURL = config_1.default.getEnv('FRONTEND_URL', 'http://localhost:3000');
        res.redirect(`${frontendURL}/login?error=oauth_failed`);
    }
});
// Create resolvers that forward requests to the user service
const resolvers = {
    Query: {
        gatewayHealth: () => "API Gateway is operational!",
        me: async (_, __, context) => {
            if (!context.user) {
                throw new types_1.ServiceError('Not authenticated', { code: 'UNAUTHENTICATED' });
            }
            try {
                const userClient = (0, serviceClient_1.createUserServiceClient)({
                    'Authorization': context.headers.authorization || '',
                    'X-Tenant-ID': context.user.tenantId
                });
                const result = await userClient.me();
                return result.me;
            }
            catch (error) {
                console.error('Error fetching user profile:', error);
                throw new types_1.ServiceError('Failed to fetch user profile', {
                    code: 'USER_FETCH_ERROR',
                    service: 'user'
                });
            }
        },
        verifyResetToken: async (_, { token }) => {
            try {
                const userClient = (0, serviceClient_1.createUserServiceClient)();
                const result = await userClient.verifyResetToken(token);
                return result.verifyResetToken;
            }
            catch (error) {
                console.error('Error verifying reset token:', error);
                throw new types_1.ServiceError('Failed to verify reset token', {
                    code: 'RESET_TOKEN_ERROR',
                    service: 'user'
                });
            }
        }
    },
    Mutation: {
        register: async (_, { input }, context) => {
            try {
                const userClient = (0, serviceClient_1.createUserServiceClient)(context.headers);
                const result = await userClient.register(input);
                return result.register;
            }
            catch (error) {
                console.error('Error registering user:', error);
                if (error instanceof types_1.ServiceError) {
                    throw error;
                }
                throw new types_1.ServiceError('Failed to register user', {
                    code: 'REGISTRATION_ERROR',
                    service: 'user'
                });
            }
        },
        login: async (_, { email, password, tenantId }, context) => {
            try {
                const userClient = (0, serviceClient_1.createUserServiceClient)(context.headers);
                const result = await userClient.login(email, password, tenantId);
                return result.login;
            }
            catch (error) {
                console.error('Error logging in:', error);
                if (error instanceof types_1.ServiceError) {
                    throw error;
                }
                throw new types_1.ServiceError('Failed to login', {
                    code: 'LOGIN_ERROR',
                    service: 'user'
                });
            }
        },
        refreshToken: async (_, { refreshToken }, context) => {
            try {
                const userClient = (0, serviceClient_1.createUserServiceClient)({
                    ...context.headers,
                    'X-Tenant-ID': context.headers['x-tenant-id'] || ''
                });
                const result = await userClient.refreshToken(refreshToken);
                return result.refreshToken;
            }
            catch (error) {
                console.error('Error refreshing token:', error);
                if (error instanceof types_1.ServiceError) {
                    throw error;
                }
                throw new types_1.ServiceError('Failed to refresh token', {
                    code: 'TOKEN_REFRESH_ERROR',
                    service: 'user'
                });
            }
        },
        logout: async (_, { refreshToken }, context) => {
            if (!context.user) {
                throw new types_1.ServiceError('Not authenticated', { code: 'UNAUTHENTICATED' });
            }
            try {
                const userClient = (0, serviceClient_1.createUserServiceClient)({
                    'Authorization': context.headers.authorization || '',
                    'X-Tenant-ID': context.user.tenantId
                });
                const result = await userClient.logout(refreshToken);
                return result.logout;
            }
            catch (error) {
                console.error('Error logging out:', error);
                if (error instanceof types_1.ServiceError) {
                    throw error;
                }
                throw new types_1.ServiceError('Failed to logout', {
                    code: 'LOGOUT_ERROR',
                    service: 'user'
                });
            }
        },
        logoutAll: async (_, __, context) => {
            if (!context.user) {
                throw new types_1.ServiceError('Not authenticated', { code: 'UNAUTHENTICATED' });
            }
            try {
                const userClient = (0, serviceClient_1.createUserServiceClient)({
                    'Authorization': context.headers.authorization || '',
                    'X-Tenant-ID': context.user.tenantId
                });
                const result = await userClient.logoutAll();
                return result.logoutAll;
            }
            catch (error) {
                console.error('Error logging out from all devices:', error);
                if (error instanceof types_1.ServiceError) {
                    throw error;
                }
                throw new types_1.ServiceError('Failed to logout from all devices', {
                    code: 'LOGOUT_ALL_ERROR',
                    service: 'user'
                });
            }
        },
        requestPasswordReset: async (_, { email }) => {
            try {
                const userClient = (0, serviceClient_1.createUserServiceClient)();
                const result = await userClient.requestPasswordReset(email);
                return result.requestPasswordReset;
            }
            catch (error) {
                console.error('Error requesting password reset:', error);
                if (error instanceof types_1.ServiceError) {
                    throw error;
                }
                throw new types_1.ServiceError('Failed to request password reset', {
                    code: 'PASSWORD_RESET_REQUEST_ERROR',
                    service: 'user'
                });
            }
        },
        resetPassword: async (_, { token, newPassword }) => {
            try {
                const userClient = (0, serviceClient_1.createUserServiceClient)();
                const result = await userClient.resetPassword(token, newPassword);
                return result.resetPassword;
            }
            catch (error) {
                console.error('Error resetting password:', error);
                if (error instanceof types_1.ServiceError) {
                    throw error;
                }
                throw new types_1.ServiceError('Failed to reset password', {
                    code: 'PASSWORD_RESET_ERROR',
                    service: 'user'
                });
            }
        },
        verifyEmail: async (_, { token }) => {
            try {
                const userClient = (0, serviceClient_1.createUserServiceClient)();
                const result = await userClient.verifyEmail(token);
                return result.verifyEmail;
            }
            catch (error) {
                console.error('Error verifying email:', error);
                if (error instanceof types_1.ServiceError) {
                    throw error;
                }
                throw new types_1.ServiceError('Failed to verify email', {
                    code: 'EMAIL_VERIFY_ERROR',
                    service: 'user'
                });
            }
        },
        resendVerification: async (_, { email }) => {
            try {
                const userClient = (0, serviceClient_1.createUserServiceClient)();
                const result = await userClient.resendVerification(email);
                return result.resendVerification;
            }
            catch (error) {
                console.error('Error resending verification email:', error);
                if (error instanceof types_1.ServiceError) {
                    throw error;
                }
                throw new types_1.ServiceError('Failed to resend verification email', {
                    code: 'VERIFICATION_RESEND_ERROR',
                    service: 'user'
                });
            }
        }
    }
};
// Initialize Apollo Server with the v3 constructor
const server = new apollo_server_express_1.ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
        // Get authenticated user from token
        const user = (0, authMiddleware_1.authenticateToken)(req);
        return {
            user,
            headers: req.headers
        };
    },
    formatError: (err) => {
        var _a;
        // Log errors for debugging
        console.error('GraphQL Error:', err);
        // Return formatted error to client
        return {
            message: err.message,
            code: ((_a = err.extensions) === null || _a === void 0 ? void 0 : _a.code) || 'SERVER_ERROR',
            path: err.path
        };
    },
    plugins: [
        // Use proper apollo server plugins
        config_1.default.graphql.playground ?
            (0, apollo_server_core_1.ApolloServerPluginLandingPageGraphQLPlayground)() :
            (0, apollo_server_core_1.ApolloServerPluginLandingPageDisabled)(),
        config_1.default.graphql.tracing ?
            (0, apollo_server_core_1.ApolloServerPluginInlineTrace)() :
            undefined
    ].filter(nonNullable)
});
// Store Apollo server path for use in the logs
let graphqlPath = '/graphql';
// Start the Apollo Server
async function startServer() {
    // Start the server without waiting for Redis connection
    // Redis connection will be attempted but won't block server startup
    redisClient.on('connect', () => {
        console.log('Connected to Redis successfully');
    });
    // Start the Apollo server as required in v3
    await server.start();
    // Apply middleware to Express
    const serverMiddleware = server.applyMiddleware({
        app, // Type assertion is handled by our declarations file
        path: '/graphql',
        cors: corsOptions
    });
    // Store the graphql path for logging
    graphqlPath = serverMiddleware.path;
    // Basic routes
    app.get('/', (_, res) => {
        res.send('Welcome to Aesthenda API Gateway');
    });
    app.get('/health', (_, res) => {
        res.status(200).json({ status: 'healthy' });
    });
    // Start the server
    const PORT = config_1.default.server.port;
    app.listen(PORT, () => {
        console.log(`🚀 API Gateway ready with authentication at http://localhost:${PORT}${graphqlPath}`);
        console.log(`OAuth endpoints available at http://localhost:${PORT}/auth/google and http://localhost:${PORT}/auth/facebook`);
        console.log(`Rate limiting enabled with Redis at ${config_1.default.redis.url}`);
        console.log(`CORS enabled for: ${config_1.default.server.corsOrigins.join(', ')}`);
    });
}
startServer().catch((error) => {
    console.error('Error starting server:', error);
    process.exit(1);
});
