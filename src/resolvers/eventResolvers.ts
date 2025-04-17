import { PubSub } from 'graphql-subscriptions';
import { GraphQLError } from 'graphql';
import { Event, IEvent } from '../models/Event';
import { AuthContext } from '../middleware/auth';
import { validateEventInput } from '../middleware/validation';
import { EventInput, PaginationInput, CalendarViewFilter } from '../types';
import { errorMessages } from '../config';
import { toPlainObject } from '../utils';
import { Context } from '../types';
import { withTenantIsolation, withRBAC, addTenantFilter } from '../middleware/tenantSecurity';

const pubsub = new PubSub();
const EVENT_UPDATED = 'EVENT_UPDATED';

interface EventMutationInput {
  input: EventInput;
}

// Base resolver implementations
const baseResolvers = {
  Query: {
    events: async (_: any, 
      { filter, pagination = { page: 1, limit: 20 } }: { filter?: CalendarViewFilter; pagination?: PaginationInput },
      context: Context
    ) => {
      // Start with basic query that enforces tenant isolation
      const query = filter ? { ...filter } : {};
      const tenantQuery = addTenantFilter(query, context);
      
      // Build filtering conditions
      if (tenantQuery.startDate || tenantQuery.endDate) {
        tenantQuery.$and = tenantQuery.$and || [];
        if (tenantQuery.startDate) {
          tenantQuery.$and.push({ startTime: { $gte: tenantQuery.startDate } });
          delete tenantQuery.startDate;
        }
        if (tenantQuery.endDate) {
          tenantQuery.$and.push({ endTime: { $lte: tenantQuery.endDate } });
          delete tenantQuery.endDate;
        }
      }
      
      // Add status filter if provided
      if (tenantQuery.status) {
        // Keep status filter as is
      }

      if (tenantQuery.resourceId) {
        // Keep resourceId filter as is
      }

      // Ensure pagination values are numbers with defaults
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      
      // Execute query with pagination
      const totalItems = await Event.countDocuments(tenantQuery);
      const totalPages = Math.ceil(totalItems / limit);
      const skip = (page - 1) * limit;

      const events = await Event.find(tenantQuery)
        .sort({ startTime: 1 })
        .skip(skip)
        .limit(limit);

      // Return connection structure
      return {
        edges: events,
        pageInfo: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    },

    event: async (_: any, { id }: { id: string }, context: Context) => {
      // Find document with tenant isolation
      const event = await Event.findOne({ 
        _id: id, 
        tenantId: context.user?.tenantId 
      });
      return event;
    },
  },

  Mutation: {
    createEvent: async (_: any, 
      { input }: { input: Partial<IEvent> },
      context: Context
    ) => {
      // Validate input
      validateEventInput(input as EventInput);

      // Create event with tenant ID from context
      const event = new Event({
        ...input,
        tenantId: context.user?.tenantId,
        createdBy: context.user?.id,
      });
      
      await event.save();

      // Publish event update with tenant-specific channel
      pubsub.publish(`${EVENT_UPDATED}.${context.user?.tenantId}`, {
        eventUpdated: event
      });

      return event;
    },

    updateEvent: async (_: any, 
      { id, input }: { id: string; input: Partial<IEvent> },
      context: Context
    ) => {
      // Validate input
      validateEventInput(input as EventInput);

      // Update with tenant isolation
      const event = await Event.findOneAndUpdate(
        { _id: id, tenantId: context.user?.tenantId },
        { $set: input },
        { new: true }
      );
      
      if (!event) {
        throw new GraphQLError(errorMessages.NOT_FOUND, {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      // Publish event update
      pubsub.publish(`${EVENT_UPDATED}.${context.user?.tenantId}`, {
        eventUpdated: event
      });

      return event;
    },

    deleteEvent: async (_: any, 
      { id }: { id: string },
      context: Context
    ) => {
      // Delete with tenant isolation
      const result = await Event.deleteOne({ 
        _id: id, 
        tenantId: context.user?.tenantId 
      });
      
      if (result.deletedCount === 0) {
        throw new GraphQLError(errorMessages.NOT_FOUND, {
          extensions: { code: 'NOT_FOUND' }
        });
      }
      
      return true;
    },

    batchUpdateEventStatus: async (_: any,
      { ids, status }: { ids: string[]; status: string },
      context: Context
    ) => {
      // Update with tenant isolation
      const updateResult = await Event.updateMany(
        { 
          _id: { $in: ids },
          tenantId: context.user?.tenantId 
        },
        { $set: { status } }
      );

      if (updateResult.matchedCount === 0) {
        throw new GraphQLError(errorMessages.NOT_FOUND, {
          extensions: { code: 'NOT_FOUND' }
        });
      }
      
      // Get updated documents
      const updatedEvents = await Event.find({
        _id: { $in: ids },
        tenantId: context.user?.tenantId
      });

      // Publish updates for each event
      updatedEvents.forEach(event => {
        pubsub.publish(`${EVENT_UPDATED}.${context.user?.tenantId}`, {
          eventUpdated: event
        });
      });

      return updatedEvents;
    }
  },

  Subscription: {
    eventUpdated: {
      subscribe: (_: unknown, { tenantId }: { tenantId: string }) => {
        // Subscriptions are filtered by tenant ID in the channel name
        return pubsub.asyncIterator(`${EVENT_UPDATED}.${tenantId}`);
      }
    },
  },
};

// Apply middleware to base resolvers
export const eventResolvers = {
  Query: {
    events: withTenantIsolation(baseResolvers.Query.events),
    event: withTenantIsolation(baseResolvers.Query.event),
  },
  Mutation: {
    createEvent: withRBAC(baseResolvers.Mutation.createEvent, ['ADMIN', 'MANAGER', 'STYLIST']),
    updateEvent: withRBAC(baseResolvers.Mutation.updateEvent, ['ADMIN', 'MANAGER', 'STYLIST']),
    deleteEvent: withRBAC(baseResolvers.Mutation.deleteEvent, ['ADMIN', 'MANAGER']),
    batchUpdateEventStatus: withRBAC(baseResolvers.Mutation.batchUpdateEventStatus, ['ADMIN', 'MANAGER']),
  },
  Subscription: baseResolvers.Subscription
}; 
}; 