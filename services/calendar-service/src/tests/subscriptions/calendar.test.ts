import { Event } from '../../models/Event';
import { Resource } from '../../models/Resource';
import { eventResolvers } from '../../resolvers/eventResolvers';
import { resourceResolvers } from '../../resolvers/resourceResolvers';
import { businessHoursResolvers } from '../../resolvers/businessHoursResolvers';
import { setupTestDB, teardownTestDB, clearTestDB, createMockContext, createTestEvent, createTestResource } from '../testUtils';
import { EventType, UserRole } from '../../types';

describe('Calendar Subscription Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('Event Subscriptions', () => {
    it('should notify subscribers when an event is created', async () => {
      const context = createMockContext('tenant-1', UserRole.ADMIN);
      let notificationReceived = false;

      // Set up subscription
      const subscription = eventResolvers.Subscription.eventUpdated.subscribe(
        null,
        { tenantId: 'tenant-1' }
      );

      // Listen for notifications
      subscription.next().then((result) => {
        expect(result.value.eventUpdated).toBeDefined();
        expect(result.value.eventUpdated.title).toBe('New Event');
        notificationReceived = true;
      });

      // Create an event
      const eventInput = {
        title: 'New Event',
        startTime: new Date('2024-03-20T10:00:00Z'),
        endTime: new Date('2024-03-20T11:00:00Z'),
        type: EventType.MEETING,
      };

      await eventResolvers.Mutation.createEvent(
        null,
        { input: eventInput },
        context
      );

      // Wait for notification
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(notificationReceived).toBe(true);
    });

    it('should only notify relevant tenant subscribers', async () => {
      const context1 = createMockContext('tenant-1', UserRole.ADMIN);
      const context2 = createMockContext('tenant-2', UserRole.ADMIN);
      let tenant1Notified = false;
      let tenant2Notified = false;

      // Set up subscriptions
      const subscription1 = eventResolvers.Subscription.eventUpdated.subscribe(
        null,
        { tenantId: 'tenant-1' }
      );

      const subscription2 = eventResolvers.Subscription.eventUpdated.subscribe(
        null,
        { tenantId: 'tenant-2' }
      );

      // Listen for notifications
      subscription1.next().then((result) => {
        tenant1Notified = true;
      });

      subscription2.next().then((result) => {
        tenant2Notified = true;
      });

      // Create an event for tenant 1
      const eventInput = {
        title: 'Tenant 1 Event',
        startTime: new Date('2024-03-20T10:00:00Z'),
        endTime: new Date('2024-03-20T11:00:00Z'),
        type: EventType.MEETING,
      };

      await eventResolvers.Mutation.createEvent(
        null,
        { input: eventInput },
        context1
      );

      // Wait for notifications
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(tenant1Notified).toBe(true);
      expect(tenant2Notified).toBe(false);
    });
  });

  describe('Resource Subscriptions', () => {
    it('should notify subscribers when a resource is updated', async () => {
      const context = createMockContext('tenant-1', UserRole.ADMIN);
      let notificationReceived = false;

      // Create a resource
      const resource = await resourceResolvers.Mutation.createResource(
        null,
        { input: createTestResource() },
        context
      );

      // Set up subscription
      const subscription = resourceResolvers.Subscription.resourceUpdated.subscribe(
        null,
        { tenantId: 'tenant-1' }
      );

      // Listen for notifications
      subscription.next().then((result) => {
        expect(result.value.resourceUpdated).toBeDefined();
        expect(result.value.resourceUpdated.title).toBe('Updated Resource');
        notificationReceived = true;
      });

      // Update the resource
      const updateInput = {
        ...createTestResource(),
        title: 'Updated Resource',
      };

      await resourceResolvers.Mutation.updateResource(
        null,
        { id: resource._id, input: updateInput },
        context
      );

      // Wait for notification
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(notificationReceived).toBe(true);
    });
  });

  describe('Business Hours Subscriptions', () => {
    it('should notify subscribers when business hours are updated', async () => {
      const context = createMockContext('tenant-1', UserRole.ADMIN);
      let notificationReceived = false;

      // Create business hours
      const businessHours = await businessHoursResolvers.Mutation.createBusinessHours(
        null,
        { input: { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isOpen: true } },
        context
      );

      // Set up subscription
      const subscription = businessHoursResolvers.Subscription.businessHoursUpdated.subscribe(
        null,
        { tenantId: 'tenant-1' }
      );

      // Listen for notifications
      subscription.next().then((result) => {
        expect(result.value.businessHoursUpdated).toBeDefined();
        expect(result.value.businessHoursUpdated.startTime).toBe('10:00');
        notificationReceived = true;
      });

      // Update business hours
      await businessHoursResolvers.Mutation.updateBusinessHours(
        null,
        {
          id: businessHours._id,
          input: { dayOfWeek: 1, startTime: '10:00', endTime: '18:00', isOpen: true },
        },
        context
      );

      // Wait for notification
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(notificationReceived).toBe(true);
    });
  });
});