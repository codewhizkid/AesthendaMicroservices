import { Document } from 'mongoose';
import { IEvent } from './models/Event';
import { IResource } from './models/Resource';

// Event type enum
export enum EventType {
  APPOINTMENT = 'APPOINTMENT',
  MEETING = 'MEETING',
  BLOCK = 'BLOCK',
  BREAKTIME = 'BREAKTIME',
  HOLIDAY = 'HOLIDAY',
  OTHER = 'OTHER'
}

// Event status enum
export enum EventStatus {
  CONFIRMED = 'CONFIRMED',
  TENTATIVE = 'TENTATIVE',
  CANCELLED = 'CANCELLED'
}

// User roles enum
export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  CLIENT = 'CLIENT',
  GUEST = 'GUEST'
}

// Business hours interface
export interface BusinessHours {
  dayOfWeek: number; // 0-6, where 0 is Sunday
  isOpen: boolean;
  openTime: string; // format: "HH:MM" in 24-hour
  closeTime: string; // format: "HH:MM" in 24-hour
  breaks?: BusinessBreak[];
}

// Business break periods
export interface BusinessBreak {
  startTime: string; // format: "HH:MM" in 24-hour
  endTime: string; // format: "HH:MM" in 24-hour
  reason?: string;
}

export interface EventInput {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  allDay?: boolean;
  recurringRule?: string;
  attendees?: string[];
  location?: string;
  status?: EventStatus;
  type?: EventType;
  metadata?: Record<string, any>;
}

export interface ResourceInput {
  title: string;
  type: string;
  description?: string;
  availability: AvailabilityInput[];
  businessHours?: BusinessHours[];
  metadata?: Record<string, any>;
}

export interface AvailabilityInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

// Improved pagination with constraints and defaults
export interface PaginationInput {
  page?: number; // 1-based pagination
  limit?: number; // items per page
}

// Default pagination values
export const DEFAULT_PAGINATION: Required<PaginationInput> = {
  page: 1,
  limit: 20
};

// Max pagination values for security
export const MAX_PAGINATION = {
  limit: 100
};

// Helper function to sanitize pagination input
export function sanitizePagination(input?: PaginationInput): Required<PaginationInput> {
  const pagination = { ...DEFAULT_PAGINATION };
  
  if (input?.page !== undefined && input.page > 0) {
    pagination.page = input.page;
  }
  
  if (input?.limit !== undefined && input.limit > 0) {
    pagination.limit = Math.min(input.limit, MAX_PAGINATION.limit);
  }
  
  return pagination;
}

export interface CalendarViewFilter {
  startDate: Date;
  endDate: Date;
  status?: EventStatus;
  resourceId?: string;
  eventType?: EventType;
}

export interface PageInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface EventConnection {
  edges: IEvent[];
  pageInfo: PageInfo;
}

export interface ResourceConnection {
  edges: IResource[];
  pageInfo: PageInfo;
}

// Improved Context interface with required user property
export interface Context {
  user: {
    id: string;
    tenantId: string;
    roles: UserRole[];
  };
}

// Request context with optional user for auth middleware
export interface RequestContext {
  user?: {
    id: string;
    tenantId: string;
    roles: UserRole[];
  };
} 