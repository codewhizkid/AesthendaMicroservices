import mongoose from 'mongoose';
import config from '../config';
import { EventEmitter } from 'events';

// Connection ready states
const STATES = {
  disconnected: 0,
  connected: 1,
  connecting: 2,
  disconnecting: 3,
  uninitialized: 99
};

// Event emitter for database events
export const dbEvents = new EventEmitter();

// Connection singleton
class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnecting: boolean = false;

  private constructor() {
    // Setup connection event handlers
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connection established');
      dbEvents.emit('connected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      dbEvents.emit('error', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      dbEvents.emit('disconnected');
    });

    // Handle process termination
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
  }

  // Get connection state as a string
  getConnectionStateString(): string {
    const state = mongoose.connection.readyState;
    const states: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
      99: 'uninitialized'
    };
    return states[state] || `unknown(${state})`;
  }

  // Get the singleton instance
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  // Connect to MongoDB
  async connect(): Promise<typeof mongoose> {
    // If already connected or connecting, return the current connection
    if (mongoose.connection.readyState === STATES.connected) {
      console.log('Reusing existing MongoDB connection');
      return mongoose;
    }

    if (this.isConnecting) {
      console.log('Connection already in progress, waiting...');
      return new Promise((resolve) => {
        dbEvents.once('connected', () => resolve(mongoose));
      });
    }

    this.isConnecting = true;

    try {
      // Close any existing connection first
      if (mongoose.connection.readyState !== STATES.disconnected) {
        console.log(`Closing existing connection in state: ${this.getConnectionStateString()}`);
        await mongoose.disconnect();
      }

      // Connect with options from config
      console.log(`Connecting to MongoDB at ${config.database.uri}`);
      await mongoose.connect(config.database.uri, config.database.options);
      
      this.isConnecting = false;
      return mongoose;
    } catch (error) {
      this.isConnecting = false;
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  // Gracefully close the connection
  async disconnect(): Promise<void> {
    if (mongoose.connection.readyState !== STATES.disconnected) {
      console.log('Disconnecting from MongoDB');
      await mongoose.disconnect();
    }
  }

  // Handle graceful shutdown
  private async gracefulShutdown(signal: string): Promise<void> {
    console.log(`${signal} received, closing MongoDB connection`);
    try {
      await this.disconnect();
      console.log('MongoDB connection closed successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error during MongoDB disconnection:', error);
      process.exit(1);
    }
  }
}

// Export singleton instance
export const db = DatabaseConnection.getInstance();

// Export default connect function for easy import
export default async function connectDB(): Promise<typeof mongoose> {
  return db.connect();
}