import { Event } from '../../models/Event';
import { eventResolvers } from '../../resolvers/eventResolvers';
import { resourceResolvers } from '../../resolvers/resourceResolvers';
import { businessHoursResolvers } from '../../resolvers/businessHoursResolvers';
import { setupTestDB, teardownTestDB, clearTestDB, createMockContext, createTestEvent, createTestResource, createTestBusinessHours } from '../testUtils';
import { EventType, UserRole } from '../../types';

describe('Calendar Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('Resource and Event Interaction', () => {
    it('should create an event with a resource and verify resource availability', async () => {
      const context = createMockContext('tenant-1', UserRole.ADMIN);
      
      // Create a resource first
      const resourceInput = {
        title: 'Test Room',
        type: 'room',
        availability: [{
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
        }],
      };

      const resource = await resourceResolvers.Mutation.createResource(
        null,
        { input: resourceInput },
        context
      );

      // Create an event using that resource
      const eventInput = {
        title: 'Meeting',
        startTime: new Date('2024-03-20T10:00:00Z'),
        endTime: new Date('2024-03-20T11:00:00Z'),
        type: EventType.MEETING,
        resourceId: resource._id,
      };

      const event = await eventResolvers.Mutation.createEvent(
        null,
        { input: eventInput },
        context
      );

      expect(event.resourceId).toBe(resource._id);
    });

    it('should respect business hours when creating events', async () => {
      const context = createMockContext('tenant-1', UserRole.ADMIN);
      
      // Set up business hours
      const businessHoursInput = {
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '17:00',
        isOpen: true,
      };

      await businessHoursResolvers.Mutation.createBusinessHours(
        null,
        { input: businessHoursInput },
        context
      );

      // Create a resource
      const resource = await resourceResolvers.Mutation.createResource(
        null,
        { input: createTestResource() },
        context
      );

      // Try to create an event outside business hours
      const eventInput = {
        title: 'Late Meeting',
        startTime: new Date('2024-03-20T18:00:00Z'), // 6 PM
        endTime: new Date('2024-03-20T19:00:00Z'), // 7 PM
        type: EventType.MEETING,
        resourceId: resource._id,
      };

      await expect(
        eventResolvers.Mutation.createEvent(null, { input: eventInput }, context)
      ).rejects.toThrow();
    });
  });

  describe('Complex Calendar Operations', () => {
    it('should handle overlapping event creation with resource constraints', async () => {
      const context = createMockContext('tenant-1', UserRole.ADMIN);
      
      // Create a resource
      const resource = await resourceResolvers.Mutation.createResource(
        null,
        { input: createTestResource() },
        context
      );

      // Create first event
      const event1Input = {
        title: 'First Meeting',
        startTime: new Date('2024-03-20T10:00:00Z'),
        endTime: new Date('2024-03-20T11:00:00Z'),
        type: EventType.MEETING,
        resourceId: resource._id,
      };

      await eventResolvers.Mutation.createEvent(
        null,
        { input: event1Input },
        context
      );

      // Try to create overlapping event
      const event2Input = {
        title: 'Overlapping Meeting',
        startTime: new Date('2024-03-20T10:30:00Z'),
        endTime: new Date('2024-03-20T11:30:00Z'),
        type: EventType.MEETING,
        resourceId: resource._id,
      };

      await expect(
        eventResolvers.Mutation.createEvent(null, { input: event2Input }, context)
      ).rejects.toThrow();
    });

    it('should handle resource deletion with associated events', async () => {
      const context = createMockContext('tenant-1', UserRole.ADMIN);
      
      // Create a resource
      const resource = await resourceResolvers.Mutation.createResource(
        null,
        { input: createTestResource() },
        context
      );

      // Create an event using that resource
      const eventInput = {
        title: 'Meeting',
        startTime: new Date('2024-03-20T10:00:00Z'),
        endTime: new Date('2024-03-20T11:00:00Z'),
        type: EventType.MEETING,
        resourceId: resource._id,
      };

      await eventResolvers.Mutation.createEvent(
        null,
        { input: eventInput },
        context
      );

      // Delete the resource
      await resourceResolvers.Mutation.deleteResource(
        null,
        { id: resource._id },
        context
      );

      // Verify that associated events are either deleted or updated
      const events = await Event.find({ resourceId: resource._id });
      expect(events).toHaveLength(0);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should enforce role-based permissions for calendar operations', async () => {
      // Regular user context
      const userContext = createMockContext('tenant-1', UserRole.USER);
      
      // Admin context
      const adminContext = createMockContext('tenant-1', UserRole.ADMIN);

      // Create a resource (should fail for regular user)
      const resourceInput = {
        title: 'Test Room',
        type: 'room',
        availability: [{
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
        }],
      };

      await expect(
        resourceResolvers.Mutation.createResource(null, { input: resourceInput }, userContext)
      ).rejects.toThrow();

      // Should succeed for admin
      const resource = await resourceResolvers.Mutation.createResource(
        null,
        { input: resourceInput },
        adminContext
      );

      expect(resource).toBeDefined();
    });
  });
}); 