import mongoose from 'mongoose';
import config from '../config';

// Connection states
const states = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
  99: 'uninitialized'
};

// Singleton class to manage database connection
class Database {
  private static instance: Database;
  private isConnected = false;
  private connectionAttempts = 0;
  private maxRetries = 5;
  private retryDelay = 5000; // 5 seconds

  private constructor() {
    // Configure mongoose
    mongoose.set('strictQuery', true);
    
    // Log mongoose events
    mongoose.connection.on('connected', () => {
      this.isConnected = true;
      console.log('🔌 MongoDB connected successfully');
    });
    
    mongoose.connection.on('error', (err) => {
      this.isConnected = false;
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      this.isConnected = false;
      console.log('🔌 MongoDB disconnected');
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // Get connection state as string
  public getConnectionStateString(): string {
    return states[mongoose.connection.readyState] || 'unknown';
  }

  // Connect to MongoDB with retry logic
  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('📋 Using existing MongoDB connection');
      return;
    }

    try {
      this.connectionAttempts++;
      console.log(`📋 MongoDB connection attempt #${this.connectionAttempts}`);
      
      await mongoose.connect(config.database.uri, {
        // Connection options if needed
      });
      
      this.isConnected = true;
      console.log(`📋 MongoDB connected successfully to ${config.database.uri}`);
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      
      if (this.connectionAttempts < this.maxRetries) {
        console.log(`📋 Retrying connection in ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.connect();
      } else {
        console.error(`❌ Failed to connect to MongoDB after ${this.maxRetries} attempts`);
        throw error;
      }
    }
  }

  // Disconnect from MongoDB
  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }
    
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('📋 MongoDB disconnected successfully');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }
}

// Create the singleton instance
export const db = Database.getInstance();

// Default export for convenience
export default async function connectDB(): Promise<void> {
  return db.connect();
} 