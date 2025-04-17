import { PubSub } from 'graphql-subscriptions';
import { GraphQLError } from 'graphql';
import { BusinessHours, IBusinessHours } from '../models/BusinessHours';
import { AuthContext } from '../middleware/auth';
import { validateBusinessHoursInput } from '../middleware/validation';
import { errorMessages } from '../config';
import { toPlainObject } from '../utils';

const pubsub = new PubSub();
const BUSINESS_HOURS_UPDATED = 'BUSINESS_HOURS_UPDATED';

interface BusinessHoursMutationInput {
  input: IBusinessHours;
}

export const businessHoursResolvers = {
  Query: {
    getBusinessHours: async (_: unknown, { id }: { id: string }, context: AuthContext) => {
      const businessHours = await BusinessHours.findOne({ _id: id, tenantId: context.tenantId });
      if (!businessHours) {
        throw new GraphQLError(errorMessages.NOT_FOUND, {
          extensions: { code: 'NOT_FOUND' }
        });
      }
      return toPlainObject(businessHours);
    },

    listBusinessHours: async (_: unknown, 
      { dayOfWeek }: { dayOfWeek?: number }, 
      context: AuthContext
    ) => {
      const query = { tenantId: context.tenantId } as { tenantId: string; dayOfWeek?: number };
      if (typeof dayOfWeek === 'number') {
        query.dayOfWeek = dayOfWeek;
      }

      const businessHours = await BusinessHours.find(query).sort({ dayOfWeek: 1, startTime: 1 });
      return businessHours.map(hours => toPlainObject(hours));
    }
  },

  Mutation: {
    createBusinessHours: async (_: unknown, { input }: BusinessHoursMutationInput, context: AuthContext) => {
      try {
        validateBusinessHoursInput(input);
        
        const businessHours = new BusinessHours({
          ...input,
          tenantId: context.tenantId,
        });
        
        await businessHours.save();
        
        const plainBusinessHours = toPlainObject(businessHours);
        pubsub.publish(`${BUSINESS_HOURS_UPDATED}.${context.tenantId}`, {
          businessHoursUpdated: plainBusinessHours,
        });
        
        return plainBusinessHours;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError(errorMessages.INTERNAL_ERROR, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    updateBusinessHours: async (_: unknown, { id, input }: { id: string } & BusinessHoursMutationInput, context: AuthContext) => {
      try {
        validateBusinessHoursInput(input);

        const businessHours = await BusinessHours.findOneAndUpdate(
          { _id: id, tenantId: context.tenantId },
          { $set: input },
          { new: true }
        );

        if (!businessHours) {
          throw new GraphQLError(errorMessages.NOT_FOUND, {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        const plainBusinessHours = toPlainObject<IBusinessHours>(businessHours);
        pubsub.publish(`${BUSINESS_HOURS_UPDATED}.${context.tenantId}`, {
          businessHoursUpdated: plainBusinessHours,
        });

        return plainBusinessHours;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError(errorMessages.INTERNAL_ERROR, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    deleteBusinessHours: async (_: unknown, { id }: { id: string }, context: AuthContext) => {
      try {
        const businessHours = await BusinessHours.findOneAndDelete({
          _id: id,
          tenantId: context.tenantId,
        });

        if (!businessHours) {
          throw new GraphQLError(errorMessages.NOT_FOUND, {
            extensions: { code: 'NOT_FOUND' }
          });
        }

        const plainBusinessHours = toPlainObject<IBusinessHours>(businessHours);
        pubsub.publish(`${BUSINESS_HOURS_UPDATED}.${context.tenantId}`, {
          businessHoursUpdated: { ...plainBusinessHours, deleted: true },
        });

        return true;
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError(errorMessages.INTERNAL_ERROR, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },
  },

  Subscription: {
    businessHoursUpdated: {
      subscribe: (_: unknown, { tenantId }: { tenantId: string }) =>
        pubsub.asyncIterator(`${BUSINESS_HOURS_UPDATED}.${tenantId}`),
    },
  },
}; 