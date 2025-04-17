import { Event } from '../models/Event';
import { Resource } from '../models/Resource';
import { Migration } from './migrationRunner';

/**
 * Migration to add compound indexes for tenant isolation
 */
const migration: Migration = {
  name: '20240408000001-add-tenant-id-index',
  
  up: async () => {
    // Add tenant ID indexes to all collections for performance
    console.log('Adding tenant ID indexes to Event collection');
    await Event.collection.createIndex({ tenantId: 1 });
    await Event.collection.createIndex({ tenantId: 1, startTime: 1, endTime: 1 });
    
    console.log('Adding tenant ID indexes to Resource collection');
    await Resource.collection.createIndex({ tenantId: 1 });
    await Resource.collection.createIndex({ tenantId: 1, type: 1 });
    
    console.log('Tenant ID indexes added successfully');
  },
  
  down: async () => {
    // Remove the indexes
    console.log('Removing tenant ID indexes from Event collection');
    await Event.collection.dropIndex({ tenantId: 1 });
    await Event.collection.dropIndex({ 'tenantId': 1, 'startTime': 1, 'endTime': 1 });
    
    console.log('Removing tenant ID indexes from Resource collection');
    await Resource.collection.dropIndex({ tenantId: 1 });
    await Resource.collection.dropIndex({ 'tenantId': 1, 'type': 1 });
    
    console.log('Tenant ID indexes removed successfully');
  }
};

export default migration; 