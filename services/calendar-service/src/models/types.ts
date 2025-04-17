/**
 * Shared model types for the calendar service
 * 
 * This file contains TypeScript interfaces that define the core data structures
 * used across multiple parts of the application. These interfaces provide
 * type safety and documentation for our model objects.
 */

import { EventStatus, EventType, UserRole } from '../types';

/**
 * Entity base interface with common fields for all database entities
 */
export interface EntityBase {
  id?: string;
  tenantId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * User entity as referenced by the calendar service
 */
export interface User extends EntityBase {
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  preferences?: Record<string, any>;
}

/**
 * Tenant entity as referenced by the calendar service
 */
export interface Tenant extends EntityBase {
  name: string;
  domain?: string;
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
  settings?: Record<string, any>;
  active: boolean;
}

/**
 * Time slot interface used for availability
 */
export interface TimeSlot {
  startTime: string; // Format: HH:MM
  endTime: string;   // Format: HH:MM
}

/**
 * Break period interface for business hours
 */
export interface BreakPeriod extends TimeSlot {
  reason?: string;
}

/**
 * Business day schedule
 */
export interface BusinessDay {
  dayOfWeek: number; // 0-6 where 0 is Sunday
  isOpen: boolean;
  openTime: string;  // Format: HH:MM
  closeTime: string; // Format: HH:MM
  breaks?: BreakPeriod[];
}

/**
 * Special date (holiday, special hours) configuration
 */
export interface SpecialDate extends EntityBase {
  date: Date;
  name: string;
  isOpen: boolean;
  openTime?: string;  // Format: HH:MM
  closeTime?: string; // Format: HH:MM
  allDay: boolean;
}

/**
 * Event attendee with status
 */
export interface EventAttendee {
  userId: string;
  status: 'accepted' | 'declined' | 'tentative' | 'pending';
  notified: boolean;
  responseDate?: Date;
}

/**
 * Notification settings for events
 */
export interface NotificationSettings {
  enabled: boolean;
  notifyBefore: number; // Minutes before event
  notifyChannels: ('email' | 'sms' | 'app')[];
}

/**
 * Booking policy interface
 */
export interface BookingPolicy {
  minAdvanceTime: number; // Minutes
  maxAdvanceTime: number; // Minutes
  minDuration: number;    // Minutes
  maxDuration: number;    // Minutes
  allowRecurring: boolean;
  allowMultipleBookings: boolean;
  requireApproval: boolean;
}

/**
 * Resource category interface
 */
export interface ResourceCategory extends EntityBase {
  name: string;
  description?: string;
  parentId?: string;
  metadata?: Record<string, any>;
}

/**
 * Resource availability interface
 */
export interface ResourceAvailability {
  resourceId: string;
  startTime: Date;
  endTime: Date;
  status: 'available' | 'busy' | 'tentative' | 'unavailable';
}

/**
 * Search criteria for events
 */
export interface EventSearchCriteria {
  startDate?: Date;
  endDate?: Date;
  resourceIds?: string[];
  statuses?: EventStatus[];
  types?: EventType[];
  createdBy?: string;
  attendees?: string[];
  searchText?: string;
}

/**
 * Search criteria for resources
 */
export interface ResourceSearchCriteria {
  type?: string;
  categoryId?: string;
  availableOn?: Date;
  searchText?: string;
}

/**
 * System settings for the calendar service
 */
export interface CalendarSettings extends EntityBase {
  defaultViewMode: 'day' | 'week' | 'month' | 'agenda';
  defaultSlotDuration: number; // Minutes
  workWeekStart: number; // 0-6 where 0 is Sunday
  workWeekEnd: number;   // 0-6 where 0 is Sunday
  workDayStart: string;  // Format: HH:MM
  workDayEnd: string;    // Format: HH:MM
  timeZone: string;      // IANA time zone name
  firstDayOfWeek: number; // 0-6 where 0 is Sunday
}

export default {
  EntityBase,
  TimeSlot,
  BreakPeriod,
  BusinessDay,
  EventAttendee,
  NotificationSettings
}; 