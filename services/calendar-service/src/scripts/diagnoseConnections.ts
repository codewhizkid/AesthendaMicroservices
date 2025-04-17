/**
 * Database Connection Diagnostic Tool
 * 
 * This script helps diagnose database connection issues by testing:
 * 1. Initial connection state
 * 2. Connection creation
 * 3. Basic CRUD operations
 * 4. Correct disconnection
 * 5. Connection count verification
 */

import mongoose from 'mongoose';
import connectDB, { db } from '../db/connection';
import config from '../config';
import { verifyConnectionState, verifyConnection } from '../utils/connectionVerifier';

async function runDiagnostics() {
  console.log('======= DATABASE CONNECTION DIAGNOSTICS =======');
  console.log(`Environment: ${config.env.nodeEnv}`);
  console.log(`Database URI: ${config.database.uri}`);
  
  // Step 1: Check initial connection state
  console.log('\n----- STEP 1: Initial Connection State -----');
  const initialState = verifyConnectionState();
  
  // Step 2: Attempt connection
  console.log('\n----- STEP 2: Connect to Database -----');
  try {
    await connectDB();
    console.log('Connection successful');
  } catch (error) {
    console.error('Connection failed:', error);
    process.exit(1);
  }
  
  // Step 3: Verify connection
  console.log('\n----- STEP 3: Verify Database Connection -----');
  const isConnected = await verifyConnection();
  if (!isConnected) {
    console.error('Connection verification failed');
    process.exit(1);
  }
  
  // Step 4: Test CRUD operations
  console.log('\n----- STEP 4: Test Basic CRUD Operations -----');
  
  // Create a temporary test collection
  const TestModel = mongoose.model(
    'ConnectionTest',
    new mongoose.Schema({
      testId: String,
      createdAt: { type: Date, default: Date.now }
    }, { timestamps: true }),
    'connection_tests' // collection name
  );
  
  try {
    // Create
    const testId = `test-${Date.now()}`;
    const testDoc = await TestModel.create({ testId });
    console.log(`Created test document: ${testDoc._id}`);
    
    // Read
    const foundDoc = await TestModel.findById(testDoc._id);
    console.log(`Read test document: ${foundDoc?._id ? 'Success' : 'Failed'}`);
    
    // Update
    const updatedDoc = await TestModel.findByIdAndUpdate(
      testDoc._id,
      { $set: { testId: `${testId}-updated` } },
      { new: true }
    );
    console.log(`Updated test document: ${updatedDoc?._id ? 'Success' : 'Failed'}`);
    
    // Delete
    await TestModel.findByIdAndDelete(testDoc._id);
    console.log('Deleted test document: Success');
    
    // Clean up - drop the test collection
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropCollection('connection_tests').catch(() => {
        console.log('Collection already dropped or does not exist');
      });
    } else {
      console.log('Connection db is undefined, cannot drop collection');
    }
  } catch (error) {
    console.error('CRUD operations failed:', error);
  }
  
  // Step 5: Check connection count
  console.log('\n----- STEP 5: Check Connection Count -----');
  const { connectionCount } = verifyConnectionState();
  
  if (connectionCount > 1) {
    console.warn(`WARNING: Multiple connections detected (${connectionCount})`);
  } else {
    console.log(`Connection count OK: ${connectionCount}`);
  }
  
  // Step 6: Disconnect
  console.log('\n----- STEP 6: Disconnect from Database -----');
  try {
    await db.disconnect();
    console.log('Disconnection successful');
  } catch (error) {
    console.error('Disconnection failed:', error);
  }
  
  // Final verification
  const finalState = verifyConnectionState();
  console.log('\n----- FINAL STATE -----');
  console.log(`Connection state: ${finalState.state}`);
  console.log(`Connection count: ${finalState.connectionCount}`);
  
  console.log('\n======= DIAGNOSTICS COMPLETE =======');
}

// Run diagnostics if called directly
if (require.main === module) {
  runDiagnostics()
    .then(() => {
      console.log('Diagnostics completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Diagnostics failed:', error);
      process.exit(1);
    });
}

export default runDiagnostics; 