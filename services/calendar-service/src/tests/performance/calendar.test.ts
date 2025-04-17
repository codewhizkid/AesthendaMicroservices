import { Event } from '../../models/Event';
import { Resource } from '../../models/Resource';
import { eventResolvers } from '../../resolvers/eventResolvers';
import { resourceResolvers } from '../../resolvers/resourceResolvers';
import { setupTestDB, teardownTestDB, clearTestDB, createMockContext, createTestEvent, createTestResource } from '../testUtils';
import { EventType, UserRole } from '../../types';

describe('Calendar Performance Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('Bulk Operations', () => {
    it('should handle bulk event creation efficiently', async () => {
      const context = createMockContext('tenant-1', UserRole.ADMIN);
      const resource = await resourceResolvers.Mutation.createResource(
        null,
        { input: createTestResource() },
        context
      );

      const startTime = Date.now();
      const events = [];
      
      // Create 100 events
      for (let i = 0; i < 100; i++) {
        const event = await eventResolvers.Mutation.createEvent(
          null,
          {
            input: {
              title: `Event ${i}`,
              startTime: new Date(2024, 3, 20, 9 + Math.floor(i / 4), (i % 4) * 15),
              endTime: new Date(2024, 3, 20, 9 + Math.floor(i / 4), (i % 4) * 15 + 15),
              type: EventType.MEETING,
              resourceId: resource._id,
            },
          },
          context
        );
        events.push(event);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify performance
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(events).toHaveLength(100);
    });

    it('should efficiently query events with complex filters', async () => {
      const context = createMockContext('tenant-1', UserRole.ADMIN);
      const resource = await resourceResolvers.Mutation.createResource(
        null,
        { input: createTestResource() },
        context
      );

      // Create test data
      const events = [];
      for (let i = 0; i < 50; i++) {
        events.push({
          title: `Event ${i}`,
          startTime: new Date(2024, 3, 20, 9 + Math.floor(i / 4), (i % 4) * 15),
          endTime: new Date(2024, 3, 20, 9 + Math.floor(i / 4), (i % 4) * 15 + 15),
          type: EventType.MEETING,
          resourceId: resource._id,
          tenantId: 'tenant-1',
        });
      }
      await Event.insertMany(events);

      const startTime = Date.now();
      
      // Perform complex query
      const result = await eventResolvers.Query.listEvents(
        null,
        {
          startDate: new Date(2024, 3, 20, 9, 0),
          endDate: new Date(2024, 3, 20, 17, 0),
          page: 1,
          pageSize: 25,
        },
        context
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify performance
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(result.items.length).toBeLessThanOrEqual(25);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent event creations', async () => {
      const context = createMockContext('tenant-1', UserRole.ADMIN);
      const resource = await resourceResolvers.Mutation.createResource(
        null,
        { input: createTestResource() },
        context
      );

      const createEventPromises = Array(10).fill(null).map((_, index) => 
        eventResolvers.Mutation.createEvent(
          null,
          {
            input: {
              title: `Concurrent Event ${index}`,
              startTime: new Date(2024, 3, 20, 9 + index, 0),
              endTime: new Date(2024, 3, 20, 9 + index, 30),
              type: EventType.MEETING,
              resourceId: resource._id,
            },
          },
          context
        )
      );

      const startTime = Date.now();
      const results = await Promise.all(createEventPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify performance and results
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(results).toHaveLength(10);
      expect(new Set(results.map(r => r._id)).size).toBe(10); // All events should have unique IDs
    });
  });

  describe('Resource Availability', () => {
    it('should efficiently list resources with availability', async () => {
      const context = createMockContext('tenant-1', UserRole.ADMIN);
      const resource = await resourceResolvers.Mutation.createResource(
        null,
        { input: createTestResource() },
        context
      );

      // Create 50 events for the resource
      const events = [];
      for (let i = 0; i < 50; i++) {
        events.push({
          title: `Event ${i}`,
          startTime: new Date(2024, 3, 20, 9 + i % 8, 0),
          endTime: new Date(2024, 3, 20, 9 + i % 8, 30),
          type: EventType.MEETING,
          resourceId: resource._id,
          tenantId: 'tenant-1',
        });
      }
      await Event.insertMany(events);

      const startTime = Date.now();
      
      // Query resources
      const result = await resourceResolvers.Query.listResources(
        null,
        {
          type: 'room',
          page: 1,
          pageSize: 25,
        },
        context
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify performance
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(result.items).toBeDefined();
    });
  });

  describe('Event Filtering', () => {
    it('should efficiently filter events by date range', async () => {
      const context = createMockContext('tenant-1', UserRole.ADMIN);
      
      // Create 100 events
      const events = [];
      for (let i = 0; i < 100; i++) {
        events.push({
          title: `Event ${i}`,
          startTime: new Date(2024, 3, 20, 9 + Math.floor(i / 4), (i % 4) * 15),
          endTime: new Date(2024, 3, 20, 9 + Math.floor(i / 4), (i % 4) * 15 + 15),
          type: EventType.MEETING,
          tenantId: 'tenant-1',
        });
      }
      await Event.insertMany(events);

      const startTime = Date.now();
      
      // Filter events
      const result = await eventResolvers.Query.listEvents(
        null,
        {
          startDate: new Date(2024, 3, 20, 9, 0),
          endDate: new Date(2024, 3, 20, 17, 0),
          page: 1,
          pageSize: 25,
        },
        context
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify performance
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(result.items.length).toBeLessThanOrEqual(25);
      expect(result.total).toBeGreaterThan(0);
    });
  });
}); 