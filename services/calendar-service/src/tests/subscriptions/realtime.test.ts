import { Event } from '../../models/Event';
import { Resource } from '../../models/Resource';
import { BusinessHours } from '../../models/BusinessHours';
import { eventResolvers } from '../../resolvers/eventResolvers';
import { resourceResolvers } from '../../resolvers/resourceResolvers';
import { businessHoursResolvers } from '../../resolvers/businessHoursResolvers';
import { setupTestDB, teardownTestDB, clearTestDB, createMockContext, createTestEvent, createTestResource } from '../testUtils';
import { EventType, UserRole } from '../../types';

describe('Calendar Real-time Subscription Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('Event Real-time Updates', () => {
    it('should notify subscribers of cascading updates', async () => {
      const context = createMockContext('tenant-1', UserRole.ADMIN);
      let eventUpdateCount = 0;
      let resourceUpdateCount = 0;

      // Set up subscriptions
      const eventSubscription = eventResolvers.Subscription.eventUpdated.subscribe(
        null,
        { tenantId: 'tenant-1' }
      );

      const resourceSubscription = resourceResolvers.Subscription.resourceUpdated.subscribe(
        null,
        { tenantId: 'tenant-1' }
      );

      // Listen for notifications
      eventSubscription.next().then(() => {
        eventUpdateCount++;
      });

      resourceSubscription.next().then(() => {
        resourceUpdateCount++;
      });

      // Create a resource
      const resource = await resourceResolvers.Mutation.createResource(
        null,
        { input: createTestResource() },
        context
      );

      // Create an event
      const event = await eventResolvers.Mutation.createEvent(
        null,
        {
          input: {
            title: 'Test Event',
            startTime: new Date(2024, 3, 20, 10, 0),
            endTime: new Date(2024, 3, 20, 11, 0),
            type: EventType.MEETING,
            resourceId: resource._id,
          },
        },
        context
      );

      // Update the resource
      await resourceResolvers.Mutation.updateResource(
        null,
        {
          id: resource._id,
          input: { ...createTestResource(), title: 'Updated Room' },
        },
        context
      );

      // Wait for notifications
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(eventUpdateCount).toBeGreaterThan(0);
      expect(resourceUpdateCount).toBeGreaterThan(0);
    });

    it('should handle concurrent subscription updates', async () => {
      const context = createMockContext('tenant-1', UserRole.ADMIN);
      const updates = new Set();

      // Set up multiple subscriptions
      const subscriptions = Array(5).fill(null).map(() =>
        eventResolvers.Subscription.eventUpdated.subscribe(
          null,
          { tenantId: 'tenant-1' }
        )
      );

      // Listen for notifications on all subscriptions
      subscriptions.forEach((subscription, index) => {
        subscription.next().then((result) => {
          updates.add(`subscription-${index}`);
        });
      });

      // Create an event
      await eventResolvers.Mutation.createEvent(
        null,
        {
          input: {
            title: 'Test Event',
            startTime: new Date(2024, 3, 20, 10, 0),
            endTime: new Date(2024, 3, 20, 11, 0),
            type: EventType.MEETING,
          },
        },
        context
      );

      // Wait for notifications
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(updates.size).toBe(5); // All subscriptions should be notified
    });
  });

  describe('Resource Availability Updates', () => {
    it('should notify subscribers of availability changes', async () => {
      const context = createMockContext('tenant-1', UserRole.ADMIN);
      let availabilityUpdated = false;

      // Create a resource
      const resource = await resourceResolvers.Mutation.createResource(
        null,
        {
          input: {
            title: 'Test Room',
            type: 'room',
            availability: [{
              dayOfWeek: 1,
              startTime: '09:00',
              endTime: '17:00',
            }],
          },
        },
        context
      );

      // Set up subscription
      const subscription = resourceResolvers.Subscription.resourceUpdated.subscribe(
        null,
        { tenantId: 'tenant-1' }
      );

      // Listen for notifications
      subscription.next().then(() => {
        availabilityUpdated = true;
      });

      // Create an event that affects availability
      await eventResolvers.Mutation.createEvent(
        null,
        {
          input: {
            title: 'Test Event',
            startTime: new Date(2024, 3, 20, 10, 0),
            endTime: new Date(2024, 3, 20, 11, 0),
            type: EventType.MEETING,
            resourceId: resource._id,
          },
        },
        context
      );

      // Wait for notifications
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(availabilityUpdated).toBe(true);
    });
  });

  describe('Business Hours Updates', () => {
    it('should notify subscribers of business hours changes', async () => {
      const context = createMockContext('tenant-1', UserRole.ADMIN);
      let hoursUpdated = false;

      // Create business hours
      const businessHours = await businessHoursResolvers.Mutation.createBusinessHours(
        null,
        {
          input: {
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '17:00',
            isOpen: true,
          },
        },
        context
      );

      // Set up subscription
      const subscription = businessHoursResolvers.Subscription.businessHoursUpdated.subscribe(
        null,
        { tenantId: 'tenant-1' }
      );

      // Listen for notifications
      subscription.next().then(() => {
        hoursUpdated = true;
      });

      // Update business hours
      await businessHoursResolvers.Mutation.updateBusinessHours(
        null,
        {
          id: businessHours._id,
          input: {
            dayOfWeek: 1,
            startTime: '10:00',
            endTime: '18:00',
            isOpen: true,
          },
        },
        context
      );

      // Wait for notifications
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(hoursUpdated).toBe(true);
    });
  });

  describe('Cross-Service Notifications', () => {
    it('should handle multi-tenant subscription filtering', async () => {
      const tenant1Context = createMockContext('tenant-1', UserRole.ADMIN);
      const tenant2Context = createMockContext('tenant-2', UserRole.ADMIN);
      let tenant1Updated = false;
      let tenant2Updated = false;

      // Set up subscriptions for both tenants
      const tenant1Sub = eventResolvers.Subscription.eventUpdated.subscribe(
        null,
        { tenantId: 'tenant-1' }
      );

      const tenant2Sub = eventResolvers.Subscription.eventUpdated.subscribe(
        null,
        { tenantId: 'tenant-2' }
      );

      // Listen for notifications
      tenant1Sub.next().then(() => {
        tenant1Updated = true;
      });

      tenant2Sub.next().then(() => {
        tenant2Updated = true;
      });

      // Create event for tenant 1
      await eventResolvers.Mutation.createEvent(
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

      // Wait for notifications
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(tenant1Updated).toBe(true);
      expect(tenant2Updated).toBe(false);
    });
  });
});