"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const graphql_scalars_1 = require("graphql-scalars");
const Event_1 = require("./models/Event");
const Resource_1 = require("./models/Resource");
exports.resolvers = {
    // Custom scalars
    DateTime: graphql_scalars_1.DateTimeResolver,
    JSON: graphql_scalars_1.JSONResolver,
    Query: {
        events: async (_, { startTime, endTime, status }, context) => {
            const query = { tenantId: context.user?.tenantId };
            if (startTime || endTime) {
                query.$and = [];
                if (startTime)
                    query.$and.push({ startTime: { $gte: startTime } });
                if (endTime)
                    query.$and.push({ endTime: { $lte: endTime } });
            }
            if (status) {
                query.status = status;
            }
            return Event_1.Event.find(query).sort({ startTime: 1 });
        },
        event: async (_, { id }, context) => {
            const event = await Event_1.Event.findOne({
                _id: id,
                tenantId: context.user?.tenantId
            });
            return event;
        },
        resources: async (_, { type }, context) => {
            const query = { tenantId: context.user?.tenantId };
            if (type) {
                query.type = type;
            }
            return Resource_1.Resource.find(query);
        },
        resource: async (_, { id }, context) => {
            const resource = await Resource_1.Resource.findOne({
                _id: id,
                tenantId: context.user?.tenantId
            });
            return resource;
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
            return event;
        },
        updateEvent: async (_, { id, input }, context) => {
            const event = await Event_1.Event.findOneAndUpdate({ _id: id, tenantId: context.user?.tenantId }, { $set: input }, { new: true });
            if (!event)
                throw new Error('Event not found');
            return event;
        },
        deleteEvent: async (_, { id }, context) => {
            const result = await Event_1.Event.deleteOne({
                _id: id,
                tenantId: context.user?.tenantId
            });
            return result.deletedCount === 1;
        },
        createResource: async (_, { input }, context) => {
            const resource = new Resource_1.Resource({
                ...input,
                tenantId: context.user?.tenantId,
            });
            await resource.save();
            return resource;
        },
        updateResource: async (_, { id, input }, context) => {
            const resource = await Resource_1.Resource.findOneAndUpdate({ _id: id, tenantId: context.user?.tenantId }, { $set: input }, { new: true });
            if (!resource)
                throw new Error('Resource not found');
            return resource;
        },
        deleteResource: async (_, { id }, context) => {
            const result = await Resource_1.Resource.deleteOne({
                _id: id,
                tenantId: context.user?.tenantId
            });
            return result.deletedCount === 1;
        },
    },
};
//# sourceMappingURL=resolvers.js.map