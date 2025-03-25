const { ApolloServer } = require('apollo-server-express');
const { gql } = require('apollo-server');
const express = require('express');
const { authenticateToken } = require('./middleware/authMiddleware');
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

// Initialize Redis client
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379,
  enableOfflineQueue: true,
  connectTimeout: 10000
});

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
  }

  type Query {
    gatewayHealth: String
    me: User
    verifyResetToken(token: String!): PasswordResetResponse
  }

  type Mutation {
    register(input: RegisterInput!): AuthResponse
    login(email: String!, password: String!): AuthResponse
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
  origin: ['http://localhost:8080', 'http://localhost:3000'],
  credentials: true
};

// Set up middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(helmet()); // Add security headers

// Configure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_session_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Setup global rate limiting middleware
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
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
    clientID: process.env.GOOGLE_CLIENT_ID || 'your_google_client_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your_google_client_secret',
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
    clientID: process.env.FACEBOOK_APP_ID || 'your_facebook_app_id',
    clientSecret: process.env.FACEBOOK_APP_SECRET || 'your_facebook_app_secret',
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
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/auth-callback?token=${result.token}&refreshToken=${result.refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/login?error=oauth_failed`);
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
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/auth-callback?token=${result.token}&refreshToken=${result.refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/login?error=oauth_failed`);
    }
  }
);

