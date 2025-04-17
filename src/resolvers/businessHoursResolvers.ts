import { PubSub } from 'graphql-subscriptions';
import { GraphQLError } from 'graphql';
import { BusinessHours, IBusinessHours } from '../models/BusinessHours';
import { AuthContext } from '../middleware/auth';
import { validateBusinessHoursInput } from '../middleware/validation';
import { BusinessHoursInput } from '../types';
import { errorMessages } from '../config';
import { toPlainObject } from '../utils';
import { Context } from '../types';

const pubsub = new PubSub();
const BUSINESS_HOURS_UPDATED = 'BUSINESS_HOURS_UPDATED';

export const businessHoursResolvers = {
  Query: {
    getBusinessHours: async (_: unknown, { tenantId }: { tenantId: string }, context: AuthContext) => {
      const businessHours = await BusinessHours.find({ tenantId }).sort({ dayOfWeek: 1 });
      return businessHours.map(hours => toPlainObject(hours));
    }
  },

  Mutation: {
    updateBusinessHours: async (
      _: unknown,
      { input }: { input: BusinessHoursInput },
      context: AuthContext
    ) => {
      validateBusinessHoursInput(input);

      const { tenantId, dayOfWeek } = input;

      const businessHours = await BusinessHours.findOneAndUpdate(
        { tenantId, dayOfWeek },
        { $set: input },
        { new: true, upsert: true }
      );

      pubsub.publish(`${BUSINESS_HOURS_UPDATED}.${tenantId}`, {
        businessHoursUpdated: toPlainObject(businessHours)
      });

      return toPlainObject(businessHours);
    }
  },

  Subscription: {
    businessHoursUpdated: {
      subscribe: (_: unknown, { tenantId }: { tenantId: string }) =>
        pubsub.asyncIterator(`${BUSINESS_HOURS_UPDATED}.${tenantId}`)
    }
  }
}; 