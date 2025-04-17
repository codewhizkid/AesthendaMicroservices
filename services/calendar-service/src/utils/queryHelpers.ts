/**
 * Helper functions for building MongoDB queries from GraphQL input
 */

// Default values for pagination
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100; // Prevent excessive query size

// Interface for pagination parameters
export interface PaginationParams {
  limit: number;
  skip: number;
}

// GraphQL pagination input type
export interface PaginationInput {
  page?: number;
  limit?: number;
}

/**
 * Build pagination parameters from GraphQL input
 * @param pagination Pagination input from GraphQL
 * @returns Object with limit and skip values
 */
export function buildPagination(pagination?: PaginationInput): PaginationParams {
  // Default values
  let page = DEFAULT_PAGE;
  let limit = DEFAULT_LIMIT;

  // Override with input values if provided
  if (pagination) {
    if (pagination.page && pagination.page > 0) {
      page = pagination.page;
    }

    if (pagination.limit && pagination.limit > 0) {
      // Enforce maximum limit
      limit = Math.min(pagination.limit, MAX_LIMIT);
    }
  }

  // Calculate skip value
  const skip = (page - 1) * limit;

  return { limit, skip };
}

/**
 * Build MongoDB filter object from GraphQL input
 * @param filter Filter object from GraphQL
 * @returns MongoDB query filter
 */
export function buildFilters(filter: Record<string, any> = {}): Record<string, any> {
  const queryFilter: Record<string, any> = {};
  
  // Process each key in the filter object
  Object.keys(filter).forEach(key => {
    const value = filter[key];
    
    // Skip undefined or null values
    if (value === undefined || value === null) {
      return;
    }
    
    // Handle special cases
    if (key === 'search' && typeof value === 'string') {
      // Example: Implement search across multiple fields
      return;
    }
    
    // Handle date ranges
    if (key === 'startDate' && value instanceof Date) {
      queryFilter.date = queryFilter.date || {};
      queryFilter.date.$gte = value;
      return;
    }
    
    if (key === 'endDate' && value instanceof Date) {
      queryFilter.date = queryFilter.date || {};
      queryFilter.date.$lte = value;
      return;
    }
    
    // Handle arrays for $in queries
    if (Array.isArray(value) && value.length > 0) {
      queryFilter[key] = { $in: value };
      return;
    }
    
    // Default: exact match
    queryFilter[key] = value;
  });
  
  return queryFilter;
} 