import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { GraphQLError } from 'graphql';

import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import connectDB, { db } from './db/connection';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import config from './config';
import { Context } from './types';

// Add a global connection counter for debugging
let connectionAttempts = 0;

async function startServer() {
  try {
    // Increment and log connection attempt
    connectionAttempts++;
    console.log(`[SERVER] Connection attempt #${connectionAttempts}`);
    console.log(`[SERVER] Current connection state: ${db.getConnectionStateString()}`);
    
    // Connect to MongoDB using singleton connection
    await connectDB();
    console.log(`[SERVER] Connected to MongoDB: ${config.database.uri}`);
    
    // Create Express app
    const app = express();
    
    // Configure middleware
    app.use(cors({ origin: config.server.corsOrigins }));
    app.use(express.json());
    
    // Create HTTP server
    const httpServer = createServer(app);
    
    // Create schema
    const schema = makeExecutableSchema({ 
      typeDefs, 
      resolvers 
    });
    
    // Create Apollo Server
    const server = new ApolloServer<Context>({
      schema,
      plugins: [
        // Proper shutdown for HTTP server
        ApolloServerPluginDrainHttpServer({ httpServer })
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
            throw new GraphQLError('User not authenticated', {
              extensions: { code: 'UNAUTHENTICATED' }
            });
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
      console.log(`🚀 Auth Service ready at http://localhost:${config.server.port}/graphql`);
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