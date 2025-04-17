import { PubSub } from 'graphql-subscriptions';
import { GraphQLError } from 'graphql';
import { Resource, IResource } from '../models/Resource';
import { AuthContext } from '../middleware/auth';
import { validateResourceInput } from '../middleware/validation';
import { ResourceInput } from '../types';
import { errorMessages } from '../config';
import { toPlainObject } from '../utils';
import { Context } from '../types';

const pubsub = new PubSub();
const RESOURCE_UPDATED = 'RESOURCE_UPDATED';

interface ResourceMutationInput {
  input: ResourceInput;
}

export const resourceResolvers = {
  Query: {
    resources: async (_: any, 
      { type, pagination = { page: 1, limit: 20 } }: { type?: string; pagination?: { page: number; limit: number } },
      context: Context
    ) => {
      const query: any = { tenantId: context.user?.tenantId };
      
      if (type) {
        query.type = type;
      }

      // Ensure pagination values are numbers with defaults
      const page = pagination.page || 1;
      const limit = pagination.limit || 20;

      const totalItems = await Resource.countDocuments(query);
      const totalPages = Math.ceil(totalItems / limit);
      const skip = (page - 1) * limit;

      const resources = await Resource.find(query)
        .sort({ title: 1 })
        .skip(skip)
        .limit(limit);

      return {
        edges: resources,
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

    resource: async (_: any, { id }: { id: string }, context: Context) => {
      const resource = await Resource.findOne({ 
        _id: id, 
        tenantId: context.user?.tenantId 
      });
      return resource;
    },
  },

  Mutation: {
    createResource: async (_: any, 
      { input }: { input: Partial<IResource> },
      context: Context
    ) => {
      const resource = new Resource({
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

    updateResource: async (_: any, 
      { id, input }: { id: string; input: Partial<IResource> },
      context: Context
    ) => {
      const resource = await Resource.findOneAndUpdate(
        { _id: id, tenantId: context.user?.tenantId },
        { $set: input },
        { new: true }
      );
      if (!resource) throw new Error('Resource not found');

      // Publish resource update
      pubsub.publish(`${RESOURCE_UPDATED}.${context.user?.tenantId}`, {
        resourceUpdated: resource
      });

      return resource;
    },

    deleteResource: async (_: any, 
      { id }: { id: string },
      context: Context
    ) => {
      const result = await Resource.deleteOne({ 
        _id: id, 
        tenantId: context.user?.tenantId 
      });
      return result.deletedCount === 1;
    },
  },

  Subscription: {
    resourceUpdated: {
      subscribe: (_: unknown, { tenantId }: { tenantId: string }) =>
        pubsub.asyncIterator(`${RESOURCE_UPDATED}.${tenantId}`),
    },
  },
}; 