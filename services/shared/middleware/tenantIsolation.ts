/**
 * Tenant Isolation Middleware
 * 
 * This module provides middleware functions for ensuring proper
 * tenant isolation in all GraphQL and REST API operations.
 */

import { Request, Response, NextFunction } from 'express';
import { GraphQLError } from 'graphql';
import { verify, JwtPayload } from 'jsonwebtoken';
import { createErrorFactory, ErrorCode } from '../utils/errors';
import { Logger } from '../utils/logger';

// Create an error factory specific to this middleware
const errorFactory = createErrorFactory('tenant-middleware');

/**
 * Extended JWT payload with tenant information
 */
interface TenantJwtPayload extends JwtPayload {
  tenantId?: string;
  userId?: string;
  roles?: string[];
}

/**
 * Express request with tenant information
 */
export interface RequestWithTenant extends Request {
  tenantId?: string;
  user?: {
    id: string;
    tenantId?: string;
    roles?: string[];
    [key: string]: unknown;
  };
  logger?: Logger;
}

/**
 * GraphQL context with tenant information
 */
export interface TenantContext {
  tenantId?: string;
  userId?: string;
  user?: {
    id: string;
    tenantId?: string;
    roles?: string[];
    [key: string]: unknown;
  };
  headers: Record<string, string | string[] | undefined>;
  logger?: Logger;
}

/**
 * Extract tenant ID from the authorization header
 */
function extractTenantFromToken(token: string, jwtSecret: string): TenantJwtPayload {
  try {
    const decoded = verify(token, jwtSecret) as TenantJwtPayload;
    return decoded;
  } catch (error) {
    throw errorFactory.create(
      'Invalid or expired token',
      { code: ErrorCode.INVALID_TOKEN },
      401
    );
  }
}

/**
 * Express middleware for tenant isolation
 */
export function tenantMiddleware(jwtSecret: string) {
  return (req: RequestWithTenant, res: Response, next: NextFunction) => {
    try {
      // Check for tenant ID in headers first (for service-to-service calls)
      const headerTenantId = req.headers['x-tenant-id'];
      
      if (headerTenantId) {
        req.tenantId = Array.isArray(headerTenantId) ? headerTenantId[0] : headerTenantId;
        if (req.logger) {
          req.logger = req.logger.forTenant(req.tenantId);
        }
        return next();
      }
      
      // Otherwise, extract from auth token
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        // No tenant ID and no auth header - might be a public route
        // Let the route handler decide if this is allowed
        return next();
      }
      
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : authHeader;
      
      const payload = extractTenantFromToken(token, jwtSecret);
      
      if (payload.tenantId) {
        req.tenantId = payload.tenantId;
        req.user = {
          id: payload.userId || payload.sub || '',
          tenantId: payload.tenantId,
          roles: payload.roles || []
        };
        
        if (req.logger) {
          req.logger = req.logger.forTenant(req.tenantId);
        }
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Create a tenant context for GraphQL requests
 */
export function createTenantContext(
  req: RequestWithTenant,
  jwtSecret: string,
  logger?: Logger
): TenantContext {
  const headers = req.headers as Record<string, string | string[] | undefined>;
  
  try {
    // Initialize context with headers and optional logger
    const context: TenantContext = {
      headers,
      logger
    };
    
    // Check for tenant ID in headers first (for service-to-service calls)
    const headerTenantId = headers['x-tenant-id'];
    
    if (headerTenantId) {
      context.tenantId = Array.isArray(headerTenantId) ? headerTenantId[0] : headerTenantId;
      if (logger) {
        context.logger = logger.forTenant(context.tenantId);
      }
      return context;
    }
    
    // Otherwise, extract from auth token
    const authHeader = headers.authorization;
    
    if (!authHeader) {
      // No tenant ID and no auth header - public query/mutation
      return context;
    }
    
    const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : Array.isArray(authHeader) ? authHeader[0] : authHeader as string;
    
    const payload = extractTenantFromToken(token, jwtSecret);
    
    if (payload.tenantId) {
      context.tenantId = payload.tenantId;
      context.userId = payload.userId || payload.sub;
      context.user = {
        id: payload.userId || payload.sub || '',
        tenantId: payload.tenantId,
        roles: payload.roles || []
      };
      
      if (logger) {
        context.logger = logger.forTenant(context.tenantId);
      }
    }
    
    return context;
  } catch (error) {
    // Let Apollo handle errors in the GraphQL execution
    throw new GraphQLError('Authentication error', {
      extensions: {
        code: 'UNAUTHENTICATED',
        http: { status: 401 }
      }
    });
  }
}

/**
 * Verify that a GraphQL operation has tenant context
 */
export function requireTenant(context: TenantContext) {
  if (!context.tenantId) {
    throw new GraphQLError('Tenant ID is required for this operation', {
      extensions: {
        code: ErrorCode.TENANT_ACCESS_DENIED,
        http: { status: 403 }
      }
    });
  }
  
  return context.tenantId;
}

/**
 * Check if user has the required role for an operation
 */
export function requireRole(context: TenantContext, requiredRoles: string | string[]) {
  // Ensure we have a tenant ID and user
  requireTenant(context);
  
  if (!context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: {
        code: ErrorCode.UNAUTHORIZED,
        http: { status: 401 }
      }
    });
  }
  
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  const userRoles = context.user.roles || [];
  
  // Check if user has any of the required roles
  const hasRequiredRole = roles.some(role => userRoles.includes(role));
  
  if (!hasRequiredRole) {
    throw new GraphQLError('Insufficient permissions', {
      extensions: {
        code: ErrorCode.INSUFFICIENT_PERMISSIONS,
        requiredRoles: roles,
        http: { status: 403 }
      }
    });
  }
  
  return true;
}

/**
 * Require entity to belong to the same tenant as the request
 */
export function enforceTenantIsolation<T extends { tenantId?: string }>(
  entity: T | null | undefined,
  context: TenantContext,
  entityName: string
): T {
  // First, ensure we have a tenant ID
  const tenantId = requireTenant(context);
  
  // Entity doesn't exist
  if (!entity) {
    throw new GraphQLError(`${entityName} not found`, {
      extensions: {
        code: ErrorCode.NOT_FOUND,
        http: { status: 404 }
      }
    });
  }
  
  // Entity exists but doesn't have a tenant ID (should never happen)
  if (!entity.tenantId) {
    throw new GraphQLError(`${entityName} has no tenant association`, {
      extensions: {
        code: ErrorCode.INTERNAL_ERROR,
        http: { status: 500 }
      }
    });
  }
  
  // Tenant ID mismatch
  if (entity.tenantId !== tenantId) {
    throw new GraphQLError(`Access denied to ${entityName}`, {
      extensions: {
        code: ErrorCode.TENANT_ACCESS_DENIED,
        http: { status: 403 }
      }
    });
  }
  
  return entity;
}

/**
 * Create a filter with tenant ID for database queries
 */
export function tenantFilter<T>(context: TenantContext, filter?: T): T & { tenantId: string } {
  const tenantId = requireTenant(context);
  return { ...(filter || {} as T), tenantId } as T & { tenantId: string };
} 