import { Event } from '../../models/Event';
import { Resource } from '../../models/Resource';
import { BusinessHours } from '../../models/BusinessHours';
import { eventResolvers } from '../../resolvers/eventResolvers';
import { resourceResolvers } from '../../resolvers/resourceResolvers';
import { businessHoursResolvers } from '../../resolvers/businessHoursResolvers';
import { setupTestDB, teardownTestDB, clearTestDB, createMockContext, createTestEvent, createTestResource } from '../testUtils';
import { EventType, UserRole } from '../../types';
import { GraphQLError } from 'graphql';

describe('Calendar Error Handling Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('Input Validation Errors', () => {
    it('should handle invalid event dates', async () => {
      const context = createMockContext('tenant-1', UserRole.ADMIN);
      
      await expect(
        eventResolvers.Mutation.createEvent(
          null,
          {
            input: {
              title: 'Invalid Event',
              startTime: new Date(2024, 3, 20, 10, 0),
              endTime: new Date(2024, 3, 20, 9, 0), // End time before start time
              type: EventType.MEETING,
            },
          },
          context
        )
      ).rejects.toThrow(GraphQLError);
    });

    it('should handle missing required fields', async () => {
      const context = createMockContext('tenant-1', UserRole.ADMIN);
      
      await expect(
        eventResolvers.Mutation.createEvent(
          null,
          {
            input: {
              // Missing title
              startTime: new Date(2024, 3, 20, 10, 0),
              endTime: new Date(2024, 3, 20, 11, 0),
              type: EventType.MEETING,
            } as any,
          },
          context
        )
      ).rejects.toThrow(GraphQLError);
    });

    it('should handle invalid business hours format', async () => {
      const context = createMockContext('tenant-1', UserRole.ADMIN);
      
      await expect(
        businessHoursResolvers.Mutation.createBusinessHours(
          null,
          {
            input: {
              dayOfWeek: 8, // Invalid day (should be 0-6)
              startTime: '09:00',
              endTime: '17:00',
              isOpen: true,
            },
          },
          context
        )
      ).rejects.toThrow(GraphQLError);
    });
  });

  describe('Authorization Errors', () => {
    it('should handle unauthorized resource access', async () => {
      const userContext = createMockContext('tenant-1', UserRole.USER);
      const adminContext = createMockContext('tenant-1', UserRole.ADMIN);
      
      // Create resource as admin
      const resource = await resourceResolvers.Mutation.createResource(
        null,
        { input: createTestResource() },
        adminContext
      );

      // Try to update as regular user
      await expect(
        resourceResolvers.Mutation.updateResource(
          null,
          {
            id: resource._id,
            input: { ...createTestResource(), title: 'Updated Title' },
          },
          userContext
        )
      ).rejects.toThrow(GraphQLError);
    });

    it('should handle cross-tenant access attempts', async () => {
      const tenant1Context = createMockContext('tenant-1', UserRole.ADMIN);
      const tenant2Context = createMockContext('tenant-2', UserRole.ADMIN);
      
      // Create event in tenant 1
      const event = await eventResolvers.Mutation.createEvent(
        null,
        {
          input: {
            title: 'Tenant 1 Event',
            startTime: new Date(2024, 3, 20, 10, 0),
            endTime: new Date(2024, 3, 20, 11, 0),
            type: EventType.MEETING,
          },
        },
        tenant1Context
      );

      // Try to access from tenant 2
      await expect(
        eventResolvers.Query.getEvent(
          null,
          { id: event._id },
          tenant2Context
        )
      ).rejects.toThrow(GraphQLError);
    });
  });

  describe('Resource Constraint Errors', () => {
    it('should handle overlapping event creation', async () => {
      const context = createMockContext('tenant-1', UserRole.ADMIN);
      const resource = await resourceResolvers.Mutation.createResource(
        null,
        { input: createTestResource() },
        context
      );

      // Create first event
      await eventResolvers.Mutation.createEvent(
        null,
        {
          input: {
            title: 'First Event',
            startTime: new Date(2024, 3, 20, 10, 0),
            endTime: new Date(2024, 3, 20, 11, 0),
            type: EventType.MEETING,
            resourceId: resource._id,
          },
        },
        context
      );

      // Try to create overlapping event
      await expect(
        eventResolvers.Mutation.createEvent(
          null,
          {
            input: {
              title: 'Overlapping Event',
              startTime: new Date(2024, 3, 20, 10, 30),
              endTime: new Date(2024, 3, 20, 11, 30),
              type: EventType.MEETING,
              resourceId: resource._id,
            },
          },
          context
        )
      ).rejects.toThrow(GraphQLError);
    });

    it('should handle non-existent resource references', async () => {
      const context = createMockContext('tenant-1', UserRole.ADMIN);
      
      await expect(
        eventResolvers.Mutation.createEvent(
          null,
          {
            input: {
              title: 'Event with Invalid Resource',
              startTime: new Date(2024, 3, 20, 10, 0),
              endTime: new Date(2024, 3, 20, 11, 0),
              type: EventType.MEETING,
              resourceId: '000000000000000000000000', // Non-existent resource
            },
          },
          context
        )
      ).rejects.toThrow(GraphQLError);
    });
  });

  describe('Data Integrity Errors', () => {
    it('should handle deletion of resource with associated events', async () => {
      const context = createMockContext('tenant-1', UserRole.ADMIN);
      const resource = await resourceResolvers.Mutation.createResource(
        null,
        { input: createTestResource() },
        context
      );

      // Create event using resource
      await eventResolvers.Mutation.createEvent(
        null,
        {
          input: {
            title: 'Event with Resource',
            startTime: new Date(2024, 3, 20, 10, 0),
            endTime: new Date(2024, 3, 20, 11, 0),
            type: EventType.MEETING,
            resourceId: resource._id,
          },
        },
        context
      );

      // Delete resource
      await resourceResolvers.Mutation.deleteResource(
        null,
        { id: resource._id },
        context
      );

      // Verify associated events are handled
      const events = await Event.find({ resourceId: resource._id });
      expect(events).toHaveLength(0);
    });

    it('should handle invalid date range queries', async () => {
      const context = createMockContext('tenant-1', UserRole.ADMIN);
      
      await expect(
        eventResolvers.Query.listEvents(
          null,
          {
            startDate: new Date(2024, 3, 20, 10, 0),
            endDate: new Date(2024, 3, 19, 10, 0), // End date before start date
            page: 1,
            pageSize: 10,
          },
          context
        )
      ).rejects.toThrow(GraphQLError);
    });
  });
}); 