import mongoose, { Document } from 'mongoose';
import { EventStatus } from '../types';

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
  status: EventStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
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
    metadata: mongoose.Schema.Types.Mixed
  },
  {
    timestamps: true
  }
);

// Compound index for efficient querying of events by tenant and date range
eventSchema.index({ tenantId: 1, startTime: 1, endTime: 1 });

export const Event = mongoose.model<IEvent>('Event', eventSchema); 