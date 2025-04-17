import { AuthContext } from '../middleware/auth';
import { GraphQLError, GraphQLErrorOptions } from 'graphql';
import { errorMessages } from '../config';
import { Document, ModifyResult } from 'mongoose';

export const validateTenantAccess = (context: AuthContext, tenantId: string) => {
  if (context.tenantId !== tenantId) {
    throw new GraphQLError(errorMessages.FORBIDDEN, {
      extensions: { code: 'FORBIDDEN' }
    } as GraphQLErrorOptions);
  }
};

export const formatError = (error: any) => {
  if (error instanceof GraphQLError) {
    return error;
  }

  console.error('Unexpected error:', error);
  return new GraphQLError(errorMessages.INTERNAL_ERROR, {
    extensions: { code: 'INTERNAL_SERVER_ERROR' },
  });
};

export const validatePagination = (page: number, pageSize: number) => {
  if (page < 1) {
    throw new GraphQLError('Page number must be greater than 0', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  if (pageSize < 1 || pageSize > 100) {
    throw new GraphQLError('Page size must be between 1 and 100', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  return {
    skip: (page - 1) * pageSize,
    limit: pageSize,
  };
};

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export const sanitizeSearchQuery = (query: string): string => {
  return query.replace(/[^a-zA-Z0-9\s]/g, '').trim();
};

export const validateDateRange = (startDate: Date, endDate: Date) => {
  if (startDate >= endDate) {
    throw new GraphQLError('End date must be after start date', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
};

export const isOverlapping = (
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean => {
  return start1 < end2 && end1 > start2;
};

export function toPlainObject<T>(doc: Document<any, any, any> | ModifyResult<Document<any, any, any> & T>): Record<string, any> {
  if (!doc) return {};
  
  // Handle ModifyResult type
  if ('value' in doc && doc.value) {
    return doc.value.toObject ? doc.value.toObject() : JSON.parse(JSON.stringify(doc.value));
  }
  
  // Handle Document type
  if ('toObject' in doc && typeof doc.toObject === 'function') {
    return doc.toObject();
  }
  
  // Fallback to JSON conversion
  return JSON.parse(JSON.stringify(doc));
}