import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';

import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import connectDB from './db/connection';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import config from './config';

async function startServer() {
  try {
    // Connect to MongoDB using singleton connection
    await connectDB();
    
    // Create Express app
    const app = express();
    
    // Configure middleware
    app.use(cors({ origin: config.server.corsOrigins }));
    app.use(express.json());
    
    // Create HTTP server
    const httpServer = createServer(app);
    
    // Create schema
    const schema = makeExecutableSchema({ typeDefs, resolvers });
    
    // Create WebSocket server for subscriptions
    const wsServer = new WebSocketServer({
      server: httpServer,
      path: '/graphql',
    });
    
    // Set up WebSocket server
    const serverCleanup = useServer(
      { 
        schema,
        context: (ctx) => {
          // In production, get user info from connection context
          // For development, use a mock user
          return {
            user: {
              id: 'user-1',
              tenantId: config.tenant.defaultTenantId,
              roles: ['ADMIN'],
            }
          };
        }
      }, 
      wsServer
    );
    
    // Create Apollo Server
    const server = new ApolloServer({
      schema,
      plugins: [
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
          return {
            user: req.user,
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
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer(); 