/**
 * Common types used throughout the service
 */

// User roles
export enum UserRole {
  ADMIN = 'admin',
  STYLIST = 'stylist',
  CLIENT = 'client',
  RECEPTIONIST = 'receptionist',
  SYSTEM = 'system'
}

// Request context type for GraphQL resolvers
export interface Context {
  user: {
    id: string;
    tenantId: string;
    roles: UserRole[];
  };
}

// Pagination input
export interface PaginationInput {
  page?: number;
  limit?: number;
}

// Standard response fields
export interface BaseEntity {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Common error types
export enum ErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  SERVER = 'SERVER',
  TENANT_REQUIRED = 'TENANT_REQUIRED'
}

// Application error class
export class ApplicationError extends Error {
  type: ErrorType;
  statusCode: number;
  details?: any;

  constructor(message: string, type: ErrorType, statusCode: number, details?: any) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApplicationError';
  }
} 