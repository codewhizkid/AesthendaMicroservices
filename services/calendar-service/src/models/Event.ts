import mongoose, { Document } from 'mongoose';
import { EventStatus, EventType } from '../types';

/**
 * Base Event interface without MongoDB-specific fields
 * Used for direct data manipulation and GraphQL type mapping
 */
export interface EventBase {
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
  status: EventStatus;
  type: EventType;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose document interface extending the base Event interface
 * Used for MongoDB operations and Mongoose schema definition
 */
export interface IEvent extends EventBase, Document {
  // Add any Mongoose-specific fields or methods here
}

const eventSchema = new mongoose.Schema<IEvent>(
  {
    title: { type: String, required: true },
    description: String,
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    allDay: { type: Boolean, default: false },
    recurringRule: String,
    tenantId: { type: String, required: true, index: true },
    createdBy: { type: String, required: true },
    attendees: [String],
    location: String,
    status: {
      type: String,
      enum: Object.values(EventStatus),
      default: EventStatus.CONFIRMED
    },
    type: {
      type: String,
      enum: Object.values(EventType),
      default: EventType.APPOINTMENT,
      required: true
    },
    metadata: mongoose.Schema.Types.Mixed
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient querying
eventSchema.index({ tenantId: 1, startTime: 1, endTime: 1 });
eventSchema.index({ tenantId: 1, type: 1 });
eventSchema.index({ tenantId: 1, status: 1 });

// Instance methods can be added here
eventSchema.methods.isUpcoming = function(): boolean {
  return this.startTime > new Date();
};

// Static methods for the model
eventSchema.statics.findUpcoming = function(tenantId: string) {
  return this.find({
    tenantId,
    startTime: { $gte: new Date() },
    status: { $ne: EventStatus.CANCELLED }
  }).sort({ startTime: 1 });
};

export const Event = mongoose.model<IEvent>('Event', eventSchema); 