// Helper function to process OAuth login through user service
async function processOAuthLogin(provider, token, profile) {
  const mutation = `
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

  const response = await fetch('http://user-service:5001', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: mutation })
  });

  const data = await response.json();
  if (data.errors) {
    throw new Error(data.errors[0].message);
  }
  
  return data.data.oauthLogin;
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

        const response = await fetch('http://user-service:5001', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': context.headers.authorization || ''
          },
          body: JSON.stringify({ query })
        });

        const data = await response.json();
        if (data.errors) {
          throw new Error(data.errors[0].message);
        }
        
        return data.data.me;
      } catch (error) {
        console.error('Error fetching user profile:', error);
        throw new Error('Failed to fetch user profile');
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

        const response = await fetch('http://user-service:5001', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query })
        });

        const data = await response.json();
        if (data.errors) {
          throw new Error(data.errors[0].message);
        }
        
        return data.data.verifyResetToken;
      } catch (error) {
        console.error('Error verifying reset token:', error);
        throw new Error('Failed to verify reset token');
      }
    }
  },
  Mutation: {
    register: async (_, { input }, context) => {
      try {
        const mutation = `
          mutation {
            register(input: {
              name: "${input.name}",
              email: "${input.email}",
              password: "${input.password}",
              role: ${input.role || 'client'}
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

        const response = await fetch('http://user-service:5001', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: mutation })
        });

        const data = await response.json();
        if (data.errors) {
          throw new Error(data.errors[0].message);
        }
        
        return data.data.register;
      } catch (error) {
        console.error('Error registering user:', error);
        throw new Error('Failed to register user');
      }
    },
    login: async (_, { email, password }, context) => {
      try {
        const mutation = `
          mutation {
            login(email: "${email}", password: "${password}") {
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

        const response = await fetch('http://user-service:5001', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: mutation })
        });

        const data = await response.json();
        if (data.errors) {
          throw new Error(data.errors[0].message);
        }
        
        return data.data.login;
      } catch (error) {
        console.error('Error logging in:', error);
        throw new Error('Failed to login');
      }
    },
    refreshToken: async (_, { refreshToken }, context) => {
      try {
        const mutation = `
          mutation {
            refreshToken(refreshToken: "${refreshToken}") {
              token
              success
            }
          }
        `;

        const response = await fetch('http://user-service:5001', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: mutation })
        });

        const data = await response.json();
        if (data.errors) {
          throw new Error(data.errors[0].message);
        }
        
        return data.data.refreshToken;
      } catch (error) {
        console.error('Error refreshing token:', error);
        throw new Error('Failed to refresh token');
      }
    },
    logout: async (_, { refreshToken }, context) => {
      try {
        const mutation = `
          mutation {
            logout(refreshToken: "${refreshToken}")
          }
        `;

        const response = await fetch('http://user-service:5001', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': context.headers.authorization || ''
          },
          body: JSON.stringify({ query: mutation })
        });

        const data = await response.json();
        if (data.errors) {
          throw new Error(data.errors[0].message);
        }
        
        return data.data.logout;
      } catch (error) {
        console.error('Error logging out:', error);
        throw new Error('Failed to logout');
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

        const response = await fetch('http://user-service:5001', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': context.headers.authorization || ''
          },
          body: JSON.stringify({ query: mutation })
        });

        const data = await response.json();
        if (data.errors) {
          throw new Error(data.errors[0].message);
        }
        
        return data.data.logoutAll;
      } catch (error) {
        console.error('Error logging out from all devices:', error);
        throw new Error('Failed to logout from all devices');
      }
    },
    requestPasswordReset: async (_, { email }) => {
      try {
        const mutation = `
          mutation {
            requestPasswordReset(email: "${email}") {
              success
              message
            }
          }
        `;

        const response = await fetch('http://user-service:5001', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: mutation })
        });

        const data = await response.json();
        if (data.errors) {
          throw new Error(data.errors[0].message);
        }
        
        return data.data.requestPasswordReset;
      } catch (error) {
        console.error('Error requesting password reset:', error);
        throw new Error('Failed to request password reset');
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

        const response = await fetch('http://user-service:5001', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: mutation })
        });

        const data = await response.json();
        if (data.errors) {
          throw new Error(data.errors[0].message);
        }
        
        return data.data.resetPassword;
      } catch (error) {
        console.error('Error resetting password:', error);
        throw new Error('Failed to reset password');
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

        const response = await fetch('http://user-service:5001', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: mutation })
        });

        const data = await response.json();
        if (data.errors) {
          throw new Error(data.errors[0].message);
        }
        
        return data.data.verifyEmail;
      } catch (error) {
        console.error('Error verifying email:', error);
        throw new Error('Failed to verify email');
      }
    },
    resendVerification: async (_, { email }) => {
      try {
        const mutation = `
          mutation {
            resendVerification(email: "${email}") {
              success
              message
            }
          }
        `;

        const response = await fetch('http://user-service:5001', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: mutation })
        });

        const data = await response.json();
        if (data.errors) {
          throw new Error(data.errors[0].message);
        }
        
        return data.data.resendVerification;
      } catch (error) {
        console.error('Error resending verification email:', error);
        throw new Error('Failed to resend verification email');
      }
    }
  }
};

// Initialize Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // Get authenticated user from token
    const user = authenticateToken(req);
    
    return {
      user,
      headers: req.headers
    };
  },
  formatError: (err) => {
    // Log errors for debugging
    console.error('GraphQL Error:', err);
    
    // Return formatted error to client
    return {
      message: err.message,
      code: err.extensions?.code || 'SERVER_ERROR',
      path: err.path
    };
  }
});

// Start the Apollo Server
async function startServer() {
  // Start the server without waiting for Redis connection
  // Redis connection will be attempted but won't block server startup
  redisClient.on('connect', () => {
    console.log('Connected to Redis successfully');
  });

  await server.start();
  
  // Apply middleware to Express
  server.applyMiddleware({ 
    app,
    path: '/graphql',
    cors: corsOptions
  });
  
  // Basic routes
  app.get('/', (req, res) => {
    res.send('Welcome to Aesthenda API Gateway');
  });
  
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
  });

  // Use role management routes
  app.use(roleRoutes);

  // Start the server
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 API Gateway ready with authentication at http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`OAuth endpoints available at http://localhost:${PORT}/auth/google and http://localhost:${PORT}/auth/facebook`);
    console.log(`Rate limiting enabled with Redis at ${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || '6379'}`);
    console.log(`CORS enabled for: ${corsOptions.origin.join(', ')}`);
  });
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  try {
    await redisClient.quit();
  } catch (err) {
    console.error('Error closing Redis connection:', err);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  try {
    await redisClient.quit();
  } catch (err) {
    console.error('Error closing Redis connection:', err);
  }
  process.exit(0);
});

startServer().catch(err => {
  console.error('Error starting server:', err);
});
