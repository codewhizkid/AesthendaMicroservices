"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventResolvers = void 0;
const graphql_subscriptions_1 = require("graphql-subscriptions");
const Event_1 = require("../models/Event");
const pubsub = new graphql_subscriptions_1.PubSub();
const EVENT_UPDATED = 'EVENT_UPDATED';
exports.eventResolvers = {
    Query: {
        events: async (_, { filter, pagination = { page: 1, limit: 20 } }, context) => {
            const query = { tenantId: context.user?.tenantId };
            if (filter) {
                if (filter.startDate || filter.endDate) {
                    query.$and = [];
                    if (filter.startDate)
                        query.$and.push({ startTime: { $gte: filter.startDate } });
                    if (filter.endDate)
                        query.$and.push({ endTime: { $lte: filter.endDate } });
                }
                if (filter.status) {
                    query.status = filter.status;
                }
                if (filter.resourceId) {
                    query.resourceId = filter.resourceId;
                }
            }
            const totalItems = await Event_1.Event.countDocuments(query);
            const totalPages = Math.ceil(totalItems / pagination.limit);
            const skip = (pagination.page - 1) * pagination.limit;
            const events = await Event_1.Event.find(query)
                .sort({ startTime: 1 })
                .skip(skip)
                .limit(pagination.limit);
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
        },
        event: async (_, { id }, context) => {
            const event = await Event_1.Event.findOne({
                _id: id,
                tenantId: context.user?.tenantId
            });
            return event;
        },
    },
    Mutation: {
        createEvent: async (_, { input }, context) => {
            const event = new Event_1.Event({
                ...input,
                tenantId: context.user?.tenantId,
                createdBy: context.user?.id,
            });
            await event.save();
            // Publish event update
            pubsub.publish(`${EVENT_UPDATED}.${context.user?.tenantId}`, {
                eventUpdated: event
            });
            return event;
        },
        updateEvent: async (_, { id, input }, context) => {
            const event = await Event_1.Event.findOneAndUpdate({ _id: id, tenantId: context.user?.tenantId }, { $set: input }, { new: true });
            if (!event)
                throw new Error('Event not found');
            // Publish event update
            pubsub.publish(`${EVENT_UPDATED}.${context.user?.tenantId}`, {
                eventUpdated: event
            });
            return event;
        },
        deleteEvent: async (_, { id }, context) => {
            const result = await Event_1.Event.deleteOne({
                _id: id,
                tenantId: context.user?.tenantId
            });
            return result.deletedCount === 1;
        },
        batchUpdateEventStatus: async (_, { ids, status }, context) => {
            const events = await Event_1.Event.updateMany({
                _id: { $in: ids },
                tenantId: context.user?.tenantId
            }, { $set: { status } }, { new: true });
            const updatedEvents = await Event_1.Event.find({
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
            subscribe: (_, { tenantId }) => pubsub.asyncIterator(`${EVENT_UPDATED}.${tenantId}`),
        },
    },
};
//# sourceMappingURL=eventResolvers.js.map