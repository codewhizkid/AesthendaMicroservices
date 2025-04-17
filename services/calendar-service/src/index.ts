import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
// @ts-ignore - Using custom type definitions in src/types/graphql-ws.d.ts
import { useServer } from 'graphql-ws/lib/use/ws';
import { GraphQLError, GraphQLFormattedError } from 'graphql';

import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import connectDB, { db } from './db/connection'; // Import the singleton
import { errorHandler, notFoundHandler, formatGraphQLError } from './middleware/errorHandler';
import { authMiddleware, createWebSocketContext } from './middleware/auth';
import config from './config';
import { UserRole, Context } from './types';
import { verifyConnection } from './utils/connectionVerifier';
import { applyTenantIsolation } from './utils/resolverUtils';
import { tenantIsolationPlugin } from './plugins/tenantIsolationPlugin';

// Add a global connection counter for debugging
let connectionAttempts = 0;

// Type-safe error formatter adapter
const errorFormatterAdapter = (
  formattedError: GraphQLFormattedError, 
  originalError: unknown
): GraphQLFormattedError => {
  if (originalError instanceof GraphQLError) {
    return formatGraphQLError(originalError);
  }
  return formattedError;
};

// Type for WebSocket context
interface WSContext {
  connectionParams?: {
    authorization?: string;
  };
}

async function startServer() {
  try {
    // Increment and log connection attempt
    connectionAttempts++;
    console.log(`[SERVER] Connection attempt #${connectionAttempts}`);
    console.log(`[SERVER] Current connection state: ${db.getConnectionStateString()}`);
    
    // Connect to MongoDB using singleton connection
    // This is the ONLY place in the application that should call connectDB()
    await connectDB();
    console.log(`[SERVER] Connected to MongoDB: ${config.database.uri}`);
    
    // Verify connection is working correctly
    const connectionVerified = await verifyConnection();
    if (!connectionVerified) {
      throw new Error('Database connection verification failed');
    }
    
    // Create Express app
    const app = express();
    
    // Configure middleware
    app.use(cors({ origin: config.server.corsOrigins }));
    app.use(express.json());
    
    // Create HTTP server
    const httpServer = createServer(app);
    
    // Apply tenant isolation to all resolvers
    const isolatedResolvers = applyTenantIsolation(resolvers);
    
    // Create schema with isolated resolvers
    const schema = makeExecutableSchema({ 
      typeDefs, 
      resolvers: isolatedResolvers 
    });
    
    // Create WebSocket server for subscriptions
    const wsServer = new WebSocketServer({
      server: httpServer,
      path: '/graphql',
    });
    
    // Set up WebSocket server
    const serverCleanup = useServer(
      { 
        schema,
        context: (ctx: WSContext) => {
          // In production, get user info from connection context
          // For development, use a mock user
          try {
            return createWebSocketContext(ctx);
          } catch (error) {
            // For development, use a mock user if auth fails
            if (config.env.isDevelopment) {
              return {
                userId: 'dev-user-1',
                tenantId: config.tenant.defaultTenantId,
                userRole: UserRole.ADMIN,
              };
            }
            throw error;
          }
        }
      }, 
      wsServer
    );
    
    // Create Apollo Server
    const server = new ApolloServer<Context>({
      schema,
      formatError: errorFormatterAdapter,
      plugins: [
        // Add tenant isolation plugin
        tenantIsolationPlugin(),
        // Proper shutdown for HTTP server
        ApolloServerPluginDrainHttpServer({ httpServer }),
        // Proper shutdown for WebSocket server
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await serverCleanup.dispose();
              },
            };
          },
        },
      ],
    });
    
    // Start Apollo Server
    await server.start();
    
    // Apply middleware
    app.use('/graphql', 
      express.json(),
      authMiddleware,
      expressMiddleware(server, {
        context: async ({ req }) => {
          if (!req.user) {
            throw new Error('User not authenticated');
          }
          
          return {
            user: {
              id: req.user.id,
              tenantId: req.user.tenantId,
              roles: req.user.roles,
            }
          };
        },
      })
    );
    
    // Add error handlers
    app.use(notFoundHandler);
    app.use(errorHandler);
    
    // Start the server
    httpServer.listen(config.server.port, () => {
      console.log(`🚀 Server ready at http://localhost:${config.server.port}/graphql`);
      console.log(`🚀 Subscriptions ready at ws://localhost:${config.server.port}/graphql`);
    });
    
    // Add graceful shutdown
    const gracefulShutdown = async () => {
      console.log('🛑 Shutting down gracefully...');
      
      // Stop accepting new connections
      server.stop();
      
      // Close existing database connections
      await db.disconnect();
      console.log('📋 Database connections closed');
      
      // Exit process
      process.exit(0);
    };
    
    // Handle termination signals
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();