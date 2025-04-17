/**
 * Standardized error handling for Aesthenda Microservices
 * 
 * This module provides consistent error types, codes, and handling
 * patterns that can be used across all services.
 */

import { GraphQLError } from 'graphql';

/**
 * Error codes used across all services
 */
export enum ErrorCode {
  // General errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  BAD_REQUEST = 'BAD_REQUEST',
  
  // Authentication errors
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Authorization errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  TENANT_ACCESS_DENIED = 'TENANT_ACCESS_DENIED',
  
  // Tenant errors
  TENANT_NOT_FOUND = 'TENANT_NOT_FOUND',
  TENANT_INACTIVE = 'TENANT_INACTIVE',
  
  // User errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  
  // Data errors
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  INVALID_DATA = 'INVALID_DATA',
  RELATED_ENTITY_NOT_FOUND = 'RELATED_ENTITY_NOT_FOUND',
  
  // Service-specific errors
  APPOINTMENT_NOT_FOUND = 'APPOINTMENT_NOT_FOUND',
  APPOINTMENT_UNAVAILABLE = 'APPOINTMENT_UNAVAILABLE',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  NOTIFICATION_FAILED = 'NOTIFICATION_FAILED'
}

/**
 * Error metadata interface 
 */
export interface ErrorMetadata {
  code: ErrorCode;
  service?: string;
  field?: string;
  tenantId?: string;
  data?: Record<string, unknown>;
}

/**
 * Base service error class with standardized metadata
 */
export class ServiceError extends Error {
  code: ErrorCode;
  service?: string;
  field?: string;
  tenantId?: string;
  data?: Record<string, unknown>;
  status?: number;
  
  constructor(message: string, metadata: ErrorMetadata, status?: number) {
    super(message);
    this.name = 'ServiceError';
    this.code = metadata.code;
    this.service = metadata.service;
    this.field = metadata.field;
    this.tenantId = metadata.tenantId;
    this.data = metadata.data;
    this.status = status;
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, ServiceError);
  }
  
  /**
   * Convert to GraphQL error format
   */
  toGraphQLError(): GraphQLError {
    return new GraphQLError(this.message, {
      extensions: {
        code: this.code,
        service: this.service,
        field: this.field,
        tenantId: this.tenantId,
        ...(this.data && { data: this.data })
      }
    });
  }
  
  /**
   * Convert to REST API error response
   */
  toRestError(): { 
    error: { 
      message: string; 
      code: ErrorCode; 
      service?: string;
      field?: string;
      data?: Record<string, unknown>;
    };
    status: number;
  } {
    return {
      error: {
        message: this.message,
        code: this.code,
        service: this.service,
        field: this.field,
        ...(this.data && { data: this.data })
      },
      status: this.status || this.getDefaultStatus()
    };
  }
  
  /**
   * Get default HTTP status code based on error code
   */
  private getDefaultStatus(): number {
    switch (this.code) {
      case ErrorCode.NOT_FOUND:
      case ErrorCode.USER_NOT_FOUND:
      case ErrorCode.TENANT_NOT_FOUND:
      case ErrorCode.APPOINTMENT_NOT_FOUND:
      case ErrorCode.RELATED_ENTITY_NOT_FOUND:
        return 404;
        
      case ErrorCode.UNAUTHORIZED:
      case ErrorCode.AUTHENTICATION_FAILED:
      case ErrorCode.TOKEN_EXPIRED:
      case ErrorCode.INVALID_TOKEN:
      case ErrorCode.INVALID_CREDENTIALS:
        return 401;
        
      case ErrorCode.FORBIDDEN:
      case ErrorCode.INSUFFICIENT_PERMISSIONS:
      case ErrorCode.TENANT_ACCESS_DENIED:
        return 403;
        
      case ErrorCode.VALIDATION_ERROR:
      case ErrorCode.BAD_REQUEST:
      case ErrorCode.INVALID_DATA:
        return 400;
        
      case ErrorCode.DUPLICATE_ENTRY:
      case ErrorCode.USER_ALREADY_EXISTS:
      case ErrorCode.EMAIL_ALREADY_EXISTS:
        return 409;
        
      default:
        return 500;
    }
  }
}

