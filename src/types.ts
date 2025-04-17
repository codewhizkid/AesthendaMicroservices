import { Document } from 'mongoose';

// Define interfaces here since models don't exist yet
export interface IEvent extends Document {
  title: string;
  startTime: Date;
  endTime: Date;
  status: EventStatus;
}

export interface IResource extends Document {
  title: string;
  type: string;
  availability: AvailabilityInput[];
}

export enum EventStatus {
  CONFIRMED = 'CONFIRMED',
  TENTATIVE = 'TENTATIVE',
  CANCELLED = 'CANCELLED'
}

export enum EventType {
  MEETING = 'MEETING',
  APPOINTMENT = 'APPOINTMENT',
  BREAK = 'BREAK',
  OTHER = 'OTHER'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STYLIST = 'STYLIST',
  CLIENT = 'CLIENT'
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
  metadata?: Record<string, any>;
}

export interface ResourceInput {
  title: string;
  type: string;
  description?: string;
  availability: AvailabilityInput[];
  metadata?: Record<string, any>;
}

export interface AvailabilityInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface BusinessHoursInput {
  tenantId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOpen: boolean;
}

export interface BusinessHours {
  tenantId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOpen: boolean;
}

export interface PaginationInput {
  page: number;
  limit: number;
}

export interface CalendarViewFilter {
  startDate: Date;
  endDate: Date;
  status?: EventStatus;
  resourceId?: string;
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

export interface Context {
  user?: {
    id: string;
    tenantId: string;
    roles: string[];
  };
}