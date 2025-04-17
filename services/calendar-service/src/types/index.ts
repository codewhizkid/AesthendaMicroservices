import { ObjectId, Document } from 'mongoose';

export interface IContext {
  tenantId: string;
  userId?: string;
  userRole?: string;
}

export enum EventStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED'
}

export enum EventType {
  APPOINTMENT = 'APPOINTMENT',
  MEETING = 'MEETING',
  BLOCKOUT = 'BLOCKOUT',
  OTHER = 'OTHER',
}

export enum ResourceType {
  STYLIST = 'STYLIST',
  ROOM = 'ROOM',
  EQUIPMENT = 'EQUIPMENT'
}

export enum RecurrenceType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  USER = 'USER',
}

export interface CalendarViewFilter {
  startDate: Date;
  endDate: Date;
  resourceIds?: string[];
  eventTypes?: EventType[];
}

export interface Availability {
  startTime: string;
  endTime: string;
  recurrence?: RecurrenceType;
}

export interface BusinessHours {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOpen: boolean;
  specialDate?: Date;
  metadata?: Record<string, any>;
}

export interface QueryFilters {
  tenantId: string;
  startTime: { $lte: Date };
  endTime: { $gte: Date };
  resourceId?: { $in: string[] };
  type?: { $in: string[] };
}

export interface AuthContext {
  tenantId: string;
  userId: string;
  roles: UserRole[];
}

export interface EventInput {
  title: string;
  startTime: Date;
  endTime: Date;
  type: EventType;
  description?: string;
  resourceId?: string;
  clientId?: string;
  stylistId?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface ResourceInput {
  title: string;
  type: string;
  description?: string;
  availability?: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  metadata?: Record<string, any>;
}

export interface AvailabilityInput {
  startTime: string;
  endTime: string;
  recurrence?: RecurrenceType;
}

export interface BusinessHoursInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOpen: boolean;
  metadata?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IEvent extends Document {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  recurringRule?: string;
  tenantId: string;
  createdBy: string;
  attendees?: string[];
  location?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  metadata?: Record<string, any>;
}

export interface IResource extends Document {
  title: string;
  type: string;
  description?: string;
  tenantId: string;
  availability: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  metadata?: Record<string, any>;
}

export interface Context {
  user?: {
    id: string;
    role: string;
    tenantId: string;
  };
}