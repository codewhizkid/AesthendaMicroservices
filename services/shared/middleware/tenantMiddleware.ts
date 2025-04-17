import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Interface for tenant information extracted from request
 */
export interface TenantInfo {
  tenantId?: string;
  tenantSlug?: string;
  source: 'token' | 'query' | 'subdomain' | 'header';
}

/**
 * Interface for tenant model
 */
export interface Tenant {
  _id: string;
  name: string;
  slug: string;
  isActive: () => boolean;
  plan: string;
  settings: Record<string, any>;
  [key: string]: any;
}

/**
 * Options for tenant middleware configuration
 */
export interface TenantMiddlewareOptions {
  /** Function to find tenant by ID */
  findTenantById: (id: string) => Promise<Tenant | null>;
  
  /** Function to find tenant by slug */
  findTenantBySlug: (slug: string) => Promise<Tenant | null>;
  
  /** JWT secret for token verification */
  jwtSecret: string;
  
  /** Whether to require tenant for all requests */
  requireTenant?: boolean;
  
  /** Routes that should be exempt from tenant requirement */
  publicRoutes?: string[];
  
  /** Function to log errors */
  logError?: (message: string, error: any) => void;
}

/**
 * Extract tenant information from the request
 * Priority:
 * 1. X-Tenant-ID header
 * 2. Authorization header (JWT token)
 * 3. Query parameter (tenantId)
 * 4. Subdomain
 */
export const extractTenantInfo = (req: Request, jwtSecret: string): TenantInfo | null => {
  // Check direct X-Tenant-ID header
  const tenantHeader = req.headers['x-tenant-id'];
  if (tenantHeader && typeof tenantHeader === 'string') {
    return {
      tenantId: tenantHeader,
      source: 'header'
    };
  }

  // Check Authorization header for JWT
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, jwtSecret) as { tenantId?: string };
      if (decoded.tenantId) {
        return {
          tenantId: decoded.tenantId,
          source: 'token'
        };
      }
    } catch (error) {
      console.warn('Invalid JWT token:', (error as Error).message);
    }
  }

  // Check query parameter
  if (req.query.tenantId && typeof req.query.tenantId === 'string') {
    return {
      tenantId: req.query.tenantId,
      source: 'query'
    };
  }

  // Check subdomain
  const host = req.get('host');
  if (host && !host.startsWith('www.')) {
    const subdomain = host.split('.')[0];
    if (subdomain !== 'api' && subdomain !== 'app') {
      return {
        tenantSlug: subdomain,
        source: 'subdomain'
      };
    }
  }

  return null;
};

/**
 * Check if a route is in the public routes list
 */
const isPublicRoute = (req: Request, publicRoutes: string[] = []): boolean => {
  return publicRoutes.some(route => {
    if (route.includes('*')) {
      const baseRoute = route.replace('*', '');
      return req.path.startsWith(baseRoute);
    }
    return req.path === route;
  });
};

/**
 * Create tenant middleware
 */
