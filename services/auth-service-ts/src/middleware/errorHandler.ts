import { Request, Response, NextFunction } from 'express';
import { GraphQLError, GraphQLFormattedError } from 'graphql';
import config from '../config';
import { ErrorType, ApplicationError } from '../types';

/**
 * Formats GraphQL errors for client response
 */
export const formatGraphQLError = (error: GraphQLError): GraphQLFormattedError => {
  console.error(`GraphQL Error: ${error.message}`, error.originalError || error);
  
  // Extract extensions from the original error
  const extensions: Record<string, any> = { 
    code: 'INTERNAL_SERVER_ERROR',
    ...error.extensions 
  };
  
  // For debugging in development
  if (config.env.isDevelopment && error.originalError) {
    extensions.stack = error.originalError.stack;
  }
  
  // Ensure sensitive information is not leaked
  delete extensions.exception;
  
  return {
    message: error.message,
    path: error.path,
    extensions
  };
};

/**
 * Express middleware to handle 404 Not Found errors
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new ApplicationError(
    `Not found: ${req.method} ${req.originalUrl}`,
    ErrorType.NOT_FOUND,
    404
  );
  next(error);
};

/**
 * Express middleware to handle all errors
 */
export const errorHandler = (
  err: Error | ApplicationError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default values for error response
  let statusCode = 500;
  let message = config.errorMessages.INTERNAL_ERROR;
  let errorType = ErrorType.SERVER;
  let details: any = undefined;
  
  // If it's our ApplicationError, extract the details
  if (err instanceof ApplicationError) {
    statusCode = err.statusCode;
    message = err.message;
    errorType = err.type;
    details = err.details;
  } else if (err.name === 'ValidationError') {
    // Handle mongoose validation errors
    statusCode = 400;
    message = 'Validation Error';
    errorType = ErrorType.VALIDATION;
    details = err.message;
  } else if (err.name === 'JsonWebTokenError') {
    // Handle JWT errors
    statusCode = 401;
    message = config.errorMessages.UNAUTHORIZED;
    errorType = ErrorType.AUTHENTICATION;
  }
  
  // Log the error
  console.error(`[ERROR] ${errorType}: ${message}`, {
    statusCode,
    path: req.path,
    method: req.method,
    details,
    // Include tenant info if available
    tenantId: req.user?.tenantId || 'unknown',
    userId: req.user?.id || 'anonymous'
  });
  
  // In development, include stack trace
  if (config.env.isDevelopment) {
    console.error(err.stack);
  }
  
  // Send the error response
  res.status(statusCode).json({
    error: {
      message,
      type: errorType,
      ...(details && { details }),
      ...(config.env.isDevelopment && err.stack ? { stack: err.stack } : {})
    }
  });
}; 