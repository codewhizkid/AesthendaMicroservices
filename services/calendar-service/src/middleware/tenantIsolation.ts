import { GraphQLError } from 'graphql';
import { errorMessages } from '../config';
import { Context } from '../types';
import mongoose from 'mongoose';

/**
 * Tenant Isolation Middleware
 * 
 * This middleware ensures all database operations are properly isolated by tenant.
 * It wraps resolver functions to automatically inject tenant filtering.
 */

// Error to throw when tenant ID is missing
export class TenantRequiredError extends GraphQLError {
  constructor() {
    super(errorMessages.TENANT_REQUIRED, {
      extensions: { 
        code: 'BAD_REQUEST',
        http: { status: 400 }
      }
    });
  }
}

/**
 * Get the current tenant ID from the context
 * Throws an error if tenant ID is missing
 */
export function getCurrentTenantId(context: Context): string {
  if (!context.user?.tenantId) {
    throw new TenantRequiredError();
  }
  return context.user.tenantId;
}

/**
 * Wrap a query to ensure it's filtered by the current tenant
 * @param query The mongoose query to wrap
 * @param context The GraphQL context containing user info
 * @returns The modified query with tenant filtering
 */
export function withTenantFilter<T extends mongoose.Document>(
  query: mongoose.Query<any, T>,
  context: Context
): mongoose.Query<any, T> {
  const tenantId = getCurrentTenantId(context);
  return query.where({ tenantId });
}

/**
 * Wrap a resolver function to enforce tenant isolation
 * @param resolverFn The resolver function to wrap
 * @returns A new resolver function with tenant isolation
 */
export function withTenantIsolation<TResult, TParent, TArgs>(
  resolverFn: (parent: TParent, args: TArgs, context: Context, info: any) => Promise<TResult>
): (parent: TParent, args: TArgs, context: Context, info: any) => Promise<TResult> {
  return async function(parent, args, context, info) {
    // Ensure context has a valid tenant ID
    getCurrentTenantId(context);
    
    // Call the original resolver
    return resolverFn(parent, args, context, info);
  };
}

/**
 * Higher-order function to ensure a model's find operations are tenant-isolated
 * @param modelClass The mongoose model class to isolate
 * @param context The GraphQL context containing user info
 */
export function isolatedModel<T extends mongoose.Document>(
  modelClass: mongoose.Model<T>,
  context: Context
): {
  find: (filter?: any) => mongoose.Query<T[], T>;
  findOne: (filter?: any) => mongoose.Query<T | null, T>;
  findById: (id: string) => mongoose.Query<T | null, T>;
  deleteOne: (filter?: any) => mongoose.Query<any, T>;
  deleteMany: (filter?: any) => mongoose.Query<any, T>;
  updateOne: (filter: any, update: any) => mongoose.Query<any, T>;
  updateMany: (filter: any, update: any) => mongoose.Query<any, T>;
} {
  const tenantId = getCurrentTenantId(context);
  
  return {
    find: (filter = {}) => modelClass.find({ ...filter, tenantId }),
    findOne: (filter = {}) => modelClass.findOne({ ...filter, tenantId }),
    findById: (id) => modelClass.findOne({ _id: id, tenantId }),
    deleteOne: (filter = {}) => modelClass.deleteOne({ ...filter, tenantId }),
    deleteMany: (filter = {}) => modelClass.deleteMany({ ...filter, tenantId }),
    updateOne: (filter, update) => modelClass.updateOne({ ...filter, tenantId }, update),
    updateMany: (filter, update) => modelClass.updateMany({ ...filter, tenantId }, update)
  };
}

/**
 * Apply tenant filter to a document before saving
 * @param document The document to apply tenant ID to
 * @param context The GraphQL context containing user info
 * @returns The document with tenant ID applied
 */
export function withTenantId<T extends mongoose.Document>(
  document: T,
  context: Context
): T {
  const tenantId = getCurrentTenantId(context);
  document.set('tenantId', tenantId);
  return document;
}

/**
 * Ensure a document belongs to the current tenant
 * @param document The document to check
 * @param context The GraphQL context containing user info
 * @throws GraphQLError if document does not belong to the current tenant
 */
export function ensureOwnTenant<T extends mongoose.Document & { tenantId: string }>(
  document: T | null,
  context: Context
): void {
  if (!document) return;
  
  const tenantId = getCurrentTenantId(context);
  if (document.tenantId !== tenantId) {
    throw new GraphQLError(errorMessages.NOT_FOUND, {
      extensions: { code: 'NOT_FOUND' }
    });
  }
}

export default {
  getCurrentTenantId,
  withTenantFilter,
  withTenantIsolation,
  isolatedModel,
  withTenantId,
  ensureOwnTenant
}; 