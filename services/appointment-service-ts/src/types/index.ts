import { IAppointment, AppointmentStatus } from "../models/Appointment";

/**
 * GraphQL context interface
 */
export interface GraphQLContext {
  tenantId: string;
  tenant?: any;
  userId?: string;
  userRole?: string;
  stylistId?: string;
  headers: Record<string, string>;
}

/**
 * Input types for appointments
 */
export interface AppointmentInput {
  userId: string;
  stylistId: string;
  serviceIds: string[];
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  notes?: string;
}

export interface AppointmentUpdateInput {
  id: string;
  stylistId?: string;
  serviceIds?: string[];
  date?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  status?: AppointmentStatus;
  notes?: string;
  cancellationReason?: string;
}

export interface CancelAppointmentInput {
  id: string;
  cancellationReason?: string;
}

export interface AppointmentFilterInput {
  stylistId?: string;
  userId?: string;
  status?: AppointmentStatus;
  fromDate?: string;
  toDate?: string;
}

export interface AvailabilityInput {
  stylistId: string;
  date: string;
}

/**
 * Result types
 */
export interface AppointmentResult {
  success: boolean;
  message?: string;
  appointment?: IAppointment;
}

export interface AppointmentsResult {
  appointments: IAppointment[];
  totalCount: number;
}

export interface AvailabilitySlot {
  stylistId: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface AvailabilityResult {
  slots: AvailabilitySlot[];
  date: string;
  stylistId: string;
}

/**
 * Event types for messaging
 */
export enum AppointmentEventType {
  CREATED = "APPOINTMENT_CREATED",
  UPDATED = "APPOINTMENT_UPDATED",
  CANCELLED = "APPOINTMENT_CANCELLED",
  CONFIRMED = "APPOINTMENT_CONFIRMED",
  COMPLETED = "APPOINTMENT_COMPLETED",
  NO_SHOW = "APPOINTMENT_NO_SHOW",
}

export interface AppointmentEvent {
  type: AppointmentEventType;
  appointmentId: string;
  tenantId: string;
  userId: string;
  stylistId: string;
  date: string;
  status: AppointmentStatus;
  timestamp: string;
}

/**
 * Error types
 */
export enum ErrorCode {
  // General errors
  INTERNAL_ERROR = "INTERNAL_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",

  // Business logic errors
  APPOINTMENT_NOT_FOUND = "APPOINTMENT_NOT_FOUND",
  INVALID_APPOINTMENT_TIME = "INVALID_APPOINTMENT_TIME",
  STYLIST_UNAVAILABLE = "STYLIST_UNAVAILABLE",
  DOUBLE_BOOKING = "DOUBLE_BOOKING",
  PAST_APPOINTMENT = "PAST_APPOINTMENT",
  INVALID_STATUS_TRANSITION = "INVALID_STATUS_TRANSITION",
}

export class AppointmentError extends Error {
  code: ErrorCode;

  constructor(message: string, code: ErrorCode) {
    super(message);
    this.name = "AppointmentError";
    this.code = code;

    // Ensures proper instanceof checks work in TypeScript
    Object.setPrototypeOf(this, AppointmentError.prototype);
  }
}
