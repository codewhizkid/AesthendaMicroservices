import { GraphQLError } from 'graphql';
import { verify } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import config from '../config';
import { UserRole } from '../types';

export interface DecodedToken {
  userId: string;
  tenantId: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface User {
  id: string;
  tenantId: string;
  roles: UserRole[];
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export interface AuthContext {
  userId: string;
  tenantId: string;
  userRole: UserRole;
}

export const verifyToken = (token: string): DecodedToken => {
  try {
    return verify(token, config.auth.jwtSecret) as DecodedToken;
  } catch (error) {
    throw new GraphQLError(config.errorMessages.UNAUTHORIZED, {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
};

// Express middleware for authentication
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    // For development, if no token, use a mock user
    if (!token && config.env.isDevelopment) {
      req.user = {
        id: 'dev-user-1',
        tenantId: config.tenant.defaultTenantId,
        roles: [UserRole.ADMIN],
      };
      return next();
    }
    
    // If token exists, verify it
    if (token) {
      const decoded = verifyToken(token);
      req.user = {
        id: decoded.userId,
        tenantId: decoded.tenantId,
        roles: [decoded.role], // Convert to array for consistency
      };
      return next();
    }
    
    // If no token and not in development, unauthorized
    throw new Error(config.errorMessages.UNAUTHORIZED);
  } catch (error) {
    if (config.env.isDevelopment) {
      console.warn('Auth error:', error);
      // Allow request to proceed in development with mock user
      req.user = {
        id: 'dev-user-1',
        tenantId: config.tenant.defaultTenantId,
        roles: [UserRole.ADMIN],
      };
      return next();
    }
    return next(error);
  }
};

export const createContext = ({ req }: { req: Request }): AuthContext => {
  if (!req.user) {
    throw new GraphQLError(config.errorMessages.UNAUTHORIZED, {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  return {
    userId: req.user.id,
    tenantId: req.user.tenantId,
    userRole: req.user.roles[0],
  };
};

export const checkRole = (context: AuthContext, allowedRoles: UserRole[]): void => {
  if (!allowedRoles.includes(context.userRole)) {
    throw new GraphQLError(config.errorMessages.FORBIDDEN, {
      extensions: { code: 'FORBIDDEN' },
    });
  }
};

export const createWebSocketContext = (ctx: any): AuthContext => {
  // For development, use a mock user if no token
  if (config.env.isDevelopment && !ctx.connectionParams?.authorization) {
    return {
      userId: 'dev-user-1',
      tenantId: config.tenant.defaultTenantId,
      userRole: UserRole.ADMIN,
    };
  }

  const token = ctx.connectionParams?.authorization?.split(' ')[1];
  if (!token) {
    throw new GraphQLError(config.errorMessages.UNAUTHORIZED, {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  const decoded = verifyToken(token);
  return {
    userId: decoded.userId,
    tenantId: decoded.tenantId,
    userRole: decoded.role,
  };
}; 