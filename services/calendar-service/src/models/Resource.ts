import mongoose, { Document, Schema } from 'mongoose';
import { BusinessHours } from '../types';

/**
 * Availability time slot interface
 */
export interface Availability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

/**
 * Base Resource interface without MongoDB-specific fields
 * Used for direct data manipulation and GraphQL type mapping
 */
export interface ResourceBase {
  title: string;
  type: string;
  description?: string;
  tenantId: string;
  availability: Availability[];
  businessHours?: BusinessHours[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose document interface extending the base Resource interface
 * Used for MongoDB operations and Mongoose schema definition
 */
export interface IResource extends ResourceBase, Document {
  // Add any Mongoose-specific methods here
}

// Schema for the Availability subdocument
const availabilitySchema = new Schema<Availability>({
  dayOfWeek: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 6,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value'
    }
  },
  startTime: { 
    type: String, 
    required: true,
    validate: {
      validator: (v: string) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
      message: props => `${props.value} is not a valid time format. Use HH:mm`
    }
  },
  endTime: { 
    type: String, 
    required: true,
    validate: {
      validator: (v: string) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
      message: props => `${props.value} is not a valid time format. Use HH:mm`
    }
  }
}, { _id: false });

// Schema for Break periods
const businessBreakSchema = new Schema({
  startTime: { 
    type: String, 
    required: true,
    validate: {
      validator: (v: string) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
      message: props => `${props.value} is not a valid time format. Use HH:mm`
    }
  },
  endTime: { 
    type: String, 
    required: true,
    validate: {
      validator: (v: string) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
      message: props => `${props.value} is not a valid time format. Use HH:mm`
    }
  },
  reason: String
}, { _id: false });

// Schema for Business Hours
const businessHoursSchema = new Schema({
  dayOfWeek: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 6,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value'
    }
  },
  isOpen: { type: Boolean, required: true },
  openTime: { 
    type: String, 
    required: true,
    validate: {
      validator: (v: string) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
      message: props => `${props.value} is not a valid time format. Use HH:mm`
    }
  },
  closeTime: { 
    type: String, 
    required: true,
    validate: {
      validator: (v: string) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
      message: props => `${props.value} is not a valid time format. Use HH:mm`
    }
  },
  breaks: [businessBreakSchema]
}, { _id: false });

// Main Resource schema
const resourceSchema = new Schema<IResource>(
  {
    title: { type: String, required: true },
    type: { type: String, required: true },
    description: String,
    tenantId: { type: String, required: true, index: true },
    availability: [availabilitySchema],
    businessHours: [businessHoursSchema],
    metadata: Schema.Types.Mixed
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient querying
resourceSchema.index({ tenantId: 1, type: 1 });
resourceSchema.index({ 'availability.dayOfWeek': 1, tenantId: 1 });

// Instance methods can be added here
resourceSchema.methods.isAvailableOn = function(dayOfWeek: number): boolean {
  return this.availability.some((slot: Availability) => slot.dayOfWeek === dayOfWeek);
};

// Static methods for the model
resourceSchema.statics.findByType = function(tenantId: string, type: string) {
  return this.find({ tenantId, type });
};

export const Resource = mongoose.model<IResource>('Resource', resourceSchema);