/**
 * Error handling middleware for Express
 */
export function errorHandlerMiddleware() {
  return (err: unknown, req: unknown, res: any, next: (error?: unknown) => void) => {
    // Skip if headers already sent
    if (res.headersSent) {
      return next(err);
    }
    
    // Handle ServiceError instances
    if (err instanceof ServiceError) {
      const { error, status } = err.toRestError();
      return res.status(status).json({ error });
    }
    
    // Handle other errors
    console.error('Unhandled error:', err);
    
    res.status(500).json({
      error: {
        message: 'An unexpected error occurred',
        code: ErrorCode.INTERNAL_ERROR
      }
    });
  };
}

/**
 * Format GraphQL errors consistently
 */
export function formatGraphQLError(error: GraphQLError): GraphQLError {
  console.error('GraphQL Error:', error);
  
  // If it's already a ServiceError that was converted to GraphQL format
  if (error.extensions?.code && 
      Object.values(ErrorCode).includes(error.extensions.code as ErrorCode)) {
    return error;
  }
  
  // Handle Apollo's built-in errors
  if (error.extensions?.code) {
    switch (error.extensions.code) {
      case 'GRAPHQL_VALIDATION_FAILED':
        return new GraphQLError(error.message, {
          extensions: {
            code: ErrorCode.VALIDATION_ERROR,
            originalError: error.extensions
          }
        });
        
      case 'UNAUTHENTICATED':
        return new GraphQLError(error.message, {
          extensions: {
            code: ErrorCode.UNAUTHORIZED,
            originalError: error.extensions
          }
        });
        
      case 'FORBIDDEN':
        return new GraphQLError(error.message, {
          extensions: {
            code: ErrorCode.FORBIDDEN,
            originalError: error.extensions
          }
        });
        
      case 'BAD_USER_INPUT':
        return new GraphQLError(error.message, {
          extensions: {
            code: ErrorCode.BAD_REQUEST,
            originalError: error.extensions
          }
        });
        
      default:
        // Fall through to default handler
        break;
    }
  }
  
  // Default error handling
  return new GraphQLError(error.message, {
    extensions: {
      code: ErrorCode.INTERNAL_ERROR,
      originalError: error.extensions
    }
  });
}

/**
 * Create an error factory for a specific service
 */
export function createErrorFactory(serviceName: string) {
  return {
    /**
     * Create a new ServiceError with the service name pre-filled
     */
    create(message: string, metadata: Omit<ErrorMetadata, 'service'>, status?: number): ServiceError {
      return new ServiceError(message, { ...metadata, service: serviceName }, status);
    },
    
    /**
     * Create a not found error
     */
    notFound(entity: string, id?: string): ServiceError {
      const message = id 
        ? `${entity} not found with id: ${id}`
        : `${entity} not found`;
      
      return this.create(message, { code: ErrorCode.NOT_FOUND });
    },
    
    /**
     * Create an unauthorized error
     */
    unauthorized(message = 'Authentication required'): ServiceError {
      return this.create(message, { code: ErrorCode.UNAUTHORIZED }, 401);
    },
    
    /**
     * Create a forbidden error
     */
    forbidden(message = 'Insufficient permissions'): ServiceError {
      return this.create(message, { code: ErrorCode.FORBIDDEN }, 403);
    },
    
    /**
     * Create a validation error
     */
    validation(message: string, field?: string): ServiceError {
      return this.create(message, { 
        code: ErrorCode.VALIDATION_ERROR, 
        field 
      }, 400);
    },
    
    /**
     * Create a tenant access denied error
     */
    tenantAccessDenied(tenantId: string): ServiceError {
      return this.create(
        `Access denied for tenant: ${tenantId}`, 
        { code: ErrorCode.TENANT_ACCESS_DENIED, tenantId },
        403
      );
    }
  };
} 