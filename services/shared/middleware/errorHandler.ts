import { Request, Response, NextFunction } from 'express';

/**
 * Standard error codes used across all services
 */
export enum ErrorCode {
  // Generic errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Tenant related errors
  TENANT_REQUIRED = 'TENANT_REQUIRED',
  TENANT_NOT_FOUND = 'TENANT_NOT_FOUND',
  TENANT_INACTIVE = 'TENANT_INACTIVE',
  TENANT_LIMIT_EXCEEDED = 'TENANT_LIMIT_EXCEEDED',
  
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // Business logic errors
  RESOURCE_EXISTS = 'RESOURCE_EXISTS',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  DEPENDENCY_ERROR = 'DEPENDENCY_ERROR',
  
  // Service related errors
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

/**
 * HTTP status codes mapped to error codes
 */
export const STATUS_CODES: Record<ErrorCode, number> = {
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.VALIDATION_ERROR]: 400,
  
  [ErrorCode.TENANT_REQUIRED]: 400,
  [ErrorCode.TENANT_NOT_FOUND]: 404,
  [ErrorCode.TENANT_INACTIVE]: 403,
  [ErrorCode.TENANT_LIMIT_EXCEEDED]: 403,
  
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.INVALID_TOKEN]: 401,
  
  [ErrorCode.RESOURCE_EXISTS]: 409,
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.OPERATION_NOT_ALLOWED]: 403,
  [ErrorCode.DEPENDENCY_ERROR]: 424,
  
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.TIMEOUT]: 504,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429
};

/**
 * Service error class that includes tenant context
 */
export class ServiceError extends Error {
  code: ErrorCode;
  statusCode: number;
  data?: any;
  tenantId?: string;
  requestId?: string;
  
  constructor(message: string, options: {
    code?: ErrorCode;
    statusCode?: number;
    data?: any;
    tenantId?: string;
    requestId?: string;
  } = {}) {
    super(message);
    this.name = 'ServiceError';
    this.code = options.code || ErrorCode.INTERNAL_SERVER_ERROR;
    this.statusCode = options.statusCode || STATUS_CODES[this.code];
    this.data = options.data;
    this.tenantId = options.tenantId;
    this.requestId = options.requestId;
    
    // Ensures proper instanceof checks work in TypeScript
    Object.setPrototypeOf(this, ServiceError.prototype);
  }
}

/**
 * Options for error handler middleware
 */
export interface ErrorHandlerOptions {
  /** Whether to include stack traces in error responses */
  includeStackTrace?: boolean;
  
  /** Function to log errors */
  logError?: (error: Error, request: Request) => void;
}

/**
 * Create a standardized error handler middleware
 */
export const createErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const { 
    includeStackTrace = process.env.NODE_ENV === 'development',
    logError = defaultErrorLogger
  } = options;
  
  return (err: Error | ServiceError, req: Request, res: Response, next: NextFunction) => {
    // Log the error
    logError(err, req);
    
    // Define default status and error information
    const statusCode = (err as ServiceError).statusCode || 500;
    const errorCode = (err as ServiceError).code || ErrorCode.INTERNAL_SERVER_ERROR;
    const message = err.message || 'Internal server error';
    
    // Extract tenant context if available
    const tenantId = (err as ServiceError).tenantId || (req as any).tenantId;
    const requestId = (err as ServiceError).requestId || req.headers['x-request-id'];
    
    // Build the error response
    const errorResponse: Record<string, any> = {
      success: false,
      error: message,
      code: errorCode,
      requestId
    };
    
    // Include stack trace in development
    if (includeStackTrace && err.stack) {
      errorResponse.stack = err.stack;
    }
    
    // Include additional error data if available
    if ((err as ServiceError).data) {
      errorResponse.data = (err as ServiceError).data;
    }
    
    // Set tenant context header if available
    if (tenantId) {
      res.set('X-Tenant-ID', tenantId.toString());
    }
    
    // Set request ID header if available
    if (requestId) {
      res.set('X-Request-ID', requestId.toString());
    }
    
    // Send the error response
    res.status(statusCode).json(errorResponse);
  };
};

/**
 * Default error logger function
 */
const defaultErrorLogger = (error: Error, request: Request) => {
  const tenantId = (request as any).tenantId || (error as ServiceError).tenantId;
  const requestId = request.headers['x-request-id'] || (error as ServiceError).requestId;
  
  console.error({
    message: error.message,
    code: (error as ServiceError).code,
    stack: error.stack,
    tenantId,
    requestId,
    path: request.path,
    method: request.method,
    timestamp: new Date().toISOString()
  });
};

/**
 * Middleware to handle 404 errors
 */
export const notFoundHandler = (req: Request, res: Response) => {
  const errorResponse = {
    success: false,
    error: 'Route not found',
    code: ErrorCode.NOT_FOUND,
    path: req.path,
    method: req.method
  };
  
  // Add tenant context if available
  const tenantId = (req as any).tenantId;
  if (tenantId) {
    (errorResponse as any).tenantId = tenantId;
    res.set('X-Tenant-ID', tenantId.toString());
  }
  
  res.status(404).json(errorResponse);
};

/**
 * Helper function to create a service error
 */
export const createServiceError = (
  message: string,
  code: ErrorCode,
  data?: any,
  tenantId?: string
): ServiceError => {
  return new ServiceError(message, {
    code,
    data,
    tenantId,
    statusCode: STATUS_CODES[code]
  });
}; 