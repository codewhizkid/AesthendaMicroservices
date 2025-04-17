import { Request, Response, NextFunction } from 'express';
import { GraphQLError } from 'graphql';
import { errorMessages } from '../config';

// Custom error class with status code
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// GraphQL error formatter
export const formatGraphQLError = (error: GraphQLError) => {
  // Handle errors thrown with AppError
  if (error.originalError instanceof AppError) {
    return {
      message: error.message,
      path: error.path,
      extensions: {
        code: getErrorCode(error.originalError.statusCode),
        statusCode: error.originalError.statusCode,
      },
    };
  }

  // Default error formatting
  return {
    message: error.message || errorMessages.INTERNAL_ERROR,
    path: error.path,
    extensions: {
      code: 'INTERNAL_SERVER_ERROR',
      exception: error.extensions?.exception ? {
        stacktrace: (error.extensions.exception as any).stacktrace || [],
      } : undefined,
    },
  };
};

// Get error code from status code
function getErrorCode(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'UNPROCESSABLE_ENTITY';
    default:
      return 'INTERNAL_SERVER_ERROR';
  }
}

// Global error handler middleware for Express
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Handle AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      statusCode: err.statusCode,
      message: err.message,
    });
  }

  // Handle other errors
  return res.status(500).json({
    status: 'error',
    statusCode: 500,
    message: errorMessages.INTERNAL_ERROR,
  });
};

// 404 Not Found handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const err = new AppError(`Route not found: ${req.originalUrl}`, 404);
  next(err);
};

// Helper to create standard errors
export const createError = {
  badRequest: (message = errorMessages.INVALID_INPUT) => new AppError(message, 400),
  unauthorized: (message = errorMessages.UNAUTHORIZED) => new AppError(message, 401),
  forbidden: (message = errorMessages.FORBIDDEN) => new AppError(message, 403),
  notFound: (message = errorMessages.NOT_FOUND) => new AppError(message, 404),
  conflict: (message = 'Resource already exists') => new AppError(message, 409),
  internal: (message = errorMessages.INTERNAL_ERROR) => new AppError(message, 500),
};