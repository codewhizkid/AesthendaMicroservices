import { 
  Resolvers, 
  QueryResolvers, 
  MutationResolvers, 
  SubscriptionResolvers 
} from '../generated/graphql';
import { Context } from '../types';
import { UserRole } from '../types';
import { isolatedModel } from '../middleware/tenantIsolation';
import { withRBAC } from './resolverUtils';

/**
 * Creates a base resolver context type with tenant isolation
 * 
 * This helper provides a typesafe way to create resolver contexts that
 * include tenant isolation
 */
export type TypedResolver<T> = T & {
  // Add shared resolver methods/properties here
};

/**
 * Create a resolver with RBAC and type safety
 */
export function createProtectedResolver<TResult, TParent, TArgs>(
  resolver: (parent: TParent, args: TArgs, context: Context, info: any) => Promise<TResult>,
  roles: UserRole[] = []
) {
  return withRBAC(resolver, roles) as any;
}

/**
 * Type-safe query resolvers
 */
export const createTypeSafeQueryResolvers = <T extends QueryResolvers>(
  resolvers: T
): QueryResolvers => resolvers;

/**
 * Type-safe mutation resolvers
 */
export const createTypeSafeMutationResolvers = <T extends MutationResolvers>(
  resolvers: T
): MutationResolvers => resolvers;

/**
 * Type-safe subscription resolvers
 */
export const createTypeSafeSubscriptionResolvers = <T extends SubscriptionResolvers>(
  resolvers: T
): SubscriptionResolvers => resolvers;

/**
 * Type-safe combined resolvers
 */
export const createTypeSafeResolvers = (resolvers: Partial<Resolvers>): Resolvers => {
  return resolvers as Resolvers;
};

/**
 * Helper to create a type-safe model with tenant isolation
 */
export function createIsolatedModel<T>(modelClass: any, context: Context) {
  return isolatedModel(modelClass, context);
}

export default {
  createProtectedResolver,
  createTypeSafeQueryResolvers,
  createTypeSafeMutationResolvers,
  createTypeSafeSubscriptionResolvers,
  createTypeSafeResolvers,
  createIsolatedModel
}; 