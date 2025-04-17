import { ApolloServer } from "apollo-server-express";
import {
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginInlineTrace,
} from "apollo-server-core";
import { gql } from "apollo-server";
import express, { Request, Response } from "express";
import { authenticateToken } from "./middleware/authMiddleware";
import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile as GoogleProfile,
  VerifyCallback as GoogleVerifyCallback,
} from "passport-google-oauth20";
import {
  Strategy as FacebookStrategy,
  Profile as FacebookProfile,
  VerifyCallback as FacebookVerifyCallback,
} from "passport-facebook";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import Redis from "ioredis";
import * as rateLimitRedis from "rate-limit-redis";
import config from "./config";
import { Context, ServiceError } from "./types";
import { createUserServiceClient } from "./utils/serviceClient";
import { Store } from "express-rate-limit";

// Initialize Redis client
const redisClient = new Redis(config.redis.url);

redisClient.on("error", (err: Error) => {
  console.error("Redis error:", err);
});

redisClient.on("connect", () => {
  console.log("Connected to Redis successfully");
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
  origin: config.server.corsOrigins,
  credentials: true,
};

// Set up middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(helmet()); // Add security headers

// Configure session middleware
app.use(
  session({
    secret: config.jwt.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.server.isProd,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Create a sendCommand function compatible with the RedisStore
const sendCommand: rateLimitRedis.SendCommandFn = async (
  command: string,
  ...args: any[]
): Promise<any> => {
  return redisClient.call(command, ...args);
};

// Create a compatible Redis store for rate limiting
const createRedisStore = (prefix: string): Store => {
  return new rateLimitRedis.default({
    sendCommand,
    prefix,
  }) as unknown as Store;
};

// Setup global rate limiting middleware
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("global_rl:"),
  message: {
    status: 429,
    message: "Too many requests, please try again later.",
  },
});

// Setup stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 login/registration attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("auth_rl:"),
  message: {
    status: 429,
    message:
      "Too many authentication attempts, please try again after an hour.",
  },
  // Helper function to determine if request should be counted
  skip: (req) => {
    // Only count if it's an authentication operation
    if (!req.body || !req.body.query) return true;

    const query = req.body.query.toLowerCase();
    return !(
      query.includes("mutation") &&
      (query.includes("login") || query.includes("register"))
    );
  },
});

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport serialize/deserialize user
passport.serializeUser((user: any, done: (err: any, id?: any) => void) => {
  done(null, user);
});

passport.deserializeUser((user: any, done: (err: any, user?: any) => void) => {
  done(null, user);
});

// Configure OAuth strategies
const setupOAuthStrategies = () => {
  // Google strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.getEnv("GOOGLE_CLIENT_ID", "your_google_client_id"),
        clientSecret: config.getEnv(
          "GOOGLE_CLIENT_SECRET",
          "your_google_client_secret",
        ),
        callbackURL: "/auth/google/callback",
        scope: ["profile", "email"],
      },
      (
        accessToken: string,
        _refreshToken: string,
        profile: GoogleProfile,
        done: GoogleVerifyCallback,
      ) => {
        // We're just passing the profile and tokens to the callback route handler
        done(null, {
          provider: "google",
          token: accessToken,
          profile,
        });
      },
    ),
  );

  // Facebook strategy
  passport.use(
    new FacebookStrategy(
      {
        clientID: config.getEnv("FACEBOOK_APP_ID", "your_facebook_app_id"),
        clientSecret: config.getEnv(
          "FACEBOOK_APP_SECRET",
          "your_facebook_app_secret",
        ),
        callbackURL: "/auth/facebook/callback",
        profileFields: ["id", "displayName", "email", "picture"],
      },
      (
        accessToken: string,
        _refreshToken: string,
        profile: FacebookProfile,
        done: FacebookVerifyCallback,
      ) => {
        // We're just passing the profile and tokens to the callback route handler
        done(null, {
          provider: "facebook",
          token: accessToken,
          profile,
        });
      },
    ),
  );
};

setupOAuthStrategies();

// Apply global rate limiter to all requests
app.use(globalLimiter);

// Apply auth rate limiter to GraphQL endpoint
app.use("/graphql", authLimiter);

// Helper function to process OAuth login through user service
async function processOAuthLogin(
  provider: string,
  token: string,
  profile: any,
) {
  try {
    const userClient = createUserServiceClient();
    const result = await userClient.oauthLogin(provider, token, profile);
    return result.oauthLogin;
  } catch (error) {
    console.error("OAuth login error:", error);
    throw error;
  }
}

// Type-safe filter for removing undefined values from an array
function nonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

