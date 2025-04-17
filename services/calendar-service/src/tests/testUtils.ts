import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { EventStatus, EventType, UserRole } from '../types';
import connectDB, { db } from '../db/connection';
import config from '../config';

let mongoServer: MongoMemoryServer | undefined;

// Get connection state as a string for logging
export const getConnectionStateString = (state: number): string => {
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized'
  };
  return states[state] || `unknown(${state})`;
};

export const setupTestDB = async (): Promise<void> => {
  try {
    console.log(`[TEST] Current connection state: ${getConnectionStateString(mongoose.connection.readyState)}`);
    
    // Close any existing connection using the db singleton
    if (mongoose.connection.readyState !== 0) {
      console.log('[TEST] Disconnecting from existing MongoDB connection');
      await db.disconnect();
    }
    
    // Create a new MongoDB memory server if it doesn't exist
    if (!mongoServer) {
      mongoServer = await MongoMemoryServer.create();
      console.log('[TEST] Created MongoDB memory server');
    }

    // Set config to use the memory server URI
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    
    // Use the singleton connection manager
    await connectDB();
    
    console.log(`[TEST] Connected to MongoDB at ${uri}`);
    console.log(`[TEST] New connection state: ${getConnectionStateString(mongoose.connection.readyState)}`);
  } catch (error) {
    console.error('[TEST] Error setting up test database:', error);
    throw error;
  }
};

export const teardownTestDB = async (): Promise<void> => {
  try {
    console.log(`[TEST] Connection state before teardown: ${getConnectionStateString(mongoose.connection.readyState)}`);
    
    // Always use the singleton for disconnection
    if (mongoose.connection.readyState !== 0) {
      console.log('[TEST] Disconnecting from MongoDB');
      await db.disconnect();
    }
    
    if (mongoServer) {
      await mongoServer.stop();
      console.log('[TEST] Stopped MongoDB memory server');
      mongoServer = undefined;
    }
  } catch (error) {
    console.error('[TEST] Error tearing down test database:', error);
    throw error;
  }
};

export const clearTestDB = async (): Promise<void> => {
  console.log('[TEST] Clearing all collections');
  
  if (mongoose.connection.readyState !== 1) {
    console.log('[TEST] Database not connected, cannot clear collections');
    return;
  }
  
  const collections = mongoose.connection.collections;
  
  if (!collections) {
    console.log('[TEST] No collections found to clear');
    return;
  }
  
  for (const key in collections) {
    if (collections[key]) {
      await collections[key].deleteMany({});
    }
  }
  
  console.log('[TEST] All collections cleared');
};

export const createMockContext = (tenantId: string, role: UserRole) => {
  return {
    user: {
      id: 'user-1',
      tenantId,
      roles: [role]
    }
  };
};

export const createTestEvent = (overrides: Partial<any> = {}) => {
  return {
    title: 'Test Event',
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000),
    allDay: false,
    status: EventStatus.CONFIRMED,
    type: EventType.MEETING,
    ...overrides
  };
};

export const createTestResource = (overrides: Partial<any> = {}) => {
  return {
    title: 'Test Resource',
    type: 'ROOM',
    availability: [
      {
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00'
      }
    ],
    ...overrides
  };
}; 