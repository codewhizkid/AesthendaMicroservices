import { PubSub } from 'graphql-subscriptions';
import { GraphQLError } from 'graphql';
import { Event } from '../models/Event';
import { 
  EventInput, 
  MutationCreateEventArgs,
  MutationUpdateEventArgs,
  MutationDeleteEventArgs,
  MutationBatchUpdateEventStatusArgs,
  QueryEventArgs,
  QueryEventsArgs,
  SubscriptionEventUpdatedArgs,
  UserRole
} from '../generated/graphql';
import { 
  createTypeSafeQueryResolvers, 
  createTypeSafeMutationResolvers,
  createTypeSafeSubscriptionResolvers,
  createTypeSafeResolvers,
  createProtectedResolver
} from '../utils/resolverTypesUtils';
import { createIsolatedModel } from '../utils/resolverTypesUtils';
import { Context } from '../types';
import { sanitizePagination } from '../types';

// Setup PubSub for subscriptions
const pubsub = new PubSub();
const EVENT_UPDATED = 'EVENT_UPDATED';

/**
 * Type-safe event query resolvers
 */
const eventQueries = createTypeSafeQueryResolvers({
  // Get all events with pagination and filtering
  events: createProtectedResolver(
    async (_, args: QueryEventsArgs, context: Context) => {
      // Create isolated model with tenant filtering
      const isolatedEvent = createIsolatedModel(Event, context);
      
      // Process pagination args with defaults
      const pagination = sanitizePagination(args.pagination);
      
      // Build the query (all queries automatically filtered by tenant)
      const filter: Record<string, any> = {};
      
      if (args.filter) {
        if (args.filter.startDate || args.filter.endDate) {
          filter.$and = [];
          if (args.filter.startDate) filter.$and.push({ startTime: { $gte: args.filter.startDate } });
          if (args.filter.endDate) filter.$and.push({ endTime: { $lte: args.filter.endDate } });
        }
        
        if (args.filter.status) {
          filter.status = args.filter.status;
        }
        
        if (args.filter.resourceId) {
          filter.resourceId = args.filter.resourceId;
        }
        
        if (args.filter.eventType) {
          filter.type = args.filter.eventType;
        }
      }
      
      try {
        // Count total items for pagination
        const totalItems = await isolatedEvent.find(filter).countDocuments();
        const totalPages = Math.ceil(totalItems / pagination.limit);
        const skip = (pagination.page - 1) * pagination.limit;
        
        // Execute the query with pagination
        const events = await isolatedEvent.find(filter)
          .sort({ startTime: 1 })
          .skip(skip)
          .limit(pagination.limit);
        
        // Return in the format expected by the schema
        return {
          edges: events,
          pageInfo: {
            currentPage: pagination.page,
            totalPages,
            totalItems,
            itemsPerPage: pagination.limit,
            hasNextPage: pagination.page < totalPages,
            hasPreviousPage: pagination.page > 1
          }
        };
      } catch (error) {
        console.error('Error fetching events:', error);
        throw new GraphQLError('Failed to fetch events', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },
    ['ADMIN', 'STAFF', 'CLIENT']
  ),
  
  // Get a single event by ID
  event: createProtectedResolver(
    async (_, args: QueryEventArgs, context: Context) => {
      const isolatedEvent = createIsolatedModel(Event, context);
      
      try {
        // Find event by ID (with tenant isolation)
        const event = await isolatedEvent.findById(args.id);
        
        if (!event) {
          throw new GraphQLError('Event not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }
        
        return event;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        
        console.error('Error fetching event:', error);
        throw new GraphQLError('Failed to fetch event', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },
    ['ADMIN', 'STAFF', 'CLIENT']
  )
});

/**
 * Type-safe event mutation resolvers
 */
const eventMutations = createTypeSafeMutationResolvers({
  // Create a new event
  createEvent: createProtectedResolver(
    async (_, args: MutationCreateEventArgs, context: Context) => {
      try {
        // Create new event with tenant ID
        const event = new Event({
          ...args.input,
          tenantId: context.user.tenantId,
          createdBy: context.user.id
        });
        
        // Save to database
        await event.save();
        
        // Publish update for subscriptions
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
    ['ADMIN', 'STAFF']
  ),
  
  // Update an existing event
  updateEvent: createProtectedResolver(
    async (_, args: MutationUpdateEventArgs, context: Context) => {
      try {
        // Find and update with tenant isolation
        const event = await Event.findOneAndUpdate(
          { _id: args.id, tenantId: context.user.tenantId },
          { $set: args.input },
          { new: true }
        );
        
        if (!event) {
          throw new GraphQLError('Event not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }
        
        // Publish update
        pubsub.publish(`${EVENT_UPDATED}.${context.user.tenantId}`, {
          eventUpdated: event
        });
        
        return event;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        
        console.error('Error updating event:', error);
        throw new GraphQLError('Failed to update event', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },
    ['ADMIN', 'STAFF']
  ),
  
  // Delete an event
  deleteEvent: createProtectedResolver(
    async (_, args: MutationDeleteEventArgs, context: Context) => {
      try {
        const isolatedEvent = createIsolatedModel(Event, context);
        const result = await isolatedEvent.deleteOne({ _id: args.id });
        
        if (result.deletedCount === 0) {
          throw new GraphQLError('Event not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }
        
        return true;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        
        console.error('Error deleting event:', error);
        throw new GraphQLError('Failed to delete event', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },
    ['ADMIN', 'STAFF']
  ),
  
  // Batch update event statuses
  batchUpdateEventStatus: createProtectedResolver(
    async (_, args: MutationBatchUpdateEventStatusArgs, context: Context) => {
      try {
        const isolatedEvent = createIsolatedModel(Event, context);
        
        // Update events with tenant isolation
        await Event.updateMany(
          { _id: { $in: args.ids }, tenantId: context.user.tenantId },
          { $set: { status: args.status } }
        );
        
        // Fetch updated events
        const updatedEvents = await isolatedEvent.find({ _id: { $in: args.ids } });
        
        if (updatedEvents.length === 0) {
          throw new GraphQLError('No events found to update', {
            extensions: { code: 'NOT_FOUND' }
          });
        }
        
        // Publish updates
        updatedEvents.forEach(event => {
          pubsub.publish(`${EVENT_UPDATED}.${context.user.tenantId}`, {
            eventUpdated: event
          });
        });
        
        return updatedEvents;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        
        console.error('Error batch updating events:', error);
        throw new GraphQLError('Failed to update events', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },
    ['ADMIN', 'STAFF']
  )
});

/**
 * Type-safe subscription resolvers
 */
const eventSubscriptions = createTypeSafeSubscriptionResolvers({
  eventUpdated: {
    subscribe: (_, args: SubscriptionEventUpdatedArgs) => {
      if (!args.tenantId) {
        throw new GraphQLError('Tenant ID is required', {
          extensions: { code: 'BAD_REQUEST' }
        });
      }
      
      return pubsub.asyncIterator(`${EVENT_UPDATED}.${args.tenantId}`);
    }
  }
});

// Combine all resolvers
export const typedEventResolvers = createTypeSafeResolvers({
  Query: eventQueries,
  Mutation: eventMutations,
  Subscription: eventSubscriptions
}); 