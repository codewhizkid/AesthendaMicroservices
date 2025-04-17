import { GraphQLError } from 'graphql';
import { Context } from '../types';
import config from '../config';

/**
 * Middleware to ensure tenant ID exists in the context
 */
export const ensureTenantId = (context: Context): string => {
  if (!context.user?.tenantId) {
    throw new GraphQLError(config.errorMessages.UNAUTHORIZED, {
      extensions: { code: 'UNAUTHORIZED' }
    });
  }
  return context.user.tenantId;
};

/**
 * Middleware to check if the user has the required role
 */
export const checkRole = (context: Context, allowedRoles: string[]): void => {
  const { user } = context;
  
  if (!user || !user.roles || !user.roles.some(role => allowedRoles.includes(role))) {
    throw new GraphQLError(config.errorMessages.FORBIDDEN, {
      extensions: { code: 'FORBIDDEN' }
    });
  }
};

/**
 * Higher-order function to create a resolver with tenant isolation
 */
export const withTenantIsolation = (resolver: Function) => {
  return async (parent: any, args: any, context: Context, info: any) => {
    ensureTenantId(context);
    return resolver(parent, args, context, info);
  };
};

/**
 * Higher-order function to create a resolver with role-based access control
 */
export const withRBAC = (resolver: Function, allowedRoles: string[]) => {
  return async (parent: any, args: any, context: Context, info: any) => {
    ensureTenantId(context);
    checkRole(context, allowedRoles);
    return resolver(parent, args, context, info);
  };
};

/**
 * Add tenant filter to query
 */
export const addTenantFilter = <T extends object>(query: T, context: Context): T & { tenantId: string } => {
  const tenantId = ensureTenantId(context);
  return { ...query, tenantId } as T & { tenantId: string };
}; 