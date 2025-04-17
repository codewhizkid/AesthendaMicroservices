const { ApolloServer } = require('apollo-server-express');
const { gql } = require('apollo-server');
const express = require('express');
const { authenticateToken, extractTenantId, validateTenantId } = require('./middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');
const RedisStore = require('rate-limit-redis').default;
const roleRoutes = require('./roleRoutes');
const config = require('./config');
const { callAuthService, callAppointmentService, callNotificationService, callPaymentService } = require('./utils/serviceClient');
const { serviceUnavailableError, handleServiceErrors } = require('./utils/errorHandler');

// Initialize Redis client
const redisClient = new Redis(config.redis.url);

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis successfully');
});

// Initialize express app
const app = express();

// Define a local schema for the gateway
const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    tenantId: ID!
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
    tenantId: ID
  }

  type Query {
    gatewayHealth: String
    me: User
    verifyResetToken(token: String!): PasswordResetResponse
  }

  type Mutation {
    register(input: RegisterInput!): AuthResponse
    login(email: String!, password: String!, tenantId: ID): AuthResponse
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
  origin: config.server.corsOrigins,
  credentials: true
};

// Set up middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(helmet()); // Add security headers

// Configure session middleware
app.use(session({
  secret: config.jwt.secret,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: config.server.isProd,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Setup global rate limiting middleware
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (command, ...args) => redisClient.send_command(command, ...args),
    prefix: 'global_rl:'
  }),
  message: {
    status: 429,
    message: 'Too many requests, please try again later.'
  }
});

