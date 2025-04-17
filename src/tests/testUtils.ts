import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { EventStatus, EventType, UserRole } from '../types';

let mongoServer: MongoMemoryServer | undefined;

const MONGOOSE_OPTIONS = {
  autoIndex: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
};

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
    console.log(`Current connection state: ${getConnectionStateString(mongoose.connection.readyState)}`);
    
    // Close any existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('Disconnected from existing MongoDB connection');
    }
    
    // Create a new MongoDB memory server if it doesn't exist
    if (!mongoServer) {
      mongoServer = await MongoMemoryServer.create();
      console.log('Created MongoDB memory server');
    }

    const uri = mongoServer.getUri();
    await mongoose.connect(uri, MONGOOSE_OPTIONS);
    
    console.log(`Connected to MongoDB at ${uri}`);
    console.log(`New connection state: ${getConnectionStateString(mongoose.connection.readyState)}`);
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
};

export const teardownTestDB = async (): Promise<void> => {
  try {
    console.log(`Connection state before teardown: ${getConnectionStateString(mongoose.connection.readyState)}`);
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
    
    if (mongoServer) {
      await mongoServer.stop();
      console.log('Stopped MongoDB memory server');
      mongoServer = undefined;
    }
  } catch (error) {
    console.error('Error tearing down test database:', error);
    throw error;
  }
};

export const clearTestDB = async (): Promise<void> => {
  console.log('Clearing all collections');
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  
  console.log('All collections cleared');
};

export const createMockContext = (tenantId: string, role: UserRole) => {
  return {
    tenantId,
    userId: 'user-1',
    role
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