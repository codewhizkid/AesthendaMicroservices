export type EventStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type EventType = 'APPOINTMENT' | 'BLOCKOUT' | 'SPECIAL_EVENT';
export type ResourceType = 'STYLIST' | 'ROOM' | 'EQUIPMENT';
export type RecurrenceType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: EventStatus;
  type: EventType;
  resourceId?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  availability: Availability[];
}

export interface Availability {
  startTime: string;
  endTime: string;
  recurrence?: RecurrenceType;
}

export interface Blockout {
  id: string;
  startTime: string;
  endTime: string;
  reason: string;
  resourceId?: string;
}

export interface BusinessHours {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOpen: boolean;
}

export interface CalendarViewFilter {
  startDate: Date;
  endDate: Date;
  resourceIds?: string[];
  eventTypes?: EventType[];
}

export interface CalendarView {
  events: CalendarEvent[];
  resources: Resource[];
  blockouts: Blockout[];
  businessHours: BusinessHours[];
}

export interface CreateEventInput {
  title: string;
  startTime: string;
  endTime: string;
  type: EventType;
  resourceId?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface UpdateEventInput {
  title?: string;
  startTime?: string;
  endTime?: string;
  status?: EventStatus;
  type?: EventType;
  resourceId?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface CreateBlockoutInput {
  startTime: string;
  endTime: string;
  reason: string;
  resourceId?: string;
}

export interface UpdateBusinessHoursInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOpen: boolean;
}

export interface CalendarUpdatePayload {
  type: 'CREATED' | 'UPDATED' | 'DELETED';
  eventId: string;
  event?: CalendarEvent;
} 