// Setup stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 login/registration attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (command, ...args) => redisClient.send_command(command, ...args),
    prefix: 'auth_rl:'
  }),
  message: {
    status: 429,
    message: 'Too many authentication attempts, please try again after an hour.'
  },
  // Helper function to determine if request should be counted
  skip: (req, res) => {
    // Only count if it's an authentication operation
    if (!req.body || !req.body.query) return true;
    
    const query = req.body.query.toLowerCase();
    return !(
      query.includes('mutation') && 
      (query.includes('login') || query.includes('register'))
    );
  }
});

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport serialize/deserialize user
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Configure OAuth strategies
const setupOAuthStrategies = () => {
  // Google strategy
  passport.use(new GoogleStrategy({
    clientID: config.getEnv('GOOGLE_CLIENT_ID', 'your_google_client_id'),
    clientSecret: config.getEnv('GOOGLE_CLIENT_SECRET', 'your_google_client_secret'),
    callbackURL: '/auth/google/callback',
    scope: ['profile', 'email']
  }, (accessToken, refreshToken, profile, done) => {
    // We're just passing the profile and tokens to the callback route handler
    done(null, { 
      provider: 'google',
      token: accessToken,
      profile
    });
  }));

  // Facebook strategy
  passport.use(new FacebookStrategy({
    clientID: config.getEnv('FACEBOOK_APP_ID', 'your_facebook_app_id'),
    clientSecret: config.getEnv('FACEBOOK_APP_SECRET', 'your_facebook_app_secret'),
    callbackURL: '/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'email', 'picture']
  }, (accessToken, refreshToken, profile, done) => {
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

// OAuth routes
// Google Auth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  async (req, res) => {
    try {
      // Process OAuth login through the user service
      const { provider, token, profile } = req.user;
      
      // Call the user service to login or create account
      const result = await processOAuthLogin(provider, token, profile);
      
      // Redirect to frontend with tokens
      const frontendURL = config.getEnv('FRONTEND_URL', 'http://localhost:3000');
      const redirectUrl = `${frontendURL}/auth-callback?token=${result.token}&refreshToken=${result.refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('OAuth callback error:', error);
      const frontendURL = config.getEnv('FRONTEND_URL', 'http://localhost:3000');
      res.redirect(`${frontendURL}/login?error=oauth_failed`);
    }
  }
);

// Facebook Auth Routes
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login', session: false }),
  async (req, res) => {
    try {
      // Process OAuth login through the user service
      const { provider, token, profile } = req.user;
      
      // Call the user service to login or create account
      const result = await processOAuthLogin(provider, token, profile);
      
      // Redirect to frontend with tokens
      const frontendURL = config.getEnv('FRONTEND_URL', 'http://localhost:3000');
      const redirectUrl = `${frontendURL}/auth-callback?token=${result.token}&refreshToken=${result.refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('OAuth callback error:', error);
      const frontendURL = config.getEnv('FRONTEND_URL', 'http://localhost:3000');
      res.redirect(`${frontendURL}/login?error=oauth_failed`);
    }
  }
);

// Helper function to process OAuth login through user service
async function processOAuthLogin(provider, token, profile) {
  try {
    const query = `
      mutation {
        oauthLogin(input: {
          provider: ${provider.toUpperCase()},
          token: "${token}",
          profile: ${JSON.stringify(JSON.stringify(profile))}
        }) {
          token
          refreshToken
          user {
            id
            name
            email
            role
          }
        }
      }
    `;

    const data = await callAuthService({
      query,
      context: { headers: {} } // No auth needed for OAuth login
    });
    
    return data.oauthLogin;
  } catch (error) {
    console.error('OAuth login error:', error);
    throw error;
  }
}

// Create resolvers that forward requests to the user service
const resolvers = {
  Query: {
    gatewayHealth: () => "API Gateway is operational!",
    me: async (_, __, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      try {
        const query = `
          query {
            me {
              id
              name
              email
              role
            }
          }
        `;

        const data = await callAuthService({
          query,
          context
        });
        
        return data.me;
      } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }
    },
    verifyResetToken: async (_, { token }) => {
      try {
        const query = `
          query {
            verifyResetToken(token: "${token}") {
              success
              message
            }
          }
        `;

        const data = await callAuthService({
          query,
          context: { headers: {} } // No auth needed for verifying reset token
        });
        
        return data.verifyResetToken;
      } catch (error) {
        console.error('Error verifying reset token:', error);
        throw error;
      }
    }
  },
  Mutation: {
    register: async (_, { input }, context) => {
      try {
        // Extract tenantId from context or input
        const tenantId = extractTenantId(context.req, context.user) || input.tenantId;
        validateTenantId(tenantId);
        
        const mutation = `
          mutation {
            register(input: {
              name: "${input.name}",
              email: "${input.email}",
              password: "${input.password}",
              role: ${input.role || 'CLIENT'},
              tenantId: "${tenantId}"
            }) {
              token
              refreshToken
              user {
                id
                name
                email
                role
              }
            }
          }
        `;

        const data = await callAuthService({
          query: mutation,
          context: { headers: {} } // No auth needed for registration
        });
        
        return data.register;
      } catch (error) {
        console.error('Registration error:', error);
        throw error;
      }
    },
    login: async (_, { email, password, tenantId }, context) => {
      try {
        // Extract tenantId from context or input
        const resolvedTenantId = tenantId || extractTenantId(context.req);
        validateTenantId(resolvedTenantId);
        
        const mutation = `
          mutation {
            login(email: "${email}", password: "${password}", tenantId: "${resolvedTenantId}") {
              token
              refreshToken
              user {
                id
                name
                email
                role
              }
            }
          }
        `;

        const data = await callAuthService({
          query: mutation,
          context: { headers: {} } // No auth needed for login
        });
        
        return data.login;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    refreshToken: async (_, { refreshToken }) => {
      try {
        const mutation = `
          mutation {
            refreshToken(refreshToken: "${refreshToken}") {
              token
              success
            }
          }
        `;

        const data = await callAuthService({
          query: mutation,
          context: { headers: {} } // No auth needed for token refresh
        });
        
        return data.refreshToken;
      } catch (error) {
        console.error('Token refresh error:', error);
        throw error;
      }
    },
    logout: async (_, { refreshToken }, context) => {
      try {
        const mutation = `
          mutation {
            logout(refreshToken: "${refreshToken}")
          }
        `;

        const data = await callAuthService({
          query: mutation,
          context
        });
        
        return data.logout;
      } catch (error) {
        console.error('Logout error:', error);
        throw error;
      }
    },
    logoutAll: async (_, __, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      try {
        const mutation = `
          mutation {
            logoutAll
          }
        `;

        const data = await callAuthService({
          query: mutation,
          context
        });
        
        return data.logoutAll;
      } catch (error) {
        console.error('Logout all error:', error);
        throw error;
      }
    },
    requestPasswordReset: async (_, { email }, context) => {
      try {
        // Extract tenantId from context
        const tenantId = extractTenantId(context.req, context.user);
        validateTenantId(tenantId);
        
        const mutation = `
          mutation {
            requestPasswordReset(email: "${email}", tenantId: "${tenantId}") {
              success
              message
            }
          }
        `;

        const data = await callAuthService({
          query: mutation,
          context: { headers: {} } // No auth needed for password reset request
        });
        
        return data.requestPasswordReset;
      } catch (error) {
        console.error('Password reset request error:', error);
        throw error;
      }
    },
    resetPassword: async (_, { token, newPassword }) => {
      try {
        const mutation = `
          mutation {
            resetPassword(token: "${token}", newPassword: "${newPassword}") {
              success
              message
            }
          }
        `;

        const data = await callAuthService({
          query: mutation,
          context: { headers: {} } // No auth needed for password reset
        });
        
        return data.resetPassword;
      } catch (error) {
        console.error('Password reset error:', error);
        throw error;
      }
    },
    verifyEmail: async (_, { token }) => {
      try {
        const mutation = `
          mutation {
            verifyEmail(token: "${token}") {
              success
              message
            }
          }
        `;

        const data = await callAuthService({
          query: mutation,
          context: { headers: {} } // No auth needed for email verification
        });
        
        return data.verifyEmail;
      } catch (error) {
        console.error('Email verification error:', error);
        throw error;
      }
    },
    resendVerification: async (_, { email }, context) => {
      try {
        // Extract tenantId from context
        const tenantId = extractTenantId(context.req, context.user);
        validateTenantId(tenantId);
        
        const mutation = `
          mutation {
            resendVerification(email: "${email}", tenantId: "${tenantId}") {
              success
              message
            }
          }
        `;

        const data = await callAuthService({
          query: mutation,
          context: { headers: {} } // No auth needed for resending verification
        });
        
        return data.resendVerification;
      } catch (error) {
        console.error('Resend verification error:', error);
        throw error;
      }
    }
  }
};

// Create Apollo Server
async function startServer() {
  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      // Authenticate user from token
      const user = authenticateToken(req);
      // Extract tenant ID from various sources
      const tenantId = extractTenantId(req, user);
      
      return {
        user,
        tenantId,
        headers: req.headers,
        req // Include the request for extracting information later
      };
    },
    formatError: (error) => {
      // Log the error for debugging
      console.error('GraphQL Error:', error);
      
      // Return a standardized error format
      return {
        message: error.message,
        path: error.path,
        extensions: {
          code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
          // Avoid exposing internal error details in production
          ...(config.server.isDev ? { stacktrace: error.extensions?.exception?.stacktrace } : {})
        }
      };
    },
    // Configure Apollo Server based on environment
    introspection: config.graphql.introspection,
    playground: config.graphql.playground,
    debug: config.graphql.debug,
    tracing: config.graphql.tracing,
  });

  // Apply middleware to the express app
  await server.start();
  server.applyMiddleware({
    app,
    path: '/graphql',
    cors: false // Already handled by express cors middleware
  });

  // Start the server
  const port = config.server.port;
  app.listen(port, () => {
    console.log(`API Gateway running at http://localhost:${port}${server.graphqlPath}`);
    console.log(`Environment: ${config.server.env}`);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
