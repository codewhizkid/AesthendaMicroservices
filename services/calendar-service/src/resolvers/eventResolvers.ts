import { PubSub } from 'graphql-subscriptions';
import { GraphQLError } from 'graphql';
import { Event, IEvent } from '../models/Event';
import { AuthContext } from '../middleware/auth';
import { validateEventInput } from '../middleware/validation';
import { EventInput, PaginationInput, CalendarViewFilter, sanitizePagination } from '../types';
import { errorMessages } from '../config';
import { toPlainObject } from '../utils';
import { Context } from '../types';
import { isolatedModel, withTenantId } from '../middleware/tenantIsolation';
import { withRBAC } from '../utils/resolverUtils';

const pubsub = new PubSub();
const EVENT_UPDATED = 'EVENT_UPDATED';

/**
 * Event resolvers with tenant isolation
 * 
 * These resolvers leverage the tenant isolation middleware to ensure
 * all database operations are properly scoped to the current tenant.
 */
export const eventResolvers = {
  Query: {
    // List events with filtering and pagination
    events: withRBAC(
      async (_: any, 
        { filter, pagination }: { filter?: CalendarViewFilter; pagination?: PaginationInput },
        context: Context
      ) => {
        // Get tenant-isolated model
        const isolatedEvent = isolatedModel(Event, context);
        
        // Use pagination sanitization helper to enforce limits
        const sanitizedPagination = sanitizePagination(pagination);
        
        // Build query with filter options (all queries already tenant-isolated)
        const query: any = {};
        
        if (filter) {
          if (filter.startDate || filter.endDate) {
            query.$and = [];
            if (filter.startDate) query.$and.push({ startTime: { $gte: filter.startDate } });
            if (filter.endDate) query.$and.push({ endTime: { $lte: filter.endDate } });
          }
          
          if (filter.status) {
            query.status = filter.status;
          }

          if (filter.resourceId) {
            query.resourceId = filter.resourceId;
          }
          
          if (filter.eventType) {
            query.type = filter.eventType;
          }
        }

        try {
          // Query with tenant isolation built-in
          const totalItems = await isolatedEvent.find(query).countDocuments();
          const totalPages = Math.ceil(totalItems / sanitizedPagination.limit);
          const skip = (sanitizedPagination.page - 1) * sanitizedPagination.limit;

          const events = await isolatedEvent.find(query)
            .sort({ startTime: 1 })
            .skip(skip)
            .limit(sanitizedPagination.limit);

          return {
            edges: events,
            pageInfo: {
              currentPage: sanitizedPagination.page,
              totalPages,
              totalItems,
              itemsPerPage: sanitizedPagination.limit,
              hasNextPage: sanitizedPagination.page < totalPages,
              hasPreviousPage: sanitizedPagination.page > 1
            }
          };
        } catch (error) {
          console.error('Error fetching events:', error);
          throw new GraphQLError('Failed to fetch events', {
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
          });
        }
      },
      ['ADMIN', 'STAFF', 'CLIENT'] // Allowed roles
    ),

    // Get a single event by ID
    event: withRBAC(
      async (_: any, { id }: { id: string }, context: Context) => {
        const isolatedEvent = isolatedModel(Event, context);
        
        try {
          const event = await isolatedEvent.findById(id);
          
          if (!event) {
            throw new GraphQLError('Event not found', {
              extensions: { code: 'NOT_FOUND' }
            });
          }
          
          return event;
        } catch (error) {
          // If error is already a GraphQLError, rethrow it
          if (error instanceof GraphQLError) {
            throw error;
          }
          
          console.error('Error fetching event:', error);
          throw new GraphQLError('Failed to fetch event', {
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
          });
        }
      },
      ['ADMIN', 'STAFF', 'CLIENT'] // Allowed roles
    ),
  },

  Mutation: {
    // Create a new event
    createEvent: withRBAC(
      async (_: any, 
        { input }: { input: Partial<IEvent> },
        context: Context
      ) => {
        try {
          // Add tenant ID and creator ID to new event
          const event = new Event({
            ...input,
            tenantId: context.user.tenantId,
            createdBy: context.user.id,
          });
          
          // Save the document
          await event.save();

          // Publish event update
          pubsub.publish(`${EVENT_UPDATED}.${context.user.tenantId}`, {
            eventUpdated: event
          });

          return event;
        } catch (error) {
          console.error('Error creating event:', error);
          throw new GraphQLError('Failed to create event', {
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
          });
        }
      },
      ['ADMIN', 'STAFF'] // Only admins and staff can create events
    ),

    // Update an existing event
    updateEvent: withRBAC(
      async (_: any, 
        { id, input }: { id: string; input: Partial<IEvent> },
        context: Context
      ) => {
        try {
          const isolatedEvent = isolatedModel(Event, context);
          
          const event = await Event.findOneAndUpdate(
            { _id: id, tenantId: context.user.tenantId },
            { $set: input },
            { new: true }
          );
          
          if (!event) {
            throw new GraphQLError('Event not found', {
              extensions: { code: 'NOT_FOUND' }
            });
          }

          // Publish event update
          pubsub.publish(`${EVENT_UPDATED}.${context.user.tenantId}`, {
            eventUpdated: event
          });

          return event;
        } catch (error) {
          // If error is already a GraphQLError, rethrow it
          if (error instanceof GraphQLError) {
            throw error;
          }
          
          console.error('Error updating event:', error);
          throw new GraphQLError('Failed to update event', {
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
          });
        }
      },
      ['ADMIN', 'STAFF'] // Only admins and staff can update events
    ),

    // Delete an event
    deleteEvent: withRBAC(
      async (_: any, 
        { id }: { id: string },
        context: Context
      ) => {
        try {
          const isolatedEvent = isolatedModel(Event, context);
          
          const result = await isolatedEvent.deleteOne({ _id: id });
          
          if (result.deletedCount === 0) {
            throw new GraphQLError('Event not found', {
              extensions: { code: 'NOT_FOUND' }
            });
          }
          
          return true;
        } catch (error) {
          // If error is already a GraphQLError, rethrow it
          if (error instanceof GraphQLError) {
            throw error;
          }
          
          console.error('Error deleting event:', error);
          throw new GraphQLError('Failed to delete event', {
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
          });
        }
      },
      ['ADMIN', 'STAFF'] // Only admins and staff can delete events
    ),

    // Batch update event statuses
    batchUpdateEventStatus: withRBAC(
      async (_: any,
        { ids, status }: { ids: string[]; status: string },
        context: Context
      ) => {
        try {
          const isolatedEvent = isolatedModel(Event, context);
          
          // Update events in batch (tenant filter is applied automatically)
          await Event.updateMany(
            { _id: { $in: ids }, tenantId: context.user.tenantId },
            { $set: { status } }
          );

          // Fetch updated events to return and publish
          const updatedEvents = await isolatedEvent.find({ _id: { $in: ids } });
          
          if (updatedEvents.length === 0) {
            throw new GraphQLError('No events found to update', {
              extensions: { code: 'NOT_FOUND' }
            });
          }

          // Publish updates for each event
          updatedEvents.forEach(event => {
            pubsub.publish(`${EVENT_UPDATED}.${context.user.tenantId}`, {
              eventUpdated: event
            });
          });

          return updatedEvents;
        } catch (error) {
          // If error is already a GraphQLError, rethrow it
          if (error instanceof GraphQLError) {
            throw error;
          }
          
          console.error('Error batch updating events:', error);
          throw new GraphQLError('Failed to update events', {
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
          });
        }
      },
      ['ADMIN', 'STAFF'] // Only admins and staff can update events
    )
  },

  Subscription: {
    eventUpdated: {
      subscribe: (_: unknown, { tenantId }: { tenantId: string }) => {
        if (!tenantId) {
          throw new GraphQLError(errorMessages.TENANT_REQUIRED, {
            extensions: { code: 'BAD_REQUEST' }
          });
        }
        
        return pubsub.asyncIterator(`${EVENT_UPDATED}.${tenantId}`);
      },
    },
  },
}; 