export const createTenantMiddleware = (options: TenantMiddlewareOptions) => {
  const {
    findTenantById,
    findTenantBySlug,
    jwtSecret,
    requireTenant = true,
    publicRoutes = ['/health', '/metrics'],
    logError = console.error
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip tenant check for public routes
      if (isPublicRoute(req, publicRoutes)) {
        return next();
      }

      const tenantInfo = extractTenantInfo(req, jwtSecret);
      
      // If no tenant info and tenant is required, return error
      if (!tenantInfo) {
        if (requireTenant) {
          return res.status(400).json({
            success: false,
            error: 'Tenant context not found',
            code: 'TENANT_REQUIRED'
          });
        }
        // If tenant is not required, continue
        return next();
      }

      // Find tenant
      let tenant: Tenant | null = null;
      
      if (tenantInfo.tenantId) {
        tenant = await findTenantById(tenantInfo.tenantId);
      } else if (tenantInfo.tenantSlug) {
        tenant = await findTenantBySlug(tenantInfo.tenantSlug);
      }

      // If tenant not found, return error
      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: 'Tenant not found',
          code: 'TENANT_NOT_FOUND'
        });
      }

      // Check if tenant is active
      if (!tenant.isActive()) {
        return res.status(403).json({
          success: false,
          error: 'Tenant is not active',
          code: 'TENANT_INACTIVE'
        });
      }

      // Set tenant context in request
      (req as any).tenant = tenant;
      (req as any).tenantId = tenant._id;

      // Add tenant headers for debugging/logging
      res.set('X-Tenant-ID', tenant._id.toString());
      res.set('X-Tenant-Name', tenant.name);
      res.set('X-Tenant-Source', tenantInfo.source);

      next();
    } catch (error) {
      logError('Error in tenant middleware:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  };
};

/**
 * GraphQL context middleware for Apollo Server
 */
export const createGraphQLTenantContext = (options: TenantMiddlewareOptions) => {
  const {
    findTenantById,
    findTenantBySlug,
    jwtSecret,
    requireTenant = true,
    publicRoutes = [],
    logError = console.error
  } = options;

  return async ({ req }: { req: Request }) => {
    try {
      // Skip tenant check for public operations (if implemented)
      if (isPublicRoute(req, publicRoutes)) {
        return {};
      }

      const tenantInfo = extractTenantInfo(req, jwtSecret);
      
      // If no tenant info and tenant is required, throw error
      if (!tenantInfo) {
        if (requireTenant) {
          throw new Error('Tenant context not found');
        }
        // If tenant is not required, continue with empty context
        return {};
      }

      // Find tenant
      let tenant: Tenant | null = null;
      
      if (tenantInfo.tenantId) {
        tenant = await findTenantById(tenantInfo.tenantId);
      } else if (tenantInfo.tenantSlug) {
        tenant = await findTenantBySlug(tenantInfo.tenantSlug);
      }

      // If tenant not found, throw error
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Check if tenant is active
      if (!tenant.isActive()) {
        throw new Error('Tenant is not active');
      }

      // Return tenant context
      return {
        tenant,
        tenantId: tenant._id,
        tenantSource: tenantInfo.source
      };
    } catch (error) {
      // Log error but don't throw to allow Apollo to handle it
      logError('Error in GraphQL tenant context:', error);
      throw new Error(`Tenant context error: ${(error as Error).message}`);
    }
  };
};

/**
 * Creates a Mongoose middleware to enforce tenant isolation in schemas
 */
export const createTenantModelPlugin = () => {
  return function tenantModelPlugin(schema: any) {
    // Add tenantId to schema if it doesn't exist
    if (!schema.paths.tenantId) {
      schema.add({
        tenantId: {
          type: String,
          required: true,
          index: true
        }
      });
    }

    // Ensure tenantId is included in all queries
    schema.pre(/^find/, function(this: any, next: () => void) {
      if (!this._conditions.tenantId && !this._tenantBypass) {
        throw new Error('Tenant ID is required for all queries');
      }
      next();
    });

    // Ensure tenantId is included in all updates
    schema.pre(['updateOne', 'updateMany'], function(this: any, next: () => void) {
      if (!this._conditions.tenantId && !this._tenantBypass) {
        throw new Error('Tenant ID is required for all updates');
      }
      next();
    });

    // Ensure tenantId is included in all deletes
    schema.pre(['deleteOne', 'deleteMany'], function(this: any, next: () => void) {
      if (!this._conditions.tenantId && !this._tenantBypass) {
        throw new Error('Tenant ID is required for all deletes');
      }
      next();
    });

    // Add method to bypass tenant check (for admin operations)
    schema.static('bypassTenant', function(this: any) {
      const query = this.find();
      query._tenantBypass = true;
      return query;
    });
  };
}; 