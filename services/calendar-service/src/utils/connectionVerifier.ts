import mongoose from 'mongoose';
import { db } from '../db/connection';
import config from '../config';

/**
 * Utility to verify database connections across different contexts
 * 
 * This helps ensure the singleton pattern is correctly implemented
 * and that we're not creating multiple connections unnecessarily.
 */
export function verifyConnectionState(): { state: string; connectionCount: number } {
  // Get connection state from singleton
  const state = db.getConnectionStateString();

  // Get active connections count (mongoose v6+)
  const connectionsCount = mongoose.connections.length;

  // Log verification results
  console.log(`[VERIFY] MongoDB connection state: ${state}`);
  console.log(`[VERIFY] Active connections count: ${connectionsCount}`);
  console.log(`[VERIFY] Database URI: ${config.database.uri}`);
  
  return {
    state,
    connectionCount: connectionsCount
  };
}

/**
 * Verify database connection in the current context (server, test, migration)
 * 
 * This helps diagnose connection issues and ensure we're following the singleton pattern.
 */
export async function verifyConnection(): Promise<boolean> {
  try {
    // Check current connection state
    const { state, connectionCount } = verifyConnectionState();
    
    if (connectionCount > 1) {
      console.warn(`[VERIFY] Warning: Multiple connections detected (${connectionCount})`);
    }
    
    if (state !== 'connected') {
      console.warn(`[VERIFY] Warning: Connection state is ${state}, not 'connected'`);
      return false;
    }
    
    // Check if we can actually query the database
    const result = await mongoose.connection.db?.admin().ping();
    
    if (result && result.ok === 1) {
      console.log('[VERIFY] Database connectivity verified successfully');
      return true;
    } else {
      console.warn('[VERIFY] Database connectivity check failed');
      return false;
    }
  } catch (error) {
    console.error('[VERIFY] Error verifying database connection:', error);
    return false;
  }
}

export default {
  verifyConnectionState,
  verifyConnection
};