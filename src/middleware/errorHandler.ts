import { Request, Response, NextFunction } from 'express';
import { GraphQLError } from 'graphql';
import config from '../config';

// Custom error class with status code and additional details
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true; // Used to distinguish operational vs programming errors
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// GraphQL specific error formatter
export const formatGraphQLError = (error: GraphQLError) => {
  console.error('[GraphQL Error]', error);

  // Default error response
  const response = {
    message: error.message,
    code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
    path: error.path,
  };

  // Add details in development environment
  if (config.server.env !== 'production') {
    return {
      ...response,
      stacktrace: error.extensions?.stacktrace || error.stack?.split('\n'),
      details: error.extensions?.exception,
    };
  }

  return response;
};

// Global error handler middleware for Express
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('[API Error]', err);

  // Set default status and message
  let statusCode = 500;
  let message = config.errorMessages.INTERNAL_ERROR;
  let details = undefined;

  // Handle known error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = config.errorMessages.VALIDATION_ERROR;
    details = err;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = config.errorMessages.UNAUTHORIZED;
  }

  // Response structure
  const errorResponse = {
    status: 'error',
    message,
    ...(config.server.env !== 'production' && {
      stack: err.stack,
      details,
    }),
  };

  res.status(statusCode).json(errorResponse);
};

// Custom error handlers for specific scenarios
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

// Error handler specifically for tenant-related errors
export const tenantErrorHandler = (tenantId: string) => {
  if (!tenantId) {
    throw new AppError('Tenant ID is required', 400);
  }
  return tenantId;
};