// OAuth routes
// Google Auth Routes
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }) as express.RequestHandler,
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }) as express.RequestHandler,
  async (req: express.Request, res: express.Response) => {
    try {
      // Process OAuth login through the user service
      const { provider, token, profile } = req.user as any;

      // Call the user service to login or create account
      const result = await processOAuthLogin(provider, token, profile);

      // Redirect to frontend with tokens
      const frontendURL = config.getEnv(
        "FRONTEND_URL",
        "http://localhost:3000",
      );
      const redirectUrl = `${frontendURL}/auth-callback?token=${result.token}&refreshToken=${result.refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("OAuth callback error:", error);
      const frontendURL = config.getEnv(
        "FRONTEND_URL",
        "http://localhost:3000",
      );
      res.redirect(`${frontendURL}/login?error=oauth_failed`);
    }
  },
);

// Facebook Auth Routes
app.get(
  "/auth/facebook",
  passport.authenticate("facebook", {
    scope: ["email"],
  }) as express.RequestHandler,
);

app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: "/login",
    session: false,
  }) as express.RequestHandler,
  async (req: express.Request, res: express.Response) => {
    try {
      // Process OAuth login through the user service
      const { provider, token, profile } = req.user as any;

      // Call the user service to login or create account
      const result = await processOAuthLogin(provider, token, profile);

      // Redirect to frontend with tokens
      const frontendURL = config.getEnv(
        "FRONTEND_URL",
        "http://localhost:3000",
      );
      const redirectUrl = `${frontendURL}/auth-callback?token=${result.token}&refreshToken=${result.refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("OAuth callback error:", error);
      const frontendURL = config.getEnv(
        "FRONTEND_URL",
        "http://localhost:3000",
      );
      res.redirect(`${frontendURL}/login?error=oauth_failed`);
    }
  },
);

// Create resolvers that forward requests to the user service
const resolvers = {
  Query: {
    gatewayHealth: () => "API Gateway is operational!",
    me: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new ServiceError("Not authenticated", {
          code: "UNAUTHENTICATED",
        });
      }

      try {
        const userClient = createUserServiceClient({
          Authorization: context.headers.authorization || "",
          "X-Tenant-ID": context.user.tenantId,
        });

        const result = await userClient.me();
        return result.me;
      } catch (error) {
        console.error("Error fetching user profile:", error);
        throw new ServiceError("Failed to fetch user profile", {
          code: "USER_FETCH_ERROR",
          service: "user",
        });
      }
    },
    verifyResetToken: async (_: any, { token }: { token: string }) => {
      try {
        const userClient = createUserServiceClient();
        const result = await userClient.verifyResetToken(token);
        return result.verifyResetToken;
      } catch (error) {
        console.error("Error verifying reset token:", error);
        throw new ServiceError("Failed to verify reset token", {
          code: "RESET_TOKEN_ERROR",
          service: "user",
        });
      }
    },
  },
  Mutation: {
    register: async (_: any, { input }: { input: any }, context: Context) => {
      try {
        const userClient = createUserServiceClient(
          context.headers as Record<string, string>,
        );
        const result = await userClient.register(input);
        return result.register;
      } catch (error) {
        console.error("Error registering user:", error);
        if (error instanceof ServiceError) {
          throw error;
        }
        throw new ServiceError("Failed to register user", {
          code: "REGISTRATION_ERROR",
          service: "user",
        });
      }
    },
    login: async (
      _: any,
      {
        email,
        password,
        tenantId,
      }: { email: string; password: string; tenantId: string },
      context: Context,
    ) => {
      try {
        const userClient = createUserServiceClient(
          context.headers as Record<string, string>,
        );
        const result = await userClient.login(email, password, tenantId);
        return result.login;
      } catch (error) {
        console.error("Error logging in:", error);
        if (error instanceof ServiceError) {
          throw error;
        }
        throw new ServiceError("Failed to login", {
          code: "LOGIN_ERROR",
          service: "user",
        });
      }
    },
    refreshToken: async (
      _: any,
      { refreshToken }: { refreshToken: string },
      context: Context,
    ) => {
      try {
        const userClient = createUserServiceClient({
          ...(context.headers as Record<string, string>),
          "X-Tenant-ID": context.headers["x-tenant-id"] || "",
        });

        const result = await userClient.refreshToken(refreshToken);
        return result.refreshToken;
      } catch (error) {
        console.error("Error refreshing token:", error);
        if (error instanceof ServiceError) {
          throw error;
        }
        throw new ServiceError("Failed to refresh token", {
          code: "TOKEN_REFRESH_ERROR",
          service: "user",
        });
      }
    },
    logout: async (
      _: any,
      { refreshToken }: { refreshToken: string },
      context: Context,
    ) => {
      if (!context.user) {
        throw new ServiceError("Not authenticated", {
          code: "UNAUTHENTICATED",
        });
      }

      try {
        const userClient = createUserServiceClient({
          Authorization: context.headers.authorization || "",
          "X-Tenant-ID": context.user.tenantId,
        });

        const result = await userClient.logout(refreshToken);
        return result.logout;
      } catch (error) {
        console.error("Error logging out:", error);
        if (error instanceof ServiceError) {
          throw error;
        }
        throw new ServiceError("Failed to logout", {
          code: "LOGOUT_ERROR",
          service: "user",
        });
      }
    },
    logoutAll: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new ServiceError("Not authenticated", {
          code: "UNAUTHENTICATED",
        });
      }

      try {
        const userClient = createUserServiceClient({
          Authorization: context.headers.authorization || "",
          "X-Tenant-ID": context.user.tenantId,
        });

        const result = await userClient.logoutAll();
        return result.logoutAll;
      } catch (error) {
        console.error("Error logging out from all devices:", error);
        if (error instanceof ServiceError) {
          throw error;
        }
        throw new ServiceError("Failed to logout from all devices", {
          code: "LOGOUT_ALL_ERROR",
          service: "user",
        });
      }
    },
    requestPasswordReset: async (_: any, { email }: { email: string }) => {
      try {
        const userClient = createUserServiceClient();
        const result = await userClient.requestPasswordReset(email);
        return result.requestPasswordReset;
      } catch (error) {
        console.error("Error requesting password reset:", error);
        if (error instanceof ServiceError) {
          throw error;
        }
        throw new ServiceError("Failed to request password reset", {
          code: "PASSWORD_RESET_REQUEST_ERROR",
          service: "user",
        });
      }
    },
    resetPassword: async (
      _: any,
      { token, newPassword }: { token: string; newPassword: string },
    ) => {
      try {
        const userClient = createUserServiceClient();
        const result = await userClient.resetPassword(token, newPassword);
        return result.resetPassword;
      } catch (error) {
        console.error("Error resetting password:", error);
        if (error instanceof ServiceError) {
          throw error;
        }
        throw new ServiceError("Failed to reset password", {
          code: "PASSWORD_RESET_ERROR",
          service: "user",
        });
      }
    },
    verifyEmail: async (_: any, { token }: { token: string }) => {
      try {
        const userClient = createUserServiceClient();
        const result = await userClient.verifyEmail(token);
        return result.verifyEmail;
      } catch (error) {
        console.error("Error verifying email:", error);
        if (error instanceof ServiceError) {
          throw error;
        }
        throw new ServiceError("Failed to verify email", {
          code: "EMAIL_VERIFY_ERROR",
          service: "user",
        });
      }
    },
    resendVerification: async (_: any, { email }: { email: string }) => {
      try {
        const userClient = createUserServiceClient();
        const result = await userClient.resendVerification(email);
        return result.resendVerification;
      } catch (error) {
        console.error("Error resending verification email:", error);
        if (error instanceof ServiceError) {
          throw error;
        }
        throw new ServiceError("Failed to resend verification email", {
          code: "VERIFICATION_RESEND_ERROR",
          service: "user",
        });
      }
    },
  },
};

