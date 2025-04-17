import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';

// Interface for token payload
interface TokenPayload {
  userId: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  exp: number;
}

// Interface for context data
export interface ContextData {
  userId: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
}

/**
 * Validate JWT token from context
 * @param token JWT token string
 * @returns TokenPayload
 */
export async function validateToken(token: string): Promise<TokenPayload> {
  if (!token) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }

  try {
    // Get secret from environment
    const secret = process.env.JWT_SECRET || 'default_secret';
    
    // Verify token
    const decoded = jwt.verify(token, secret) as TokenPayload;
    
    // Check token expiration
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new GraphQLError('Token has expired', {
        extensions: { code: 'UNAUTHENTICATED' }
      });
    }
    
    return decoded;
  } catch (error) {
    throw new GraphQLError('Invalid token', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
}

/**
 * Check if the user has the required permission
 * @param context GraphQL context
 * @param permission Permission to check
 * @param tenantId Optional tenant ID to check permission for a specific tenant
 */
export async function checkPermission(
  context: any,
  permission: string,
  tenantId?: string
): Promise<void> {
  if (!context || !context.token) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }

  try {
    const decoded = await validateToken(context.token);
    
    // Check if user belongs to the tenant
    if (tenantId && decoded.tenantId !== tenantId) {
      throw new GraphQLError('Access denied', {
        extensions: { code: 'FORBIDDEN' }
      });
    }
    
    // Check if user has the requested permission
    if (!decoded.permissions.includes(permission)) {
      throw new GraphQLError(`Permission denied: ${permission} required`, {
        extensions: { code: 'FORBIDDEN' }
      });
    }
  } catch (error) {
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError('Permission check failed', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' }
    });
  }
}

/**
 * Get context data from the request context
 * @param context GraphQL context
 * @returns Context data with userId, tenantId, roles and permissions
 */
export async function getContext(context: any): Promise<ContextData> {
  if (!context || !context.token) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }

  const decoded = await validateToken(context.token);
  
  return {
    userId: decoded.userId,
    tenantId: decoded.tenantId,
    roles: decoded.roles,
    permissions: decoded.permissions
  };
} 