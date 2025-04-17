import { Event, IEvent } from '../models/Event';
import { eventResolvers } from '../resolvers/eventResolvers';
import { setupTestDB, teardownTestDB, clearTestDB, createMockContext, createTestEvent } from './testUtils';
import { GraphQLError } from 'graphql';
import { EventType } from '../types';
import { Document, Types } from 'mongoose';

describe('Event Resolvers', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('Query', () => {
    describe('getEvent', () => {
      it('should return an event when it exists and belongs to the tenant', async () => {
        const context = createMockContext();
        const testEvent = new Event(createTestEvent()) as Document<unknown, {}, IEvent> & IEvent & { _id: Types.ObjectId };
        await testEvent.save();

        const result = await eventResolvers.Query.getEvent(
          null,
          { id: testEvent._id.toString() },
          context
        );

        expect(result).toBeDefined();
        expect(result.title).toBe('Test Event');
        expect(result.tenantId).toBe(context.tenantId);
      });

      it('should throw NOT_FOUND when event does not exist', async () => {
        const context = createMockContext();
        await expect(
          eventResolvers.Query.getEvent(
            null,
            { id: '507f1f77bcf86cd799439011' },
            context
          )
        ).rejects.toThrow(GraphQLError);
      });

      it('should not return event from different tenant', async () => {
        const testEvent = new Event(createTestEvent({ tenantId: 'other-tenant' })) as Document<unknown, {}, IEvent> & IEvent & { _id: Types.ObjectId };
        await testEvent.save();

        const context = createMockContext();
        await expect(
          eventResolvers.Query.getEvent(
            null,
            { id: testEvent._id.toString() },
            context
          )
        ).rejects.toThrow(GraphQLError);
      });
    });

    describe('listEvents', () => {
      it('should return paginated events for tenant', async () => {
        const context = createMockContext();
        const events = [
          createTestEvent({ title: 'Event 1' }),
          createTestEvent({ title: 'Event 2' }),
          createTestEvent({ title: 'Event 3' }),
        ];
        await Event.insertMany(events);

        const result = await eventResolvers.Query.listEvents(
          null,
          { page: 1, pageSize: 2 },
          context
        );

        expect(result.items).toHaveLength(2);
        expect(result.total).toBe(3);
        expect(result.totalPages).toBe(2);
      });

      it('should filter events by date range', async () => {
        const context = createMockContext();
        await Event.insertMany([
          createTestEvent({
            startTime: new Date('2024-03-20T10:00:00Z'),
            endTime: new Date('2024-03-20T11:00:00Z'),
          }),
          createTestEvent({
            startTime: new Date('2024-03-21T10:00:00Z'),
            endTime: new Date('2024-03-21T11:00:00Z'),
          }),
        ]);

        const result = await eventResolvers.Query.listEvents(
          null,
          {
            startDate: new Date('2024-03-20T00:00:00Z'),
            endDate: new Date('2024-03-20T23:59:59Z'),
          },
          context
        );

        expect(result.items).toHaveLength(1);
      });
    });
  });

  describe('Mutation', () => {
    describe('createEvent', () => {
      it('should create event and return it', async () => {
        const context = createMockContext();
        const input = {
          title: 'New Event',
          startTime: new Date('2024-03-20T10:00:00Z'),
          endTime: new Date('2024-03-20T11:00:00Z'),
          type: EventType.APPOINTMENT,
        };

        const result = await eventResolvers.Mutation.createEvent(
          null,
          { input },
          context
        );

        expect(result).toBeDefined();
        expect(result.title).toBe(input.title);
        expect(result.tenantId).toBe(context.tenantId);

        const savedEvent = await Event.findById(result._id);
        expect(savedEvent).toBeDefined();
        expect(savedEvent?.tenantId).toBe(context.tenantId);
      });

      it('should validate event input', async () => {
        const context = createMockContext();
        const input = {
          title: '', // Invalid: empty title
          startTime: new Date('2024-03-20T10:00:00Z'),
          endTime: new Date('2024-03-20T11:00:00Z'),
          type: EventType.APPOINTMENT,
        };

        await expect(
          eventResolvers.Mutation.createEvent(null, { input }, context)
        ).rejects.toThrow(GraphQLError);
      });
    });

    describe('updateEvent', () => {
      it('should update event when it exists and belongs to tenant', async () => {
        const context = createMockContext();
        const testEvent = new Event(createTestEvent()) as Document<unknown, {}, IEvent> & IEvent & { _id: Types.ObjectId };
        await testEvent.save();

        const input = {
          title: 'Updated Event',
          startTime: new Date('2024-03-20T11:00:00Z'),
          endTime: new Date('2024-03-20T12:00:00Z'),
          type: EventType.APPOINTMENT,
        };

        const result = await eventResolvers.Mutation.updateEvent(
          null,
          { id: testEvent._id.toString(), input },
          context
        );

        expect(result.title).toBe('Updated Event');
        const updatedEvent = await Event.findById(testEvent._id);
        expect(updatedEvent?.title).toBe('Updated Event');
      });

      it('should not update event from different tenant', async () => {
        const testEvent = new Event(createTestEvent({ tenantId: 'other-tenant' })) as Document<unknown, {}, IEvent> & IEvent & { _id: Types.ObjectId };
        await testEvent.save();

        const context = createMockContext();
        const input = {
          title: 'Updated Event',
          startTime: new Date('2024-03-20T11:00:00Z'),
          endTime: new Date('2024-03-20T12:00:00Z'),
          type: EventType.APPOINTMENT,
        };

        await expect(
          eventResolvers.Mutation.updateEvent(
            null,
            { id: testEvent._id.toString(), input },
            context
          )
        ).rejects.toThrow(GraphQLError);
      });
    });

    describe('deleteEvent', () => {
      it('should delete event when it exists and belongs to tenant', async () => {
        const context = createMockContext();
        const testEvent = new Event(createTestEvent()) as Document<unknown, {}, IEvent> & IEvent & { _id: Types.ObjectId };
        await testEvent.save();

        const result = await eventResolvers.Mutation.deleteEvent(
          null,
          { id: testEvent._id.toString() },
          context
        );

        expect(result).toBe(true);
        const deletedEvent = await Event.findById(testEvent._id);
        expect(deletedEvent).toBeNull();
      });

      it('should not delete event from different tenant', async () => {
        const testEvent = new Event(createTestEvent({ tenantId: 'other-tenant' })) as Document<unknown, {}, IEvent> & IEvent & { _id: Types.ObjectId };
        await testEvent.save();

        const context = createMockContext();
        await expect(
          eventResolvers.Mutation.deleteEvent(
            null,
            { id: testEvent._id.toString() },
            context
          )
        ).rejects.toThrow(GraphQLError);

        const eventStillExists = await Event.findById(testEvent._id);
        expect(eventStillExists).toBeDefined();
      });
    });
  });
});