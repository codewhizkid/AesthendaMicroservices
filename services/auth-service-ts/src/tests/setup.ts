import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { db } from '../db/connection';

// Use in-memory MongoDB for testing
let mongoServer: MongoMemoryServer;

// Setup before tests
global.beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Mock environment variables
  process.env.MONGODB_URI = mongoUri;
  process.env.JWT_SECRET = 'test_jwt_secret_key_min_32_characters';
  process.env.NODE_ENV = 'test';
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
});

// Clean up after each test
global.afterEach(async () => {
  // Clear all collections after each test
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Clean up after all tests
global.afterAll(async () => {
  // Disconnect from the database
  await db.disconnect();
  
  // Stop and clean up the MongoDB server
  if (mongoServer) {
    await mongoServer.stop();
  }
}); 