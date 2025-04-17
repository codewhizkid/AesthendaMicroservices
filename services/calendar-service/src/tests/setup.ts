import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import connectDB, { db } from '../db/connection';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Create MongoDB memory server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Set environment variable for the database connection
  process.env.MONGODB_URI = mongoUri;
  
  // Use the singleton connection
  await connectDB();
  console.log(`[TEST-SETUP] Connected to MongoDB memory server: ${mongoUri}`);
});

afterAll(async () => {
  // Use the singleton for disconnection
  await db.disconnect();
  
  // Stop the MongoDB memory server
  await mongoServer.stop();
  console.log('[TEST-SETUP] Stopped MongoDB memory server');
});

beforeEach(async () => {
  // Clear all collections before each test
  if (mongoose.connection.readyState !== 1) {
    console.log('[TEST-SETUP] Database not connected, cannot clear collections');
    return;
  }
  
  const collections = mongoose.connection.collections;
  
  if (!collections) {
    console.log('[TEST-SETUP] No collections found to clear');
    return;
  }
  
  for (const key in collections) {
    if (collections[key]) {
      await collections[key].deleteMany({});
    }
  }
  
  console.log('[TEST-SETUP] All collections cleared for test');
}); 