"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resourceResolvers = void 0;
const graphql_subscriptions_1 = require("graphql-subscriptions");
const Resource_1 = require("../models/Resource");
const pubsub = new graphql_subscriptions_1.PubSub();
const RESOURCE_UPDATED = 'RESOURCE_UPDATED';
exports.resourceResolvers = {
    Query: {
        resources: async (_, { type, pagination = { page: 1, limit: 20 } }, context) => {
            const query = { tenantId: context.user?.tenantId };
            if (type) {
                query.type = type;
            }
            const totalItems = await Resource_1.Resource.countDocuments(query);
            const totalPages = Math.ceil(totalItems / pagination.limit);
            const skip = (pagination.page - 1) * pagination.limit;
            const resources = await Resource_1.Resource.find(query)
                .sort({ title: 1 })
                .skip(skip)
                .limit(pagination.limit);
            return {
                edges: resources,
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
        resource: async (_, { id }, context) => {
            const resource = await Resource_1.Resource.findOne({
                _id: id,
                tenantId: context.user?.tenantId
            });
            return resource;
        },
    },
    Mutation: {
        createResource: async (_, { input }, context) => {
            const resource = new Resource_1.Resource({
                ...input,
                tenantId: context.user?.tenantId,
            });
            await resource.save();
            // Publish resource update
            pubsub.publish(`${RESOURCE_UPDATED}.${context.user?.tenantId}`, {
                resourceUpdated: resource
            });
            return resource;
        },
        updateResource: async (_, { id, input }, context) => {
            const resource = await Resource_1.Resource.findOneAndUpdate({ _id: id, tenantId: context.user?.tenantId }, { $set: input }, { new: true });
            if (!resource)
                throw new Error('Resource not found');
            // Publish resource update
            pubsub.publish(`${RESOURCE_UPDATED}.${context.user?.tenantId}`, {
                resourceUpdated: resource
            });
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
    Subscription: {
        resourceUpdated: {
            subscribe: (_, { tenantId }) => pubsub.asyncIterator(`${RESOURCE_UPDATED}.${tenantId}`),
        },
    },
};
//# sourceMappingURL=resourceResolvers.js.map