// Initialize Apollo Server with the v3 constructor
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }: { req: Request }): Context => {
    // Get authenticated user from token
    const user = authenticateToken(req);

    return {
      user,
      headers: req.headers as Record<string, string>,
    };
  },
  formatError: (err: any) => {
    // Log errors for debugging
    console.error("GraphQL Error:", err);

    // Return formatted error to client
    return {
      message: err.message,
      code: err.extensions?.code || "SERVER_ERROR",
      path: err.path,
    };
  },
  plugins: [
    // Use proper apollo server plugins
    config.graphql.playground
      ? ApolloServerPluginLandingPageGraphQLPlayground()
      : ApolloServerPluginLandingPageDisabled(),
    config.graphql.tracing ? ApolloServerPluginInlineTrace() : undefined,
  ].filter(nonNullable),
});

// Store Apollo server path for use in the logs
let graphqlPath = "/graphql";

// Start the Apollo Server
async function startServer() {
  // Start the server without waiting for Redis connection
  // Redis connection will be attempted but won't block server startup
  redisClient.on("connect", () => {
    console.log("Connected to Redis successfully");
  });

  // Start the Apollo server as required in v3
  await server.start();

  // Apply middleware to Express
  const serverMiddleware = server.applyMiddleware({
    app, // Type assertion is handled by our declarations file
    path: "/graphql",
    cors: corsOptions,
  });

  // Store the graphql path for logging
  graphqlPath = serverMiddleware.path;

  // Basic routes
  app.get("/", (_: Request, res: Response) => {
    res.send("Welcome to Aesthenda API Gateway");
  });

  app.get("/health", (_: Request, res: Response) => {
    res.status(200).json({ status: "healthy" });
  });

  // Start the server
  const PORT = config.server.port;
  app.listen(PORT, () => {
    console.log(
      `🚀 API Gateway ready with authentication at http://localhost:${PORT}${graphqlPath}`,
    );
    console.log(
      `OAuth endpoints available at http://localhost:${PORT}/auth/google and http://localhost:${PORT}/auth/facebook`,
    );
    console.log(`Rate limiting enabled with Redis at ${config.redis.url}`);
    console.log(`CORS enabled for: ${config.server.corsOrigins.join(", ")}`);
  });
}

startServer().catch((error) => {
  console.error("Error starting server:", error);
  process.exit(1);
});
