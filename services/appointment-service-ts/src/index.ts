import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import typeDefs from './schema';
import { appointmentResolvers } from './resolvers/appointmentResolvers';
import config from './config';
import { connectToRabbitMQ, closeRabbitMQConnection } from './utils/rabbitmq';

// Define context type
interface GraphQLContext {
  tenantId: string;
  userId?: string;
  userRole?: string;
}

async function startServer() {
  try {
    // Override MongoDB URI for Docker environment
    const mongoUri = process.env.MONGODB_URI || 'mongodb://mongo-appointment:27017/appointmentdb';
    
    // Connect to MongoDB
    console.log(`Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully');

    // Connect to RabbitMQ
    console.log('Connecting to RabbitMQ...');
    const rabbitMQConnected = await connectToRabbitMQ();
    if (!rabbitMQConnected) {
      console.warn('Warning: RabbitMQ connection not established. Events will not be published.');
    } else {
      console.log('Connected to RabbitMQ successfully');
    }

    // Create Express app and HTTP server
    const app = express();
    const httpServer = http.createServer(app);

    // Create Apollo Server
    const server = new ApolloServer<GraphQLContext>({
      typeDefs,
      resolvers: appointmentResolvers,
      plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
      formatError: (error) => {
        console.error('GraphQL Error:', error);
        return {
          message: error.message,
          path: error.path,
          extensions: error.extensions,
        };
      },
    });

    // Start Apollo Server
    await server.start();

    // Apply middleware
    app.use(
      '/graphql',
      cors<cors.CorsRequest>({
        origin: config.cors.origins,
        credentials: config.cors.credentials,
      }),
      express.json(),
      expressMiddleware(server, {
        context: async ({ req }) => {
          // Extract tenant ID from request headers
          const tenantId = req.headers['x-tenant-id'] as string || config.defaultTenantId || 'default';
          
          // You would also extract user ID and role from JWT token here
          return {
            tenantId,
            // userId: extractUserIdFromToken(req),
            // userRole: extractUserRoleFromToken(req),
          };
        },
      }),
    );

    // Health check endpoint
    app.get('/health', (_, res) => {
      res.status(200).send('Appointment Service is healthy');
    });

    // Set up graceful shutdown
    const gracefulShutdown = async () => {
      console.log('Shutting down server...');
      
      // Stop accepting new requests
      await server.stop();
      
      // Close HTTP server
      httpServer.close(() => {
        console.log('HTTP server closed');
      });
      
      // Close RabbitMQ connection
      await closeRabbitMQConnection();
      
      // Close MongoDB connection
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
      
      process.exit(0);
    };

    // Listen for termination signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    // Start server
    await new Promise<void>((resolve) => {
      httpServer.listen(config.port, () => {
        console.log(`🚀 Appointment service running at http://localhost:${config.port}/graphql`);
        resolve();
      });
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start the server
startServer(); 