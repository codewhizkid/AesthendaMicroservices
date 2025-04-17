import { GraphQLError } from 'graphql';
import config from '../config';
import { AuthContext } from '../middleware/auth';
import { UserRole } from '../types';

// Type for resolver functions
type Resolver = (parent: any, args: any, context: AuthContext, info: any) => any;

/**
 * Higher-order function that wraps resolvers to enforce tenant isolation
 * 
 * This ensures that every resolver validates the tenantId from the context
 * and ensures users can only access data from their own tenant
 */
export const withTenantIsolation = (resolver: Resolver): Resolver => {
  return (parent, args, context, info) => {
    if (!context.tenantId) {
      throw new GraphQLError(config.errorMessages.TENANT_REQUIRED, {
        extensions: { code: 'TENANT_REQUIRED' }
      });
    }
    
    // Add tenantId to args when applicable
    if (args.input && typeof args.input === 'object') {
      args.input.tenantId = context.tenantId;
    }
    
    return resolver(parent, args, context, info);
  };
};

/**
 * Higher-order function that wraps resolvers to enforce role-based access control
 */
export const withRoleCheck = (resolver: Resolver, allowedRoles: UserRole[]): Resolver => {
  return (parent, args, context, info) => {
    if (!allowedRoles.includes(context.userRole)) {
      throw new GraphQLError(config.errorMessages.FORBIDDEN, {
        extensions: { code: 'FORBIDDEN' }
      });
    }
    
    return resolver(parent, args, context, info);
  };
};

/**
 * Combines tenant isolation and role-based access control
 */
export const withTenantAndRoles = (resolver: Resolver, allowedRoles: UserRole[]): Resolver => {
  return withTenantIsolation(withRoleCheck(resolver, allowedRoles));
};

/**
 * Apply tenant isolation to all resolvers in a resolver map
 */
export const applyTenantIsolation = (resolvers: Record<string, any>): Record<string, any> => {
  const wrappedResolvers: Record<string, any> = {};
  
  // Process each top-level resolver type (Query, Mutation, etc.)
  Object.keys(resolvers).forEach(type => {
    wrappedResolvers[type] = {};
    
    // Apply tenant isolation to each resolver in this type
    Object.keys(resolvers[type]).forEach(field => {
      const resolver = resolvers[type][field];
      
      // Skip if not a function
      if (typeof resolver !== 'function') {
        wrappedResolvers[type][field] = resolver;
        return;
      }
      
      // Apply tenant isolation wrapper
      wrappedResolvers[type][field] = withTenantIsolation(resolver);
    });
  });
  
  return wrappedResolvers;
}; 