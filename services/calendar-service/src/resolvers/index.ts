import { DateTimeResolver, JSONResolver } from 'graphql-scalars';
import { eventResolvers } from './eventResolvers';
import { resourceResolvers } from './resourceResolvers';

export const resolvers = {
  DateTime: DateTimeResolver,
  JSON: JSONResolver,
  Query: {
    ...eventResolvers.Query,
    ...resourceResolvers.Query
  },
  Mutation: {
    ...eventResolvers.Mutation,
    ...resourceResolvers.Mutation
  },
  Subscription: {
    ...eventResolvers.Subscription,
    ...resourceResolvers.Subscription
  }
};