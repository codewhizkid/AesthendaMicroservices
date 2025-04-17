import { GraphQLError } from 'graphql';
import { IResolvers } from '@graphql-tools/utils';
import mongoose from 'mongoose';
import { Context } from '../types';
import { isolatedModel, withTenantIsolation } from '../middleware/tenantIsolation';

/**
 * Apply tenant isolation to all resolvers in a resolver map
 * @param resolvers Resolver map to protect
 * @returns Protected resolver map with tenant isolation
 */
export function applyTenantIsolation<TSource = any, TContext = Context, TArgs = any>(
  resolvers: IResolvers<TSource, TContext, TArgs>
): IResolvers<TSource, TContext, TArgs> {
  const protectedResolvers: IResolvers<TSource, TContext, TArgs> = {};
  
  // Process resolver types (Query, Mutation, etc.)
  for (const type in resolvers) {
    protectedResolvers[type] = {};
    
    // Skip processing if this is a type definition rather than resolver map
    if (typeof resolvers[type] !== 'object' || resolvers[type] === null) {
      protectedResolvers[type] = resolvers[type];
      continue;
    }
    
    // Process each resolver in this type
    for (const field in resolvers[type]) {
      const resolver = resolvers[type][field];
      
      // Skip processing if not a function
      if (typeof resolver !== 'function') {
        protectedResolvers[type][field] = resolver;
        continue;
      }
      
      // Skip tenant isolation for certain operations
      const skipIsolation = [
        'login', 'signup', 'refreshToken', '__typename', 
        'introspection', 'schema', '__schema', '__type'
      ];
      
      if (skipIsolation.includes(field)) {
        protectedResolvers[type][field] = resolver;
        continue;
      }
      
      // Apply tenant isolation to this resolver
      protectedResolvers[type][field] = withTenantIsolation(
        resolver as any
      );
    }
  }
  
  return protectedResolvers;
}

/**
 * Create a CRUD resolver with tenant isolation for a model
 * @param model The mongoose model
 * @returns A set of CRUD resolvers with tenant isolation
 */
export function createIsolatedCrudResolvers<T extends mongoose.Document>(
  model: mongoose.Model<T>,
  options: {
    typeName: string;
    pluralTypeName?: string;
    idField?: string;
  }
) {
  const {
    typeName,
    pluralTypeName = `${typeName}s`,
    idField = 'id',
  } = options;
  
  // Field name for get by ID query (e.g., "event")
  const getSingleField = typeName.charAt(0).toLowerCase() + typeName.slice(1);
  
  // Field name for list query (e.g., "events")
  const getListField = pluralTypeName.charAt(0).toLowerCase() + pluralTypeName.slice(1);
  
  // Field names for mutations
  const createField = `create${typeName}`;
  const updateField = `update${typeName}`;
  const deleteField = `delete${typeName}`;
  
  return {
    Query: {
      // Get by ID query
      [getSingleField]: withTenantIsolation(
        async (_: any, args: { [key: string]: any }, context: Context) => {
          const isolated = isolatedModel(model, context);
          const result = await isolated.findById(args[idField]);
          
          if (!result) {
            throw new GraphQLError(`${typeName} not found`, {
              extensions: { code: 'NOT_FOUND' }
            });
          }
          
          return result;
        }
      ),
      
      // List query with pagination
      [getListField]: withTenantIsolation(
        async (_: any, args: { [key: string]: any }, context: Context) => {
          const isolated = isolatedModel(model, context);
          const { filter = {}, pagination = { page: 1, limit: 20 } } = args;
          
          // Calculate pagination values
          const limit = Math.min(pagination.limit || 20, 100);
          const page = Math.max(pagination.page || 1, 1);
          const skip = (page - 1) * limit;
          
          // Execute query with tenant isolation
          const items = await isolated.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
            
          const totalItems = await isolated.find(filter).countDocuments();
          const totalPages = Math.ceil(totalItems / limit);
          
          return {
            edges: items,
            pageInfo: {
              currentPage: page,
              totalPages,
              totalItems,
              itemsPerPage: limit,
              hasNextPage: page < totalPages,
              hasPreviousPage: page > 1
            }
          };
        }
      )
    },
    
    Mutation: {
      // Create mutation
      [createField]: withTenantIsolation(
        async (_: any, args: { input: any }, context: Context) => {
          const { input } = args;
          
          // Create new document with tenant ID
          const doc = new model({
            ...input,
            tenantId: context.user.tenantId,
            createdBy: context.user.id
          });
          
          // Save document
          await doc.save();
          return doc;
        }
      ),
      
      // Update mutation
      [updateField]: withTenantIsolation(
        async (_: any, args: { [key: string]: any }, context: Context) => {
          const isolated = isolatedModel(model, context);
          const id = args[idField];
          const { input } = args;
          
          // Find and update with tenant isolation
          const updated = await model.findOneAndUpdate(
            { _id: id, tenantId: context.user.tenantId },
            { $set: input },
            { new: true }
          );
          
          if (!updated) {
            throw new GraphQLError(`${typeName} not found`, {
              extensions: { code: 'NOT_FOUND' }
            });
          }
          
          return updated;
        }
      ),
      
      // Delete mutation
      [deleteField]: withTenantIsolation(
        async (_: any, args: { [key: string]: any }, context: Context) => {
          const isolated = isolatedModel(model, context);
          const id = args[idField];
          
          // Delete with tenant isolation
          const result = await isolated.deleteOne({ _id: id });
          
          if (result.deletedCount === 0) {
            throw new GraphQLError(`${typeName} not found`, {
              extensions: { code: 'NOT_FOUND' }
            });
          }
          
          return true;
        }
      )
    }
  };
}

/**
 * Creates a resolver with role-based access control and tenant isolation
 */
export function withRBAC<TResult, TParent, TArgs>(
  resolverFn: (parent: TParent, args: TArgs, context: Context, info: any) => Promise<TResult>,
  allowedRoles: string[]
) {
  return withTenantIsolation(
    async (parent: TParent, args: TArgs, context: Context, info: any) => {
      // Check user roles
      const userRoles = context.user?.roles || [];
      const hasPermission = userRoles.some(role => allowedRoles.includes(role));
      
      if (!hasPermission) {
        throw new GraphQLError('Insufficient permissions', {
          extensions: { code: 'FORBIDDEN' }
        });
      }
      
      // Call original resolver
      return resolverFn(parent, args, context, info);
    }
  );
}

export default {
  applyTenantIsolation,
  createIsolatedCrudResolvers,
  withRBAC
}; 