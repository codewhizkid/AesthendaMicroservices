import mongoose from 'mongoose';
import { readdirSync } from 'fs';
import path from 'path';
import connectDB, { db } from '../db/connection';
import config from '../config';
import { verifyConnection } from '../utils/connectionVerifier';

// Migration model to track which migrations have been run
interface IMigration extends mongoose.Document {
  name: string;
  appliedAt: Date;
}

const migrationSchema = new mongoose.Schema<IMigration>({
  name: { type: String, required: true, unique: true },
  appliedAt: { type: Date, default: Date.now }
});

const Migration = mongoose.model<IMigration>('Migration', migrationSchema);

// Base migration interface
export interface Migration {
  name: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

async function createMigrationsCollection() {
  try {
    await Migration.createCollection();
    console.log('✅ Migrations collection created');
  } catch (error) {
    // Collection might already exist, which is fine
    console.log('Migrations collection already exists');
  }
}

async function isApplied(migrationName: string): Promise<boolean> {
  const migration = await Migration.findOne({ name: migrationName });
  return !!migration;
}

async function markAsApplied(migrationName: string): Promise<void> {
  await Migration.create({ name: migrationName });
  console.log(`✅ Marked migration as applied: ${migrationName}`);
}

async function markAsUnapplied(migrationName: string): Promise<void> {
  await Migration.deleteOne({ name: migrationName });
  console.log(`✅ Marked migration as unapplied: ${migrationName}`);
}

// Run all pending migrations
export async function migrate(): Promise<void> {
  console.log(`[MIGRATION] Connection state before connect: ${db.getConnectionStateString()}`);
  
  // Use the singleton connection
  await connectDB();
  console.log(`[MIGRATION] Connected to database: ${config.database.uri}`);
  
  // Verify connection is working correctly
  const connectionVerified = await verifyConnection();
  if (!connectionVerified) {
    throw new Error('Database connection verification failed');
  }
  
  await createMigrationsCollection();

  // Get all migration files
  const migrationFiles = readdirSync(__dirname)
    .filter(file => file.match(/^\d{14}-.*\.ts$/))
    .sort();

  console.log(`[MIGRATION] Found ${migrationFiles.length} migration files to process`);

  // Run pending migrations
  let appliedCount = 0;
  for (const file of migrationFiles) {
    const migrationName = path.basename(file, '.ts');
    
    if (await isApplied(migrationName)) {
      console.log(`⏩ Migration already applied: ${migrationName}`);
      continue;
    }

    try {
      // Import migration file
      const migration = require(path.join(__dirname, file)).default as Migration;
      
      // Check if migration is valid
      if (!migration || !migration.up) {
        console.warn(`⚠️ Invalid migration format: ${file}`);
        continue;
      }

      console.log(`🔄 Running migration: ${migrationName}`);
      await migration.up();
      await markAsApplied(migrationName);
      console.log(`✅ Migration complete: ${migrationName}`);
      appliedCount++;
    } catch (error) {
      console.error(`❌ Migration failed: ${migrationName}`, error);
      process.exit(1);
    }
  }

  console.log(`✅ Migrations completed: ${appliedCount} applied, ${migrationFiles.length - appliedCount} skipped`);
  console.log(`[MIGRATION] Connection state before disconnect: ${db.getConnectionStateString()}`);
  
  // Always use the singleton to disconnect
  await db.disconnect();
  console.log('[MIGRATION] Disconnected from database');
}

// Rollback the last migration or a specific migration
export async function rollback(migrationName?: string): Promise<void> {
  console.log(`[MIGRATION] Connection state before connect: ${db.getConnectionStateString()}`);
  
  // Use the singleton connection
  await connectDB();
  console.log(`[MIGRATION] Connected to database: ${config.database.uri}`);
  
  // Verify connection is working correctly
  const connectionVerified = await verifyConnection();
  if (!connectionVerified) {
    throw new Error('Database connection verification failed');
  }
  
  try {
    // If no specific migration provided, get the last applied migration
    if (!migrationName) {
      const lastApplied = await Migration.findOne().sort({ appliedAt: -1 });
      
      if (!lastApplied) {
        console.log('❓ No migrations to roll back');
        return;
      }
      
      migrationName = lastApplied.name;
    }
    
    // Check if the migration was applied
    if (!(await isApplied(migrationName))) {
      console.log(`❓ Migration not applied: ${migrationName}`);
      return;
    }
    
    // Load the migration file
    const file = `${migrationName}.ts`;
    const migration = require(path.join(__dirname, file)).default as Migration;
    
    if (!migration || !migration.down) {
      console.warn(`⚠️ Invalid migration format: ${file}`);
      return;
    }
    
    console.log(`🔄 Rolling back migration: ${migrationName}`);
    await migration.down();
    await markAsUnapplied(migrationName);
    console.log(`✅ Rollback complete: ${migrationName}`);
  } catch (error) {
    console.error(`❌ Rollback failed`, error);
    process.exit(1);
  } finally {
    console.log(`[MIGRATION] Connection state before disconnect: ${db.getConnectionStateString()}`);
    
    // Always use the singleton to disconnect
    await db.disconnect();
    console.log('[MIGRATION] Disconnected from database');
  }
}

// Run migrations directly if called from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'up' || !command) {
    migrate().catch(console.error);
  } else if (command === 'down') {
    rollback(args[1]).catch(console.error);
  } else {
    console.log('Unknown command. Use "up" to apply migrations or "down" to rollback.');
  }
} 